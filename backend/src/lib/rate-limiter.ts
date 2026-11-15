import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: FastifyRequest) => string;
}

/**
 * Limitador de tasa en memoria por ventana deslizante.
 * Protege endpoints sensibles (autenticación, llamadas a herramientas MCP)
 * contra ataques de fuerza bruta o saturación.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs } = options;
  const store = new Map<string, RateLimitRecord>();

  // Limpieza periódica de registros vencidos cada 2 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 120_000).unref();

  return async function rateLimiterHook(req: FastifyRequest, reply: FastifyReply) {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-client';

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      reply.header('X-RateLimit-Limit', maxRequests);
      reply.header('X-RateLimit-Remaining', maxRequests - 1);
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      reply.header('Retry-After', retryAfterSec);
      reply.header('X-RateLimit-Limit', maxRequests);
      reply.header('X-RateLimit-Remaining', 0);

      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Límite de peticiones excedido. Por favor espere ${retryAfterSec} segundos antes de reintentar.`,
        retryAfter: retryAfterSec,
      });
    }

    existing.count += 1;
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', maxRequests - existing.count);
  };
}
