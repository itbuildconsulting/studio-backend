import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.model';
import generateAuthToken from '../core/token/generateAuthToken';
import OtpCode from '../models/OtpCode';
import { sendOtpFor } from '../core/email/opt';

const normalizeEmail = (e?: string) => String(e || '').trim().toLowerCase();
const JWT_SECRET = process.env.JWT_SECRET || '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3';
const APP_DEEP_LINK = process.env.APP_DEEP_LINK || 'spingo://verified';

// POST /auth/otp/verify — verifica o código de 6 dígitos digitado pelo usuário
export const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
  const { email, code } = req.body;

  const normalized = normalizeEmail(email);

  const person = await Person.findOne({ where: { email: normalized } });
  if (!person) return res.status(404).json({ error: 'Usuário não encontrado' });

  const otp = await OtpCode.findOne({
    where: { user_id: person.id, purpose: 'signup' },
    order: [['created_at', 'DESC']],
  });

  if (!otp) return res.status(400).json({ error: 'Código não encontrado' });
  if (otp.expires_at < new Date()) return res.status(400).json({ error: 'Código expirado' });
  if (otp.attempts >= 5) return res.status(429).json({ error: 'Tentativas excedidas' });

  const ok = await bcrypt.compare(code, otp.code_hash);
  await otp.update({ attempts: otp.attempts + 1 });
  if (!ok) return res.status(400).json({ error: 'Código inválido' });

  await person.update({ active: 1 });
  await otp.destroy(); 

  const token = generateAuthToken({ id: person.id, name: person.name, employee_level: person.employee_level });
  return res.json({ ok: true, token });
};

// POST /auth/otp/send — reenvio de código pelo app
export const sendOtp = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  const normalized = normalizeEmail(email);
  const person = await Person.findOne({ where: { email: normalized } });

  // Resposta genérica para não revelar se o e-mail existe
  if (!person) {
    return res.status(200).json({ ok: true, message: 'Se o e-mail existir, um código foi enviado.' });
  }

  if (person.active === 1) {
    return res.status(400).json({ error: 'Conta já verificada.' });
  }

  await sendOtpFor(person.id, normalized);
  return res.status(200).json({ ok: true, message: 'Código reenviado com sucesso.' });
};

// GET /auth/verify?token=xxx — ativação via botão do e-mail
// Valida o JWT, ativa a conta e retorna uma página HTML de confirmação
export const verifyEmailByToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token?: string };

  const errorPage = (message: string) => `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro — Spin'go</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}
    .box{background:white;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:400px;}
    h2{color:#e74c3c;}p{color:#6b7280;}</style></head>
    <body><div class="box"><h2>❌ Erro</h2><p>${message}</p></div></body></html>
  `;

  const successPage = (name: string) => `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Confirmado — Spin'go</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}
    .box{background:white;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:400px;}
    h2{color:#27ae60;}p{color:#6b7280;}
    .btn{display:inline-block;margin-top:20px;background:#667eea;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;}</style>
    <script>setTimeout(()=>{window.location.href='${APP_DEEP_LINK}';},2500);</script>
    </head>
    <body><div class="box">
      <h2>✅ Email confirmado!</h2>
      <p>Olá, <strong>${name}</strong>! Sua conta foi ativada com sucesso.</p>
      <p style="font-size:13px;">Você será redirecionado para o app em instantes...</p>
      <a href="${APP_DEEP_LINK}" class="btn">Abrir o app</a>
    </div></body></html>
  `;

  if (!token) {
    res.status(400).send(errorPage('Token não informado.'));
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string; purpose: string };

    if (payload.purpose !== 'email-verify') {
      res.status(400).send(errorPage('Token inválido para esta operação.'));
      return;
    }

    const person = await Person.findByPk(payload.id);
    if (!person) {
      res.status(404).send(errorPage('Usuário não encontrado.'));
      return;
    }

    if (person.active === 1) {
      // Já estava ativo — redireciona normalmente
      res.send(successPage(person.name));
      return;
    }

    await person.update({ active: 1 });
    

    res.send(successPage(person.name));
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(400).send(errorPage('Este link expirou. Solicite um novo código no aplicativo.'));
    } else {
      res.status(400).send(errorPage('Link inválido ou já utilizado.'));
    }
  }
};