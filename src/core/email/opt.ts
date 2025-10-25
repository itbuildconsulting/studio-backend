import bcrypt from 'bcryptjs';
import OtpCode from '../../models/OtpCode';
import { sendEmail } from './emailService';

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

  const subject = `${code} é seu código do Spin'go`; // <-- código no início = melhor autofill iOS
  const text =
`Seu código é ${code}.
Ele é válido por 10 minutos.

Se não foi você, ignore este e-mail.`;
  const html =
`<p>Seu código é <b style="font-size:18px;letter-spacing:2px">${code}</b>.</p>
<p>Ele é válido por 10 minutos.</p>
<p>Se não foi você, ignore este e-mail.</p>`;

  await sendEmail(email, subject, text, html);
}
