// ====================================
// ARQUIVO: src/routes/emailTestRoutes.ts
// ====================================

import { Router, Request, Response } from 'express';
import Person from '../models/Person.model';
import { sendEmail } from '../core/email/emailService';
import { sendOtpFor } from '../core/email/opt';

const router = Router();

/**
 * 🧪 API DE TESTE - Envia email simples
 * @route POST /api/email/test
 * @body { "email": "destinatario@email.com" }
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    console.log(`🧪 [TEST] Enviando email de teste para: ${email}`);

    const subject = 'Teste de Email - Spin\'go';
    const text = `Este é um email de teste do sistema Spin'go.
    
Se você recebeu esta mensagem, significa que o sistema de envio de emails está funcionando corretamente!

Data/Hora: ${new Date().toLocaleString('pt-BR')}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4CAF50;">✅ Email de Teste - Spin'go</h1>
        <p style="font-size: 16px;">Este é um email de teste do sistema Spin'go.</p>
        <p style="font-size: 14px; color: #666;">
          Se você recebeu esta mensagem, significa que o sistema de envio de emails está 
          <strong style="color: #4CAF50;">funcionando corretamente</strong>!
        </p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
          Data/Hora: ${new Date().toLocaleString('pt-BR')}<br>
          Sistema: Spin'go Backend
        </p>
      </div>
    `;

    await sendEmail(email, subject, text, html);

    return res.status(200).json({
      success: true,
      message: `Email de teste enviado com sucesso para ${email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [TEST] Erro ao enviar email de teste:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao enviar email de teste',
      details: error.message
    });
  }
});

/**
 * 📧 API DE REENVIO - Reenvia OTP para usuário pendente
 * @route POST /api/email/resend-otp
 * @body { "email": "usuario@email.com" }
 */
router.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    console.log(`📧 [RESEND] Buscando usuário: ${email}`);

    // Busca o usuário pelo email
    const person = await Person.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verifica se já está ativo
    if (person.active === 1) {
      return res.status(400).json({
        success: false,
        error: 'Esta conta já está ativa. Não é necessário reenviar o código.'
      });
    }

    console.log(`📧 [RESEND] Reenviando OTP para userId: ${person.id}, email: ${email}`);

    // Reenvia o OTP
    await sendOtpFor(person.id, email);

    return res.status(200).json({
      success: true,
      message: `Código de verificação reenviado com sucesso para ${email}`,
      userId: person.id,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [RESEND] Erro ao reenviar OTP:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao reenviar código de verificação',
      details: error.message
    });
  }
});

/**
 * 🔍 API DE VERIFICAÇÃO - Verifica status do usuário
 * @route GET /api/email/check-user/:email
 */
router.get('/check-user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    console.log(`🔍 [CHECK] Verificando usuário: ${email}`);

    const person = await Person.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: ['id', 'name', 'email', 'active', 'createdAt']
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: person.id,
        name: person.name,
        email: person.email,
        active: person.active === 1,
        status: person.active === 1 ? 'Ativo' : 'Pendente de verificação',
        createdAt: person.createdAt
      }
    });

  } catch (error: any) {
    console.error('❌ [CHECK] Erro ao verificar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar usuário',
      details: error.message
    });
  }
});

/**
 * 📊 API DE STATUS - Verifica configuração de email
 * @route GET /api/email/status
 */
router.get('/status', (req: Request, res: Response) => {
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  return res.status(200).json({
    success: true,
    smtp: {
      host: 'smtp.hostinger.com',
      port: 587,
      emailUser: process.env.EMAIL_USER || 'NÃO CONFIGURADO',
      emailPassConfigured: !!process.env.EMAIL_PASS,
      configured: emailConfigured
    },
    timestamp: new Date().toISOString()
  });
});

export default router;