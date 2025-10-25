import nodemailer from 'nodemailer';

// Função para enviar o e-mail
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    // Configurações de transporte para o serviço de e-mail Hostinger
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',  // Servidor SMTP da Hostinger
      port: 587,                   // Porta para TLS
      secure: false,               // Não usa SSL, usa TLS
      auth: {
        user: process.env.EMAIL_USER,  // Seu e-mail da Hostinger
        pass: process.env.EMAIL_PASS,  // Sua senha do e-mail da Hostinger
      },
    });

    // Opções de envio do e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,  // O e-mail que você configurou na Hostinger
      to,
      subject,
      text,
      html
    };

    // Enviar o e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado:', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    throw new Error('Erro ao enviar o e-mail');
  }
};