import { Request } from 'express';

interface LogPayload {
  uniqueId?:   string;
  clientId?:   string;
  apiEndpoint: string;
  serviceId?:  string;
  module?:     string;
  level?:      'info' | 'warn' | 'error';
  status?:     string;
  message?:    string;
  headers?:    unknown;
  request?:    unknown;
  response?:   unknown;
}

export function sendLog(req: Request, payload: LogPayload): void {
  const url = process.env.LOG_INGEST_URL;
  if (!url) return;

  try {
    const uniqueId: string = (req as any).correlationId ?? '';
    const clientId: string = (req.headers['x-client-id'] as string) ?? '';
    const serviceId: string = process.env.LOG_SERVICE_ID ?? 'this-backend';

    const body = JSON.stringify({ ...payload, uniqueId, clientId, serviceId });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {});
  } catch (err) {
    console.error('[logClient] Failed to send log:', err);
  }
}
