# Mailer

> **[中文版 README](README.zh-TW.md)**

Shared email sending service for the [CloudPipe](https://github.com/Jeffrey0117/CloudPipe) ecosystem.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ LaunchKit│───>│ PayGate  │───>│  Mailer  │───>│  Inbox   │
│  (page)  │    │ (payment)│    │  (email) │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

Any sub-project that needs to send emails (welcome, payment confirmation, notifications) can do it with a single Gateway SDK call — no per-project SMTP setup required.

## Features

- Nodemailer + Resend SMTP (smtp.resend.com:465)
- 3 bilingual templates (en / zh): `welcome`, `purchase_success`, `notification`
- `{{key}}` placeholder syntax, inline CSS table layout, universal email client support
- Auto fallback to console.log when SMTP is not configured (dev mode)
- Lazy transport creation (only connects on first send)
- Bearer token auth (`MAILER_TOKEN`), open when unset (dev mode)

## Quick Start

```bash
npm install
cp .env.example .env   # fill in SMTP settings
PORT=4018 node server.js
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4018) |
| `SMTP_HOST` | No | SMTP host (e.g. `smtp.resend.com`) |
| `SMTP_PORT` | No | SMTP port (default: 465) |
| `SMTP_USER` | No | SMTP user (Resend uses `resend`) |
| `SMTP_PASS` | No | SMTP password / API key |
| `SMTP_FROM` | No | Sender address (default: `CloudPipe <noreply@isnowfriend.com>`) |
| `MAILER_TOKEN` | No | Bearer auth token (open when unset) |

## API

### `GET /api/health`

Health check. Returns SMTP status and available templates.

```bash
curl http://localhost:4018/api/health
```

```json
{
  "status": "ok",
  "service": "mailer",
  "smtp": true,
  "templates": ["welcome", "purchase_success", "notification"]
}
```

### `POST /api/send`

Send a raw HTML email.

```bash
curl -X POST http://localhost:4018/api/send \
  -H "Authorization: Bearer $MAILER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Hello",
    "html": "<h1>Hi there!</h1>"
  }'
```

### `POST /api/send-template`

Send a template-based email with locale support.

```bash
curl -X POST http://localhost:4018/api/send-template \
  -H "Authorization: Bearer $MAILER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "template": "welcome",
    "locale": "zh",
    "data": {
      "name": "Jeffrey",
      "appName": "Pokkit",
      "actionUrl": "https://pokkit.isnowfriend.com"
    }
  }'
```

**Available Templates:**

| Template | Variables | Use Case |
|----------|-----------|----------|
| `welcome` | `name`, `appName`, `actionUrl` | New user welcome |
| `purchase_success` | `name`, `productName`, `amount`, `actionUrl` | Payment confirmation |
| `notification` | `heading`, `message`, `ctaText`, `actionUrl` | General notification |

## Cross-Service Usage

Other sub-projects call Mailer via the CloudPipe Gateway SDK — zero config:

```javascript
const gw = require('../../sdk/gateway');

// Send a welcome email
await gw.call('mailer_send_template', {
  to: 'user@example.com',
  template: 'welcome',
  locale: 'en',
  data: { name: 'Jeffrey', appName: 'MyApp', actionUrl: 'https://...' },
});

// Send raw HTML
await gw.call('mailer_send', {
  to: 'admin@example.com',
  subject: 'System Alert',
  html: '<p>Server restarted</p>',
});
```

## Architecture

- **Runtime**: Node.js, CJS (`require` / `module.exports`)
- **HTTP**: Node built-in `http` module (no framework)
- **SMTP**: `nodemailer`
- **Templates**: Pure JS string templates + inline CSS table layout
- **Source**: `server.js` (178 lines) + `templates.js` (185 lines)

## License

MIT
