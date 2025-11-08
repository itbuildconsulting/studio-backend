import nodemailer from 'nodemailer';

// Função para enviar o e-mail
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    // Configurações de transporte para o serviço de e-mail Hostinger
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // ✅ ADICIONAR: Configurações extras para melhorar deliverability
      tls: {
        rejectUnauthorized: true, // Valida certificados SSL
      },
      pool: true, // Usar pool de conexões
      maxConnections: 5,
      maxMessages: 100,
    });

    // ✅ MELHORAR: Opções de envio do e-mail com headers adicionais
    const mailOptions = {
      from: {
        name: "Spin'go", // ✅ Nome amigável do remetente
        address: process.env.EMAIL_USER || '',
      },
      to,
      subject,
      text,
      html: html || text, // ✅ Fallback para texto se não houver HTML
      // ✅ Headers adicionais para melhor entrega
      headers: {
        'X-Priority': '3', // Prioridade normal
        'X-Mailer': 'Spingo-Mailer',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`, // Para não cair em spam
      },
      // ✅ IDs para rastreamento
      messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@spingo.com.br>`,
    };

    // Enviar o e-mail
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-mail enviado com sucesso:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error: any) {
    console.error('❌ Erro ao enviar o e-mail:', {
      error: error.message,
      to: to,
      subject: subject,
    });
    
    throw new Error(`Erro ao enviar o e-mail: ${error.message}`);
  }
};

// ✅ NOVO: Função para verificar a saúde do serviço de email
export const verifyEmailService = async (): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ Serviço de email está funcionando');
    return true;
  } catch (error: any) {
    console.error('❌ Erro no serviço de email:', error.message);
    return false;
  }
};