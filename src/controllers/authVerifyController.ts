// src/controllers/authVerifyController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.model';
import OtpCode from '../models/OtpCode';
import generateAuthToken from '../core/token/generateAuthToken';

interface VerifyTokenPayload {
  userId: number;
  email: string;
  type: 'email_verification';
  iat: number;
  exp: number;
}

/**
 * Gera o token de verificação para o magic link
 * Expiração: 12 horas
 */
export function generateVerificationToken(userId: number, email: string): string {
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'email_verification'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '12h' }
  );
}

/**
 * Valida o token do magic link e retorna a página intermediária
 * GET /auth/verify?token=xxxxx
 */
export const verifyEmailLink = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;

  // Validação básica
  if (!token || typeof token !== 'string') {
    res.status(400).send(renderErrorPage('Token inválido', 'O link de verificação está incorreto.'));
    return;
  }

  try {
    // Decodifica e valida o token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as VerifyTokenPayload;

    // Verifica se é token de verificação de email
    if (decoded.type !== 'email_verification') {
      res.status(400).send(renderErrorPage('Token inválido', 'Este link não é válido para verificação de email.'));
      return;
    }

    // Busca o usuário
    const person = await Person.findByPk(decoded.userId);

    if (!person) {
      res.status(404).send(renderErrorPage('Usuário não encontrado', 'Não foi possível encontrar sua conta.'));
      return;
    }

    // Verifica se o email bate
    if (person.email !== decoded.email) {
      res.status(400).send(renderErrorPage('Email inválido', 'Este link não corresponde ao email da conta.'));
      return;
    }

    // Se já está ativo, informa que já foi verificado
    if (person.active === 1) {
      const authToken = generateAuthToken({
        id: person.id,
        name: person.name,
        employee_level: person.employee_level,
      });
      
      res.send(renderSuccessPage(authToken, person.name, true));
      return;
    }

    // Ativa a conta
    await person.update({ active: 1 });

    // Invalida todos os OTPs pendentes deste usuário
    await OtpCode.destroy({
      where: { 
        user_id: person.id,
        purpose: 'signup'
      }
    });

    // Gera token de autenticação
    const authToken = generateAuthToken({
      id: person.id,
      name: person.name,
      employee_level: person.employee_level,
    });

    // Retorna página de sucesso
    res.send(renderSuccessPage(authToken, person.name, false));

  } catch (error: any) {
    console.error('Erro ao verificar email:', error);

    // Token expirado
    if (error.name === 'TokenExpiredError') {
      res.status(400).send(renderErrorPage(
        'Link expirado', 
        'Este link de verificação expirou. Solicite um novo código no aplicativo.'
      ));
      return;
    }

    // Token inválido ou adulterado
    if (error.name === 'JsonWebTokenError') {
      res.status(400).send(renderErrorPage(
        'Link inválido', 
        'Este link de verificação não é válido.'
      ));
      return;
    }

    // Erro genérico
    res.status(500).send(renderErrorPage(
      'Erro no servidor', 
      'Ocorreu um erro ao verificar seu email. Tente novamente mais tarde.'
    ));
  }
};

/**
 * Renderiza a página de sucesso (conta confirmada)
 */
function renderSuccessPage(authToken: string, userName: string, alreadyVerified: boolean): string {
  const message = alreadyVerified 
    ? 'Sua conta já estava verificada!' 
    : 'Conta confirmada!';
  
  const subtitle = alreadyVerified
    ? 'Você já havia verificado sua conta anteriormente.'
    : `Olá ${userName}, seu acesso foi verificado com sucesso.`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Confirmada - Spingo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: scaleIn 0.5s ease-out;
    }

    .success-icon svg {
      width: 48px;
      height: 48px;
      stroke: white;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 12px;
      font-weight: 700;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      font-family: inherit;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      margin-bottom: 12px;
    }

    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #6b7280;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }

    @media (max-width: 480px) {
      .container {
        padding: 32px 24px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      p {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>

    <h1>${message}</h1>
    <p>${subtitle}</p>

    <button class="btn btn-primary" id="openApp">Abrir Aplicativo</button>
    <button class="btn btn-secondary" id="logout">Sair</button>

    <div class="footer">
      Link válido por 12 horas
    </div>
  </div>

  <script>
    const authToken = '${authToken}';

    // Botão Abrir Aplicativo
    document.getElementById('openApp').addEventListener('click', function(e) {
      e.preventDefault();
      
      // Tenta abrir o app via deep link
      window.location.href = 'spingo://auth?token=' + encodeURIComponent(authToken);
      
      // Fallback para web após 2 segundos (caso o app não esteja instalado)
      setTimeout(function() {
        // Você pode redirecionar para uma página web do app ou para a loja
        window.location.href = 'https://app.spingo.com.br/auth?token=' + encodeURIComponent(authToken);
      }, 2000);
    });

    // Botão Sair
    document.getElementById('logout').addEventListener('click', function() {
      // Redireciona para a página de login do admin
      window.location.href = 'https://admin.spingo.com.br';
    });
  </script>
</body>
</html>
  `;
}

/**
 * Renderiza a página de erro
 */
function renderErrorPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Spingo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .error-icon {
      width: 80px;
      height: 80px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: scaleIn 0.5s ease-out;
    }

    .error-icon svg {
      width: 48px;
      height: 48px;
      stroke: white;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 12px;
      font-weight: 700;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      font-family: inherit;
      background: #667eea;
      color: white;
    }

    .btn:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    @media (max-width: 480px) {
      .container {
        padding: 32px 24px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      p {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    </div>

    <h1>${title}</h1>
    <p>${message}</p>

    <a href="https://admin.spingo.com.br" class="btn">Voltar para o início</a>
  </div>
</body>
</html>
  `;
}