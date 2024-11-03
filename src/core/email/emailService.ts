import nodemailer from 'nodemailer';

// Função para enviar o e-mail
export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    // Configurações de transporte para o serviço de e-mail
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Pode ser substituído por outro provedor de e-mail
      auth: {
        user: process.env.EMAIL_USER, // Seu e-mail
        pass: process.env.EMAIL_PASS, // Sua senha
      },
    });

    // Opções de envio do e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER, // O e-mail que você configurou
      to,
      subject,
      text,
    };

    // Enviar o e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado:', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    throw new Error('Erro ao enviar o e-mail');
  }
};
