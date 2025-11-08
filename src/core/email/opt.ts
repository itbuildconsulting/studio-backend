import bcrypt from 'bcryptjs';
import OtpCode from '../../models/OtpCode';
import { sendEmail } from './emailService';
import { generateVerificationToken } from '../../controllers/authVerifyController';

export async function sendOtpFor(userId: number, email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  const code_hash = await bcrypt.hash(code, 10);

  await OtpCode.create({
    user_id: userId,
    purpose: 'signup',
    code_hash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    attempts: 0,
  });

  // ✅ NOVO: Gerar magic link com 12h de validade
  const verificationToken = generateVerificationToken(userId, email);
  const verificationLink = `https://admin.spingo.com.br/auth/verify?token=${verificationToken}`;

  const subject = `${code} é seu código do Spin'go`;
  
  const text = `
Seu código de verificação é ${code}.
Ele é válido por 10 minutos.

Ou clique no link abaixo para confirmar automaticamente:
${verificationLink}

Este link expira em 12 horas.

Se não foi você, ignore este e-mail.
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação de Email - Spingo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #667eea;
      font-size: 32px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .code-box {
      background: #f8f9fa;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #667eea;
      font-family: 'Courier New', monospace;
    }
    .code-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .divider {
      text-align: center;
      margin: 30px 0;
      position: relative;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e5e7eb;
    }
    .divider span {
      background: white;
      padding: 0 15px;
      position: relative;
      color: #9ca3af;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
      transition: background 0.2s;
    }
    .button:hover {
      background: #5568d3;
    }
    .button-container {
      text-align: center;
    }
    .info {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .expiry {
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      margin-top: 10px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .code {
        font-size: 24px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>🎯 Spin'go</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937; margin-bottom: 10px;">Confirme seu email</h2>
      <p style="color: #6b7280; margin-bottom: 20px;">
        Para começar a usar o Spin'go, você precisa verificar seu email. Escolha uma das opções abaixo:
      </p>

      <div class="code-box">
        <div class="code-label">Seu código de verificação:</div>
        <div class="code">${code}</div>
        <div class="expiry">⏱️ Válido por 10 minutos</div>
      </div>

      <div class="divider">
        <span>OU</span>
      </div>

      <div class="button-container">
        <a href="${verificationLink}" class="button">
          ✓ Confirmar Email Automaticamente
        </a>
        <div class="expiry">🔗 Link válido por 12 horas</div>
      </div>

      <div class="info">
        <strong>💡 Dica:</strong> Clicar no botão acima é mais rápido! Você será direcionado automaticamente para o aplicativo.
      </div>
    </div>

    <div class="footer">
      <p>Se você não solicitou este código, ignore este email.</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} Spin'go. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail(email, subject, text, html);
}