# Outreach Campaign Engine — Design Spec

**Date:** 2026-07-03
**Status:** Approved design, pending plan
**Home:** the `mailer` service (localhost:4018) + thin MCP proxy tools in `cloudpipe/mcp`

## Goal

Stop rewriting the same "催 MRR / 轉單" email-blast logic in every project
(pipee, coursebloom, adman, …). Extract the shared engine into the central mailer
so any project — whatever its DB — can run a deduped, deliverability-safe campaign
by pushing a recipient list + copy. All campaigns are logged and attributable in
one place.

## Why the mailer (not a new repo, not cloudpipe)

- The mailer is the hub every project already calls (`localhost:4018`); zero new
  integration surface.
- It's small (211-line raw `http` + `nodemailer`) and already has a template
  concept (`templates.js`). The campaign layer belongs to "email infrastructure",
  not to any one product.
- A new repo = another pm2 process to manage (against the "更好管理" goal).
- cloudpipe = coupling cross-project infra to a single product.

Only gap: the mailer is currently stateless. We add a small SQLite store for
dedup + logging + attribution.

## Core principle: PUSH, not pull

The calling project queries its **own** DB and hands over a recipient list. The
engine never touches project databases → works for pipee (SQLite), coursebloom
(Supabase), anything.

## Data store (new)

`campaign_sends.db` (better-sqlite3, in the mailer dir):
```
campaign_sends(
  id INTEGER PRIMARY KEY,
  campaign TEXT NOT NULL,   -- namespaced: "pipee:activation", "classroo:nurture"
  stage    INTEGER NOT NULL DEFAULT 1,
  email    TEXT NOT NULL,
  ref_tag  TEXT,
  sent_at  TEXT NOT NULL
)
```
Dedup key: `(campaign, stage, email)` (unique index). A recipient already recorded
for that campaign+stage is skipped on re-run.

## Endpoints (new, in the mailer, auth-guarded like the rest)

### `POST /api/campaign/send`
Body:
```
{
  campaign: "pipee:activation",
  stage: 1,                       // optional, default 1
  subject: "…",
  html: "<div>Hi {{name}} … {{ctaUrl}}</div>",   // {{name}} + {{vars.*}} placeholders
  recipients: [ { email, name, vars: { ctaUrl: "…" } }, … ],
  from: "Jeff (Pipee) <noreply@isnowfriend.com>", // optional
  replyTo: "jeffby8@gmail.com",   // optional
  refTag: "email-act1",           // optional, stored for attribution
  mode: "dry" | "test" | "send",  // default "dry"
  testEmail: "jeffby8@gmail.com"  // required when mode="test"
}
```
Pipeline (every call):
1. **Junk filter** — drop malformed + bounce-prone domains (`example.com`,
   `example.org`, `test.com`, disposable list) and obvious test patterns.
2. **Dedup** — skip recipients already in `campaign_sends` for `(campaign, stage)`.
3. **Render** — per recipient, replace `{{name}}` and `{{field}}` (from name+vars),
   HTML-escaping values.
4. **Mode**:
   - `dry` → send nothing; return `{ eligible, skippedJunk, skippedDup, sampleHtml }`.
   - `test` → send ONE rendered email to `testEmail`; return.
   - `send` → for each eligible: `sendMail`, insert a `campaign_sends` row, pace
     ~400 ms. Return `{ sent, failed, skippedJunk, skippedDup }`.

Returns a structured summary in all modes.

### `GET /api/campaign/report?campaign=pipee:activation`
Returns per-stage counts, first/last `sent_at`, total recipients. (Conversion is
project-specific — the `ref_tag` lets each project query its own conversions.)

## MCP tools (thin proxies, in `cloudpipe/mcp/core-tools.js`)

- **`outreach_send`** → POSTs to `localhost:4018/api/campaign/send`. Same params as
  the endpoint. Tool description strongly recommends `mode:"dry"` then `"test"`
  before `"send"`.
- **`outreach_report`** → GETs `/api/campaign/report`.

So Claude (or any project script) can drive a campaign; the engine + log live once
in the mailer.

## Caller footprint (~10 lines)
A project script: query its cohort → build `recipients:[{email,name,vars}]` →
POST to `/api/campaign/send` (dry → test → send). No junk-filter, dedup, pacing, or
logging code — the engine owns those.

## Safety
- `mode` defaults to `dry`; `send` must be explicit.
- `test` sends exactly one, to `testEmail`.
- Dedup makes re-runs idempotent (no double-send).
- Auth: reuse the mailer's existing `requireAuth`.

## v1 boundaries (out of scope)
- No automated multi-stage **scheduler** — multi-touch = call again with `stage:2`.
- No HTML **builder** UI — caller passes full `html` (with `{{placeholders}}`).
- No unsubscribe-link **system** — caller includes a consent/opt-out line in `html`
  (as coursebloom already does). A managed unsubscribe endpoint is a future item.
- No conversion tracking inside the engine — attribution via `ref_tag`, measured
  per-project.

## Migration (not forced in v1)
pipee's `send-activation-emails.mjs` and coursebloom's `send-nurture.mjs` can later
be reduced to thin callers of `/api/campaign/send`. v1 ships the engine; migrating
the two existing scripts is a follow-up.
