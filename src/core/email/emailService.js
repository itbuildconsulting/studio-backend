// emailService.js

const nodemailer = require('nodemailer');

// Configurações de transporte para o serviço de email
const transporter = nodemailer.createTransport({
  service: 'sua_provedora_de_email', // Por exemplo: 'gmail'
  auth: {
    user: 'seu_email',
    pass: 'sua_senha'
  }
});

// Função para enviar o email
async function sendEmailNewPassword(email, newPassword) {
  try {
    // Opções do email
    const mailOptions = {
      from: 'seu_email',
      to: email,
      subject: 'Nova senha gerada',
      text: `Sua nova senha é: ${newPassword}`
    };

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
  }
}

module.exports = { sendEmailNewPassword };
