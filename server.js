'use strict';

const http = require('http');
const nodemailer = require('nodemailer');
const { buildHtml, templateNames } = require('./templates');

const PORT = parseInt(process.env.PORT || '4018', 10);

// ─── Helpers ───

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(payload);
}

function requireAuth(req) {
  const token = process.env.MAILER_TOKEN;
  if (!token) return true; // No token configured = open (dev mode)
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return bearer === token;
}

// ─── SMTP Transport (lazy) ───

let transport = null;

function getTransport() {
  if (transport) return transport;

  const host = process.env.SMTP_HOST;
  if (!host) return null; // No SMTP = console fallback

  transport = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transport;
}

function getFrom() {
  return process.env.SMTP_FROM || 'CloudPipe <noreply@isnowfriend.com>';
}

async function sendMail({ to, subject, html }) {
  const smtp = getTransport();

  if (!smtp) {
    console.log('[mailer] DEV MODE — no SMTP configured');
    console.log(`[mailer]   To: ${to}`);
    console.log(`[mailer]   Subject: ${subject}`);
    console.log(`[mailer]   HTML: ${html.slice(0, 200)}...`);
    return { messageId: `dev-${Date.now()}` };
  }

  const info = await smtp.sendMail({
    from: getFrom(),
    to,
    subject,
    html,
  });

  return { messageId: info.messageId };
}

// ─── Routes ───

const routes = {
  'GET /api/health': async (_req, res) => {
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PASS);
    json(res, 200, {
      status: 'ok',
      service: 'mailer',
      smtp: smtpConfigured,
      templates: templateNames,
    });
  },

  'POST /api/send': async (req, res) => {
    if (!requireAuth(req)) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    const body = await readBody(req);
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return json(res, 400, { error: 'Missing required fields: to, subject, html' });
    }

    const result = await sendMail({ to, subject, html });
    json(res, 200, { success: true, messageId: result.messageId });
  },

  'POST /api/send-template': async (req, res) => {
    if (!requireAuth(req)) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    const body = await readBody(req);
    const { to, template, locale, data, subject: overrideSubject } = body;

    if (!to || !template) {
      return json(res, 400, { error: 'Missing required fields: to, template' });
    }

    if (!templateNames.includes(template)) {
      return json(res, 400, {
        error: `Unknown template: ${template}. Available: ${templateNames.join(', ')}`,
      });
    }

    const built = buildHtml(template, locale || 'en', data || {});
    const subject = overrideSubject || built.subject;

    const result = await sendMail({ to, subject, html: built.html });
    json(res, 200, { success: true, messageId: result.messageId, subject });
  },
};

// ─── Server ───

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = `${req.method} ${url.pathname}`;
  const handler = routes[key];

  if (!handler) {
    return json(res, 404, { error: 'Not found' });
  }

  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[mailer] ${key} error:`, err.message);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[mailer] Email service running on port ${PORT}`);
  console.log(`[mailer] SMTP: ${process.env.SMTP_HOST ? 'configured' : 'dev mode (console fallback)'}`);
});
