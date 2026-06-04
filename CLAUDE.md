# Mailer

Shared email-sending HTTP microservice for the CloudPipe ecosystem — any sub-project sends mail via one Gateway SDK call, no per-project SMTP setup.

## Stack
- Node.js, CommonJS (`require` / `module.exports`)
- HTTP: Node built-in `http` module (no web framework)
- SMTP: `nodemailer` (Resend SMTP — `smtp.resend.com:465`)
- Templates: pure JS string templates + inline-CSS table layout
- Process manager: PM2 (`.pm2-ecosystem.json`)

## Directory structure

```
mailer/
  server.js           ← HTTP server, routes, auth, SMTP transport, sendMail
  templates.js        ← Email templates, baseLayout, ctaButton, buildHtml()
  package.json        ← deps (nodemailer), start script
  .pm2-ecosystem.json ← PM2 config (prod env, port 4018, autorestart)
  .env                ← local SMTP / token config
  README.md           ← English docs
  README.zh-TW.md     ← Chinese docs
```

Note: project root is a symlink to `code/workhub/mailer`. PM2 ecosystem points at a `cloudpipe/projects/mailer` deploy copy.

## Key concepts

- **Two send modes**: `POST /api/send` (raw HTML) and `POST /api/send-template` (named template + locale + data).
- **Templates** (`templates.js`): 3 bilingual templates — `welcome`, `purchase_success`, `notification`. Each has `en` / `zh` variants with `subject` + `body`. `buildHtml(template, locale, data)` does `{{key}}` token replacement and wraps body in `baseLayout`. Unknown tokens are left intact; unknown locale falls back to `en`.
- **Lazy SMTP transport** (`getTransport`): created on first send. If `SMTP_HOST` is unset, `sendMail` logs to console (dev mode) and returns a fake `dev-<ts>` messageId.
- **Bearer auth** (`requireAuth`): checks `Authorization: Bearer <MAILER_TOKEN>`. If `MAILER_TOKEN` is unset, the service is open (dev mode). `/api/health` is unauthenticated.
- **CORS**: all responses send `Access-Control-Allow-Origin: *`; `OPTIONS` preflight returns 204.
- **Routing**: simple `"METHOD /path"` -> handler map; unmatched routes return 404, handler errors return 500.
- **Cross-service usage**: other CloudPipe projects call via Gateway SDK — `gw.call('mailer_send_template', {...})` / `gw.call('mailer_send', {...})`.

## Endpoints
- `GET /api/health` — `{ status, service, smtp, templates }`
- `POST /api/send` — body `{ to, subject, html, from? }`
- `POST /api/send-template` — body `{ to, template, locale?, data?, subject?, from? }`

## Environment variables
| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `4018` | Server port |
| `SMTP_HOST` | — | Unset = console dev mode |
| `SMTP_PORT` | `465` | secure: true |
| `SMTP_USER` | — | Resend uses `resend` |
| `SMTP_PASS` | — | SMTP password / API key |
| `SMTP_FROM` | `CloudPipe <noreply@isnowfriend.com>` | Sender |
| `MAILER_TOKEN` | — | Bearer token; unset = open |

## Commands
- Install: `npm install`
- Run: `npm start` (= `node server.js`), or `PORT=4018 node server.js`
- Health check: `curl http://localhost:4018/api/health`
- No build or test scripts defined.

## Coding rules
- `'use strict';` at top of every file.
- CommonJS modules; Node built-ins preferred over frameworks.
- Env-driven config with sensible defaults; degrade gracefully (dev-mode fallbacks rather than crashing).
