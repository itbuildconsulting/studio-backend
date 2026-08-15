const SENSITIVE_KEY = /password|senha|token|secret|authorization|api[-_]?key|cvv|cvc|card[-_]?number|numero[-_]?cart[aã]o/i;

export function redact(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== 'object') return value;

  const resolved = typeof (value as any).toJSON === 'function'
    ? (value as any).toJSON()
    : value;

  if (resolved === null || typeof resolved !== 'object') return resolved;

  if (seen.has(resolved)) return '[Circular]';
  seen.add(resolved);

  if (Array.isArray(resolved)) {
    return resolved.map((item) => redact(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(resolved)) {
    result[key] = SENSITIVE_KEY.test(key)
      ? '[REDACTED]'
      : redact((resolved as Record<string, unknown>)[key], seen);
  }
  return result;
}

export function capSize(value: unknown): unknown {
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    return { unserializable: true };
  }
  if (json.length > 200_000) {
    return { truncated: true, originalSize: json.length, preview: json.slice(0, 2000) };
  }
  return value;
}
