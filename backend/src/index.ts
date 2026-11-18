import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { seedDatabase } from './db/seed.js';
import { AppError } from './lib/errors.js';
import { ZodError } from 'zod';
import { wsManager } from './services/websocket.service.js';
import { AuthUser, verifyJWT } from './lib/jwt.js';

// Route plugins
import { providersRoutes } from './routes/providers.routes.js';
import { agentsRoutes } from './routes/agents.routes.js';
import { mcpRoutes } from './routes/mcp.routes.js';
import { workflowsRoutes } from './routes/workflows.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { executionsRoutes } from './routes/executions.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { notificationsRoutes } from './routes/notifications.routes.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function buildApp(opts: { logger?: any } = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
    },
  });

  // Ensure database has seed data
  await seedDatabase();

  // Register CORS con lista blanca estricta de orígenes permitidos
  await fastify.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Permitir peticiones sin header Origin (herramientas locales, scripts o server-to-server)
      // y validar estrictamente contra la lista de orígenes autorizados
      if (!origin || config.corsOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Support urlencoded, text and empty/undefined bodies for application/json requests (e.g. DELETE)
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body: string | Buffer, done) => {
    try {
      const str = typeof body === 'string' ? body : body?.toString('utf8');
      if (!str || str.trim() === '') {
        return done(null, {});
      }
      const json = JSON.parse(str);
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  fastify.addContentTypeParser(['application/x-www-form-urlencoded', 'text/plain'], { parseAs: 'string' }, (req, body: string | Buffer, done) => {
    try {
      const str = typeof body === 'string' ? body : body.toString('utf8');
      const json = str ? JSON.parse(str) : {};
      done(null, json);
    } catch {
      done(null, {});
    }
  });

  // Register WebSocket
  await fastify.register(websocket);

  // Global Authentication Hook
  fastify.addHook('onRequest', async (request, reply) => {
    // Permitir preflight CORS sin requerir credenciales
    if (request.method === 'OPTIONS') {
      return;
    }

    const urlPath = request.url.split('?')[0];
    const method = request.method.toUpperCase();

    // Lista blanca explícita de rutas públicas
    const isHealthCheck = (urlPath === '/health' || urlPath === '/v1/health') && method === 'GET';
    const isAuthLogin = (urlPath === '/auth/login' || urlPath === '/v1/auth/login') && method === 'POST';
    const isAuthRegister = (urlPath === '/auth/register' || urlPath === '/v1/auth/register') && method === 'POST';
    const isWebSocket = urlPath === '/ws' || urlPath === '/v1/ws';

    if (isHealthCheck || isAuthLogin || isAuthRegister || isWebSocket) {
      return;
    }

    // Exigir header Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'Cabecera Authorization Bearer requerida o ausente',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'Token de autenticación no proporcionado',
      });
    }

    const user = verifyJWT(token);
    if (!user) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'Token JWT inválido, expirado o con firma alterada',
      });
    }

    // Inyectar usuario autenticado en request.user
    request.user = user;
  });

  // WebSocket Connection Handler con autenticación
  const handleWebSocket = (socket: any, req: any) => {
    // 1. Verificar si viene en query (?token=...)
    const url = new URL(req.url, 'http://localhost');
    const queryToken = url.searchParams.get('token') || (req.query as any)?.token;

    if (queryToken) {
      const user = verifyJWT(queryToken);
      if (!user) {
        try {
          socket.close(1008, JSON.stringify({ code: 'UNAUTHORIZED', message: 'Token JWT inválido o expirado' }));
        } catch {}
        return;
      }
      wsManager.registerClient(socket);
      return;
    }

    // 2. Si no hay query param, esperar primer mensaje de autenticación ({ type: 'auth', token: '...' })
    let authenticated = false;
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        try {
          socket.close(1008, JSON.stringify({ code: 'UNAUTHORIZED', message: 'Autenticación requerida. Cierre por timeout.' }));
        } catch {}
      }
    }, 1000);

    const onFirstMessage = (data: any) => {
      try {
        const raw = typeof data === 'string' ? data : data?.toString('utf8');
        const msg = JSON.parse(raw);
        if (msg.type === 'auth' && msg.token) {
          const user = verifyJWT(msg.token);
          if (user) {
            authenticated = true;
            clearTimeout(authTimeout);
            socket.off('message', onFirstMessage);
            wsManager.registerClient(socket);
            return;
          }
        }
      } catch {}

      clearTimeout(authTimeout);
      try {
        socket.close(1008, JSON.stringify({ code: 'UNAUTHORIZED', message: 'Token JWT inválido o expirado' }));
      } catch {}
    };

    socket.on('message', onFirstMessage);
  };

  // WebSocket Endpoints for real-time NEXORA events
  fastify.register(async function (app) {
    app.get('/ws', { websocket: true }, handleWebSocket);
    app.get('/v1/ws', { websocket: true }, handleWebSocket);
  });

  // Global Error Handler
  fastify.setErrorHandler((error: any, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en la petición',
        errors: error.flatten().fieldErrors,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
      });
    }

    fastify.log.error(error);
    return reply.status(error.statusCode || 500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Error interno del servidor',
    });
  });

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      platform: 'NEXORA Backend API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Register all routes
  const registerAllRoutes = async (app: FastifyInstance) => {
    await app.register(providersRoutes);
    await app.register(agentsRoutes);
    await app.register(mcpRoutes);
    await app.register(workflowsRoutes);
    await app.register(chatRoutes);
    await app.register(executionsRoutes);
    await app.register(analyticsRoutes);
    await app.register(settingsRoutes);
    await app.register(auditRoutes);
    await app.register(notificationsRoutes);
  };

  // Register routes under /v1
  await fastify.register(registerAllRoutes, { prefix: '/v1' });
  // Also register at root level
  await fastify.register(registerAllRoutes);

  // Auth routes (registered under /v1 and at root)
  await fastify.register(authRoutes, { prefix: '/v1' });
  await fastify.register(authRoutes);

  return fastify;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`🚀 NEXORA Backend operativo en http://${config.host}:${config.port}`);
    console.log(`🔌 WebSocket Stream en ws://${config.host}:${config.port}/ws`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Iniciar servidor automáticamente salvo en entorno de pruebas (Vitest)
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  main();
}
