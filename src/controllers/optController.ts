import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.model';

import generateAuthToken from '../core/token/generateAuthToken';
import OtpCode from '../models/OtpCode';

const normalizeEmail = (e?: string) => String(e || '').trim().toLowerCase();

export const verifyOtp= async (req: Request, res: Response): Promise<Response> => {
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

    // ✅ ativa a conta
    await person.update({ active: 1 });

    // opcional: já devolver token
    const token = generateAuthToken({ id: person.id, name: person.name, employee_level: person.employee_level });
    return res.json({ ok: true, token });

}