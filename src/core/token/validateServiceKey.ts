import { Request, Response, NextFunction } from 'express';

// Middleware de autenticação por chave compartilhada, usado pelas rotas de
// integração (ex: sensor-service) que não passam pelo fluxo de login/JWT.
export const validateServiceKey = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const providedKey = req.headers['x-service-key'];
  const expectedKey = process.env.SENSOR_SERVICE_KEY;

  if (!expectedKey) {
    console.error('❌ SENSOR_SERVICE_KEY não definido no .env');
    return res.status(500).json({
      success: false,
      error: 'Erro de configuração do servidor',
    });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Chave de serviço inválida',
    });
  }

  next();
};
