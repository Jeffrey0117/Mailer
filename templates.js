'use strict';

// ─── Base Layout ───

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CloudPipe</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">CloudPipe</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Sent by CloudPipe &middot; <a href="https://epi.isnowfriend.com" style="color:#2563eb;text-decoration:none;">epi.isnowfriend.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr>
    <td style="background:#2563eb;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

// ─── Templates ───

const templates = {
  welcome: {
    en: {
      subject: 'Welcome to {{appName}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome, {{name}}!</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  Thank you for joining <strong>{{appName}}</strong>. Your account is ready to go.
</p>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  Click the button below to get started and explore everything we have to offer.
</p>
${ctaButton('Get Started', '{{actionUrl}}')}`,
    },
    zh: {
      subject: '歡迎加入 {{appName}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">歡迎，{{name}}！</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  感謝您加入 <strong>{{appName}}</strong>，您的帳號已準備就緒。
</p>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  點擊下方按鈕開始使用，探索我們提供的所有功能。
</p>
${ctaButton('開始使用', '{{actionUrl}}')}`,
    },
  },

  purchase_success: {
    en: {
      subject: 'Payment Confirmed — {{productName}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Payment Successful</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  Hi {{name}}, your payment has been confirmed.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e5e7eb;border-radius:6px;">
  <tr>
    <td style="padding:12px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Product</td>
    <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;text-align:right;">{{productName}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;font-size:14px;color:#6b7280;">Amount</td>
    <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;text-align:right;">{{amount}}</td>
  </tr>
</table>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  You can view your purchase details by clicking below.
</p>
${ctaButton('View Details', '{{actionUrl}}')}`,
    },
    zh: {
      subject: '付款成功 — {{productName}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">付款成功</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  {{name}} 您好，您的付款已確認。
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e5e7eb;border-radius:6px;">
  <tr>
    <td style="padding:12px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #e5e7eb;">商品</td>
    <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;text-align:right;">{{productName}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;font-size:14px;color:#6b7280;">金額</td>
    <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;text-align:right;">{{amount}}</td>
  </tr>
</table>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  點擊下方按鈕查看您的購買詳情。
</p>
${ctaButton('查看詳情', '{{actionUrl}}')}`,
    },
  },

  notification: {
    en: {
      subject: '{{heading}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">{{heading}}</h2>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  {{message}}
</p>
${ctaButton('{{ctaText}}', '{{actionUrl}}')}`,
    },
    zh: {
      subject: '{{heading}}',
      body: `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">{{heading}}</h2>
<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
  {{message}}
</p>
${ctaButton('{{ctaText}}', '{{actionUrl}}')}`,
    },
  },
};

// ─── Public API ───

const templateNames = Object.keys(templates);

/**
 * Build HTML email from template.
 * @param {string} template - Template name (welcome, purchase_success, notification)
 * @param {string} locale - 'en' or 'zh' (default: 'en')
 * @param {object} data - Key-value pairs for {{key}} replacement
 * @returns {{ html: string, subject: string }}
 */
function buildHtml(template, locale, data) {
  const tpl = templates[template];
  if (!tpl) {
    throw new Error(`Unknown template: ${template}. Available: ${templateNames.join(', ')}`);
  }

  const loc = tpl[locale] || tpl.en;
  const safeData = { ...data };

  // Replace {{key}} placeholders in body and subject
  const replaceTokens = (str) =>
    str.replace(/\{\{(\w+)\}\}/g, (_match, key) =>
      safeData[key] !== undefined ? String(safeData[key]) : `{{${key}}}`
    );

  const body = replaceTokens(loc.body);
  const subject = replaceTokens(loc.subject);
  const html = baseLayout(body);

  return { html, subject };
}

module.exports = { buildHtml, templateNames };
