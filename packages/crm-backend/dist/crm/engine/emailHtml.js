"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmailHtml = buildEmailHtml;
function buildEmailHtml({ bodyHtml, headerColor, headerLogoUrl, companyName }) {
    const color = headerColor || '#6366f1';
    const name = companyName || process.env.EMAIL_FROM_NAME || 'Avera';
    const headerContent = headerLogoUrl
        ? `<img src="${headerLogoUrl}" alt="${name}" style="height:36px;max-width:200px;display:block;border:0;" />`
        : `<span style="color:#ffffff;font-weight:bold;font-size:18px;">${name}</span>`;
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <div style="background:${color};padding:20px 24px;">
      ${headerContent}
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #f1f1f1;text-align:center;color:#9ca3af;font-size:11px;">
      ${name} &middot; Voc&ecirc; recebeu este e-mail por ser aluno cadastrado.
    </div>
  </div>
</body>
</html>`;
}
