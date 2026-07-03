// Outreach campaign engine — the shared "催 MRR / 轉單" blast logic, extracted so
// every project just pushes a recipient list + copy. Junk filtering, dedup,
// dry/test/send safety, pacing, {{placeholder}} rendering and logging live here.
//
// State: an append-only JSONL log (campaign_sends.jsonl) next to the mailer — no
// native dependency, so the critical mail service always boots.
const path = require('path');
const fs = require('fs');

const STORE = path.join(__dirname, 'campaign_sends.jsonl');

function loadAll() {
  try {
    return fs.readFileSync(STORE, 'utf8').split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}
function append(rec) {
  fs.appendFileSync(STORE, JSON.stringify(rec) + '\n');
}

// Deliverability guard — sending to dead domains tanks sender reputation.
const BLOCK_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'noproposal.com', 'mailinator.com']);
const BLOCK_PATTERNS = [/^zz-/i, /^test@/i, /^verified@/i, /^olduser@/i, /^noreply@/i, /^no-reply@/i];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isSendable(email) {
  const e = String(email || '').toLowerCase();
  if (!EMAIL_RE.test(e)) return false;
  if (BLOCK_DOMAINS.has(e.split('@')[1])) return false;
  if (BLOCK_PATTERNS.some((re) => re.test(e))) return false;
  return true;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// {{name}} and {{field}} from recipient.name + recipient.vars.*
function render(tpl, recip) {
  const data = Object.assign(
    { name: (recip.name && String(recip.name).trim()) || String(recip.email || '').split('@')[0] },
    recip.vars || {}
  );
  return String(tpl).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => esc(data[k] != null ? data[k] : ''));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// sendMail is injected (the mailer's own transport) so we reuse one config.
async function handleSend(body, sendMail) {
  const {
    campaign, stage = 1, subject, html, recipients = [],
    from, replyTo, refTag = null, mode = 'dry', testEmail,
  } = body || {};

  if (!campaign || typeof campaign !== 'string') throw new Error('campaign (string) is required');
  if (!subject) throw new Error('subject is required');
  if (!html) throw new Error('html is required');
  if (!Array.isArray(recipients)) throw new Error('recipients must be an array');

  // 1) junk filter
  const junk = [];
  const valid = [];
  for (const r of recipients) {
    if (r && isSendable(r.email)) valid.push(r); else junk.push(r && r.email);
  }

  // 2) dedup against already-sent for this campaign+stage
  const all = loadAll();
  const seen = new Set(
    all.filter((x) => x.campaign === campaign && Number(x.stage) === Number(stage))
      .map((x) => String(x.email).toLowerCase())
  );
  const eligible = valid.filter((r) => !seen.has(String(r.email).toLowerCase()));
  const skippedDup = valid.length - eligible.length;

  const base = { campaign, stage, skippedJunk: junk.length, skippedDup, eligible: eligible.length };

  if (mode === 'dry') {
    return { mode: 'dry', ...base, sampleHtml: eligible[0] ? render(html, eligible[0]) : null };
  }

  if (mode === 'test') {
    if (!testEmail) throw new Error('testEmail is required for mode "test"');
    await sendMail({ to: testEmail, subject, html: render(html, { name: 'Test', email: testEmail }), from, replyTo });
    return { mode: 'test', tested: testEmail, ...base };
  }

  if (mode === 'send') {
    let sent = 0;
    const failed = [];
    for (const r of eligible) {
      try {
        await sendMail({ to: r.email, subject, html: render(html, r), from, replyTo });
        append({ campaign, stage: Number(stage), email: String(r.email).toLowerCase(), ref_tag: refTag, sent_at: new Date().toISOString() });
        sent += 1;
        await sleep(400);
      } catch (e) {
        failed.push({ email: r.email, error: e.message });
      }
    }
    return { mode: 'send', ...base, sent, failed: failed.length, failures: failed };
  }

  throw new Error(`unknown mode: ${mode}`);
}

function handleReport(campaign) {
  if (!campaign) throw new Error('campaign is required');
  const rows = loadAll().filter((x) => x.campaign === campaign);
  const byStage = {};
  for (const r of rows) {
    const s = Number(r.stage) || 1;
    byStage[s] = byStage[s] || { stage: s, count: 0, first_sent: r.sent_at, last_sent: r.sent_at };
    byStage[s].count += 1;
    if (r.sent_at < byStage[s].first_sent) byStage[s].first_sent = r.sent_at;
    if (r.sent_at > byStage[s].last_sent) byStage[s].last_sent = r.sent_at;
  }
  return { campaign, total: rows.length, stages: Object.values(byStage).sort((a, b) => a.stage - b.stage) };
}

module.exports = { handleSend, handleReport, isSendable, render };
