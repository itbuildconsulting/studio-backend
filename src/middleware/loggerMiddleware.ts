import { Request, Response, NextFunction } from 'express';
import { sendLog } from '../utils/logClient';
import { redact, capSize } from '../utils/redact';

const SKIP_PATHS = new Set(['/health', '/ping']);

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);

  res.json = function (body?: unknown): Response {
    const status = res.statusCode;
    const method = req.method;
    const path   = req.path;

    const apiEndpoint = `${process.env.LOG_SERVICE_ID ?? 'this-backend'}/${path.replace(/^\//, '').replace(/\//g, '-')}`;
    const module      = path.split('/').filter(Boolean)[0] ?? 'root';

    const level: 'info' | 'warn' | 'error' =
      status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    let message = `${method} ${path} → ${status}`;
    if (status >= 400) {
      const b = body as Record<string, unknown> | null | undefined;
      const detail = (b?.error ?? b?.message ?? 'unknown') as string;
      message += `: ${detail}`;
    }

    sendLog(req, {
      apiEndpoint,
      module,
      level,
      status: String(status),
      message,
      headers:  redact(req.headers),
      request:  redact(req.body ?? null),
      response: capSize(redact(body ?? null)),
    });

    return originalJson(body);
  };

  next();
}
