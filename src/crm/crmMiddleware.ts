import { Request, Response, NextFunction } from 'express';
import { crmDb } from './crmDb';

export function injectCrmDb(req: Request, _res: Response, next: NextFunction): void {
  (req as any).tenantDb = crmDb;
  next();
}
