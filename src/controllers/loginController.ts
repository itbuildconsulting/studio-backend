import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.model';

import generateAuthToken from '../core/token/generateAuthToken';
import generateResetToken from '../core/token/generateResetToken';
import { sendEmail } from '../core/email/emailService';
import Level from '../models/Level.model';

export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    try {
        // Buscar a pessoa pelo e-mail
        const person = await Person.findOne({ where: { email } });

        if (!person) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        // Comparar a senha fornecida com a armazenada
        const passwordMatch = await bcrypt.compare(password, person.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Agora, vamos buscar o nível da pessoa usando o employee_level
        const level = await Level.findOne({
            where: { id: person.employee_level },
        });

        // Aqui passamos id, nome, e nível ao token
        const token = generateAuthToken({
            id: person.id,
            name: person.name,
            employee_level: person.employee_level, // Usamos employee_level
        });

        // Retornamos o token e informações do usuário, incluindo o nome do nível
        return res.status(200).json({
            token,
            expiresIn: '1h',
            name: person.name,
            id: person.id,
            email: person.email,
            level: !level ? null : level.name, // Agora enviamos o nome do nível ao invés do ID
            color: !level ? null : level.color,
            student_level: person.student_level,
            
        });
    } catch (error) {
        console.error('Erro durante o login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { token, newPassword } = req.body;

    try {
        // Verificar o token
        const decoded = jwt.verify(token, '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3') as jwt.JwtPayload;

        const person = await Person.findOne({ where: { id: decoded.id } });

        if (!person) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Atualizar a senha do usuário
        person.password = await bcrypt.hash(newPassword, 10); // Criptografar a nova senha
        await person.save();

        return res.status(200).json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body;

    try {
        const person = await Person.findOne({ where: { email } });

        if (!person) {
            return res.status(200).send('Se o e-mail existir no sistema, um link de redefinição será enviado.');
        }

        // Gerar token de redefinição de senha
        const resetToken = generateResetToken({ id: person.id, email: person.email });

        // Gerar URL de redefinição de senha com o token
        const resetUrl = `https://admin.studiostaging.xyz/resetar-senha/${resetToken}`;

        // Enviar e-mail para o usuário com o link
        await sendEmail(
          person.email,
          'Redefinição de Senha',
          `Clique no link para redefinir sua senha: ${resetUrl}`
        );

        return res.status(200).send('Se o e-mail existir no sistema, um link de redefinição será enviado.');
    } catch (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        return res.status(500).json({ error: 'Erro interno do servidor', message: error });
    }
};


