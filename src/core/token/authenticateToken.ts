import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface para o payload do token
interface TokenPayload {
  id: number;
  name?: string;
  employee_level?: number;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// Extender o tipo Request do Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Middleware para validar o token em todas as rotas protegidas
export const authenticateToken = (
  req: Request, 
  res: Response, 
  next: NextFunction
): Response | void => {
  
  // 1) Pegar o token do header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token de autorização não fornecido' 
    });
  }

  // 2) Verificar se JWT_SECRET existe
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET não definido no .env');
    return res.status(500).json({ 
      success: false,
      error: 'Erro de configuração do servidor' 
    });
  }

  try {
    // 3) Verificar e decodificar o token
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // 4) ✅ IMPORTANTE: Salvar dados do usuário no req para usar nas rotas
    req.user = decoded;
    
    // 5) Continuar para a próxima função (rota protegida)
    next();
    
  } catch (err: any) {
    // 6) Tratamento de erros específicos do JWT
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expirado',
        expired: true
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Token inválido' 
      });
    }
    
    return res.status(403).json({ 
      success: false,
      error: 'Falha ao autenticar o token',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};