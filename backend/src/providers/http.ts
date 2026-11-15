import { ProviderError } from './types.js';

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export function safeJson<T = any>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Normaliza errores HTTP sin exponer nunca tokens, headers sensibles o URLs con secretos.
 */
function sanitizeErrorMessage(status: number, statusText: string, bodyText: string): string {
  let detail = '';
  const parsed = safeJson<any>(bodyText);
  if (parsed) {
    if (parsed.error?.message) {
      detail = String(parsed.error.message);
    } else if (parsed.message) {
      detail = String(parsed.message);
    } else if (typeof parsed.error === 'string') {
      detail = parsed.error;
    }
  }

  if (!detail && bodyText) {
    // Sanitizar cualquier apariencia de Bearer o tokens
    detail = bodyText
      .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, 'Bearer [REDACTED]')
      .replace(/(?:key|token|secret)=([A-Za-z0-9\-_\.]+)/gi, '$1=[REDACTED]')
      .slice(0, 300);
  }

  const base = `HTTP ${status}${statusText ? ` (${statusText})` : ''}`;
  return detail ? `${base}: ${detail}` : base;
}

export async function requestHttp(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  let combinedSignal: AbortSignal;
  if (options.signal) {
    if (typeof (AbortSignal as any).any === 'function') {
      combinedSignal = (AbortSignal as any).any([timeoutSignal, options.signal]);
    } else {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      timeoutSignal.addEventListener('abort', onAbort, { once: true });
      options.signal.addEventListener('abort', onAbort, { once: true });
      combinedSignal = controller.signal;
    }
  } else {
    combinedSignal = timeoutSignal;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  let body: string | undefined = undefined;
  if (options.body !== undefined) {
    if (typeof options.body === 'string') {
      body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const errMsg = sanitizeErrorMessage(res.status, res.statusText, errText);
      const isRetryable = res.status === 429 || res.status >= 500;
      throw new ProviderError(errMsg, { status: res.status, retryable: isRetryable });
    }

    return res;
  } catch (err: any) {
    if (err instanceof ProviderError) {
      throw err;
    }
    if (err.name === 'AbortError' || err.name === 'TimeoutError' || combinedSignal.aborted) {
      const wasTimeout = timeoutSignal.aborted;
      throw new ProviderError(
        wasTimeout ? `Tiempo de espera agotado (${timeoutMs}ms)` : 'Petición cancelada por el cliente',
        { status: wasTimeout ? 504 : 499, retryable: wasTimeout, cause: err }
      );
    }
    throw new ProviderError(`Error de red o conexión: ${err.message || 'desconocido'}`, {
      status: 503,
      retryable: true,
      cause: err,
    });
  }
}

/**
 * Lee un flujo SSE (Server-Sent Events) y emite payloads de datos `data: ...`
 */
export async function* parseSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Comentarios / keep-alive

        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.slice(5).trim();
          if (dataContent === '[DONE]') {
            return;
          }
          yield dataContent;
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const dataContent = trimmed.slice(5).trim();
        if (dataContent !== '[DONE]') {
          yield dataContent;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Ejecuta una operación HTTP con backoff exponencial (máx 2 reintentos) para errores retryable.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelayMs?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelay = options.initialDelayMs ?? 500;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err?.retryable || err?.status === 429 || (err?.status && err.status >= 500);
      if (attempt >= maxRetries || !isRetryable) {
        throw err;
      }
      attempt++;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
