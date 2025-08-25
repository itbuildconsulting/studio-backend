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


function validatePasswordStrength(pwd: string) {
  // mín 8 chars, pelo menos 1 maiúscula, 1 minúscula, 1 dígito e 1 especial
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;
  return re.test(pwd);
}

/**
 * Troca de senha autenticada: precisa da senha atual e da nova senha
 * Body: { currentPassword: string, newPassword: string, confirmPassword?: string }
 * Auth: usar authenticateToken; se ele não popular req.user.id, a função tenta ler do Bearer Token.
 */
export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { currentPassword, newPassword, confirmPassword, userId: userIdFromBody } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
      userId?: number | string; // <- agora aceitamos pelo body também
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Informe a senha atual e a nova senha.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Confirmação de senha não confere.' });
    }

    // 1) Pegar userId do token (middleware)
    let userIdFromToken = (req as any).user?.id as number | undefined;

    // fallback: decodificar Bearer se middleware não colocou user
    if (!userIdFromToken) {
      const auth = req.headers.authorization;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Não autenticado.' });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
        userIdFromToken = Number(decoded?.id);
        if (!userIdFromToken) throw new Error('Token sem id.');
      } catch {
        return res.status(401).json({ success: false, message: 'Token inválido.' });
      }
    }

    // 2) Se vier userId no body, precisa ser o MESMO do token (evita troca de senha de terceiros)
    const targetUserId = Number(userIdFromBody ?? userIdFromToken);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ success: false, message: 'userId inválido.' });
    }
    if (userIdFromBody !== undefined && targetUserId !== Number(userIdFromToken)) {
      // Se você quiser permitir admin, troque este bloco por checagem de role:
      // const isAdmin = (req as any).user?.role === 'admin';
      // if (!isAdmin) return res.status(403)...
      return res.status(403).json({ success: false, message: 'Operação não permitida para este usuário.' });
    }

    // 3) Carregar usuário
    const person = await Person.findByPk(targetUserId, {
      attributes: ['id', 'password' /*, 'tokenVersion', 'passwordChangedAt'*/],
    });
    if (!person) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // 4) Conferir senha atual
    const ok = await bcrypt.compare(String(currentPassword), String((person as any).password));
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta.' });
    }

    // 5) Evitar repetir a mesma senha
    const sameAsOld = await bcrypt.compare(String(newPassword), String((person as any).password));
    if (sameAsOld) {
      return res.status(400).json({ success: false, message: 'A nova senha não pode ser igual à atual.' });
    }

    // 6) Força mínima
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Senha fraca. Use no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.',
      });
    }

    // 7) Hash e salvar
    (person as any).password = await bcrypt.hash(newPassword, 10);
    // (opcional) (person as any).passwordChangedAt = new Date();
    // (opcional) versão de token p/ invalidar logins antigos:
    // (person as any).tokenVersion = Number((person as any).tokenVersion ?? 0) + 1;

    await person.save();

    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('Erro ao trocar senha:', err);
    return res.status(500).json({ success: false, message: 'Erro ao trocar senha.' });
  }
};

