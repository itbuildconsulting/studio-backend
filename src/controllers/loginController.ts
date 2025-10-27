import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.model';

import generateAuthToken from '../core/token/generateAuthToken';
import generateResetToken from '../core/token/generateResetToken';
import { sendEmail } from '../core/email/emailService';
import Level from '../models/Level.model';
import { sendOtpFor } from '../core/email/opt';

const normalizeEmail = (e?: string) => String(e || '').trim().toLowerCase();

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // 1) Validação básica
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'E-mail e senha são obrigatórios' 
      });
    }

    // 2) Normaliza e-mail (MESMA função do cadastro!)
    const normalizedEmail = normalizeEmail(email);

    // 3) Busca pessoa pelo e-mail normalizado
    const person = await Person.findOne({ 
      where: { email: normalizedEmail } 
    });

    if (!person) {
      return res.status(401).json({ 
        success: false,
        error: 'E-mail ou senha incorretos' // não revele se o e-mail existe
      });
    }

    // 4) Verifica se a conta está ativa
    if (person.active !== 1) {
      await sendOtpFor(person.id, person.email);
      return res.status(403).json({
        success: false,
        error: 'Conta pendente de verificação. Enviamos um código para seu e-mail.',
        requiresVerification: true
      });
    }

    // 5) Verifica se tem senha cadastrada
    if (!person.password) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário sem senha cadastrada' 
      });
    }

    // 6) Compara senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, person.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'E-mail ou senha incorretos' 
      });
    }

    // 7) Busca o nível do funcionário (se existir)
    let level = null;
    if (person.employee_level) {
      level = await Level.findOne({
        where: { id: person.employee_level },
      });
    }

    // 8) Gera token JWT
    const token = generateAuthToken({
      id: person.id,
      name: person.name,
      employee_level: person.employee_level,
    });

    // 9) Retorna sucesso com dados do usuário
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

  } catch (error: any) {
    console.error('Erro durante o login:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token, newPassword } = req.body;

    // 1) Validação básica
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Token e nova senha são obrigatórios' 
      });
    }

    // 2) Validação da força da senha
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Senha fraca. Use no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.',
      });
    }

    // 3) Verificar o token JWT
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    } catch (jwtError) {
      return res.status(400).json({ 
        success: false,
        error: 'Token inválido ou expirado' 
      });
    }

    // 4) Buscar usuário
    const person = await Person.findOne({ 
      where: { id: decoded.id },
      attributes: ['id', 'email', 'password', 'active']
    });

    if (!person) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    // 5) Verificar se a conta está ativa
    if (person.active !== 1) {
      return res.status(403).json({ 
        success: false,
        error: 'Conta não está ativa' 
      });
    }

    // 6) Verificar se a nova senha é diferente da antiga (opcional mas recomendado)
    if (person.password) {
      const sameAsOld = await bcrypt.compare(newPassword, person.password);
      if (sameAsOld) {
        return res.status(400).json({ 
          success: false,
          error: 'A nova senha não pode ser igual à senha anterior' 
        });
      }
    }

    // 7) Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    // 8) Atualizar senha
    person.password = passwordHash;
    // Opcional: invalidar tokens antigos
    // person.tokenVersion = (person.tokenVersion || 0) + 1;
    await person.save();

    return res.status(200).json({ 
      success: true,
      message: 'Senha redefinida com sucesso' 
    });

  } catch (error: any) {
    console.error('Erro ao redefinir a senha:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro ao redefinir senha',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        const resetUrl = `https://admin.spingo.com.br/resetar-senha/${resetToken}`;

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
    const { currentPassword, newPassword, confirmPassword, userId } = req.body;
    
    // 1) Validação básica
    if (!currentPassword || !newPassword || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha atual, nova senha e ID do usuário são obrigatórios.' 
      });
    }

    // 2) Validação de confirmação de senha
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'A confirmação de senha não confere.' 
      });
    }

    // 3) Validação da força da senha
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Senha fraca. Use no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.',
      });
    }

    // 4) Buscar usuário
    const person = await Person.findByPk(userId, { 
      attributes: ['id', 'password', 'active', 'email'] 
    });

    if (!person) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado.' 
      });
    }

    // 5) Verificar se a conta está ativa
    if (person.active !== 1) {
      return res.status(403).json({ 
        success: false,
        error: 'Conta não está ativa' 
      });
    }

    // 6) Verificar se tem senha cadastrada
    if (!person.password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Usuário sem senha cadastrada.' 
      });
    }

    // 7) Verificar senha atual
    const currentPasswordMatch = await bcrypt.compare(
      currentPassword.trim(), 
      person.password
    );

    if (!currentPasswordMatch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha atual incorreta.' 
      });
    }

    // 8) Verificar se a nova senha é diferente da atual
    const sameAsOld = await bcrypt.compare(newPassword.trim(), person.password);
    
    if (sameAsOld) {
      return res.status(400).json({ 
        success: false, 
        error: 'A nova senha não pode ser igual à senha atual.' 
      });
    }

    // 9) Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    // 10) Atualizar senha
    person.password = passwordHash;
    // Opcional: registrar data da mudança
    // person.passwordChangedAt = new Date();
    // Opcional: invalidar tokens antigos (força novo login)
    // person.tokenVersion = (person.tokenVersion || 0) + 1;
    await person.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Senha alterada com sucesso.' 
    });

  } catch (error: any) {
    console.error('Erro ao trocar senha:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao trocar senha.',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

