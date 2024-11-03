import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/*interface TokenPayload {
  id: number;
  iat: number; // Issued at
  exp: number; // Expiration time
}*/

// Middleware para validar o token em todas as rotas protegidas
export const authenticateToken = (req: Request, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autorização não fornecido' });
  }

  jwt.verify(token, '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3', (err) => {
    if (err) {
      return res.status(403).json({ error: 'Falha ao autenticar o token' });
    }

    

    next();
  });
};
