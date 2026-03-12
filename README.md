# Mailer

Shared email sending service for CloudPipe ecosystem

Part of the [CloudPipe](https://github.com/Jeffrey0117/CloudPipe) ecosystem.

## Quick Start

```bash
npm install
PORT=4018 node server.js
```

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 4018) |

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/send` | Send a raw HTML email to a recipient |
| POST | `/api/send-template` | Send a template-based email (welcome, purchase_success, notification) with locale support (en/zh) |

## License

MIT
