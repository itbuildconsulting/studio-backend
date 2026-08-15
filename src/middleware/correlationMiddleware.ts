import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export function correlationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const incoming = req.headers['x-correlation-id'];
  (req as any).correlationId = typeof incoming === 'string' && incoming.length > 0
    ? incoming
    : randomUUID();
  next();
}
