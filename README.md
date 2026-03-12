# Mailer

CloudPipe 生態系的共用 Email 發送服務。

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ LaunchKit│───>│ PayGate  │───>│ Mailer   │───>│  用戶信箱 │
│  (門面)  │    │ (收銀台) │    │ (傳令兵) │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**定位**：生態系的「嘴巴」。任何子專案需要發信（歡迎信、付款確認、通知），只要一行 Gateway SDK 呼叫即可，不需要各自設定 SMTP。

## 功能

- Nodemailer + Resend SMTP（smtp.resend.com:465）
- 3 套雙語模板（en / zh）：`welcome`、`purchase_success`、`notification`
- 模板用 `{{key}}` 語法替換變數，inline CSS table layout，所有信箱相容
- SMTP 未設定時自動 fallback 到 console.log（開發模式）
- Transport 延遲建立（第一次發信才 create，省資源）
- Bearer token 驗證（`MAILER_TOKEN`），未設定時開放（dev mode）

## 快速啟動

```bash
npm install
cp .env.example .env   # 填入 SMTP 設定
PORT=4018 node server.js
```

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `PORT` | 否 | 伺服器端口（預設 4018）|
| `SMTP_HOST` | 否 | SMTP 主機（如 `smtp.resend.com`）|
| `SMTP_PORT` | 否 | SMTP 端口（預設 465）|
| `SMTP_USER` | 否 | SMTP 帳號（Resend 用 `resend`）|
| `SMTP_PASS` | 否 | SMTP 密碼 / API Key |
| `SMTP_FROM` | 否 | 寄件者（預設 `CloudPipe <noreply@isnowfriend.com>`）|
| `MAILER_TOKEN` | 否 | Bearer 驗證 token（未設定 = 開放）|

## API

### `GET /api/health`

健康檢查，回傳 SMTP 狀態和可用模板列表。

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

直接發送 HTML 信件。

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

使用預設模板發信，支援 `en` / `zh` 雙語。

```bash
curl -X POST http://localhost:4018/api/send-template \
  -H "Authorization: Bearer $MAILER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "template": "welcome",
    "locale": "zh",
    "data": {
      "name": "小明",
      "appName": "Pokkit",
      "actionUrl": "https://pokkit.isnowfriend.com"
    }
  }'
```

**可用模板：**

| 模板 | 變數 | 用途 |
|------|------|------|
| `welcome` | `name`, `appName`, `actionUrl` | 新用戶歡迎信 |
| `purchase_success` | `name`, `productName`, `amount`, `actionUrl` | 付款成功確認 |
| `notification` | `heading`, `message`, `ctaText`, `actionUrl` | 通用通知 |

## 跨服務呼叫

其他子專案透過 CloudPipe Gateway SDK 呼叫，零設定：

```javascript
const gw = require('../../sdk/gateway');

// 發送歡迎信
await gw.call('mailer_send_template', {
  to: 'user@example.com',
  template: 'welcome',
  locale: 'zh',
  data: { name: '小明', appName: 'MyApp', actionUrl: 'https://...' },
});

// 直接發送 HTML
await gw.call('mailer_send', {
  to: 'admin@example.com',
  subject: '系統通知',
  html: '<p>伺服器已重啟</p>',
});
```

## 技術架構

- **Runtime**: Node.js, CJS (`require` / `module.exports`)
- **HTTP**: Node 內建 `http` 模組（無框架）
- **SMTP**: `nodemailer`
- **模板**: 純 JS 字串模板 + inline CSS table layout
- **程式碼**: `server.js`（178 行）+ `templates.js`（185 行）

## 授權

MIT
