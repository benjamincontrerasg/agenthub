import { FastifyInstance } from 'fastify';
import { auditService } from '../services/audit.service.js';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/audit/logs', async (request, reply) => {
    const query = request.query as { limit?: string; action?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const logs = await auditService.getLogs({ limit, action: query.action });
    return reply.send(logs);
  });
}
