import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { seedDatabase } from './db/seed.js';
import { AppError } from './lib/errors.js';
import { ZodError } from 'zod';
import { wsManager } from './services/websocket.service.js';

// Route plugins
import { providersRoutes } from './routes/providers.routes.js';
import { agentsRoutes } from './routes/agents.routes.js';
import { mcpRoutes } from './routes/mcp.routes.js';
import { workflowsRoutes } from './routes/workflows.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { executionsRoutes } from './routes/executions.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

async function main() {
  // Ensure database has seed data
  await seedDatabase();

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow frontend dev origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Support urlencoded and text for POST/PUT without explicit application/json
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

  // WebSocket Endpoint for real-time AgentHub events
  fastify.register(async function (app) {
    app.get('/ws', { websocket: true }, (socket, req) => {
      wsManager.registerClient(socket);
    });
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
      platform: 'AgentHub Backend API',
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
  };

  // Register routes under /v1
  await fastify.register(registerAllRoutes, { prefix: '/v1' });
  // Also register at root level
  await fastify.register(registerAllRoutes);

  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🚀 AgentHub Backend operativo en http://${config.host}:${config.port}`);
    console.log(`🔌 WebSocket Stream en ws://${config.host}:${config.port}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
