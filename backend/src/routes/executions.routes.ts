import { FastifyInstance } from 'fastify';
import { executionService } from '../services/execution.service.js';

export async function executionsRoutes(fastify: FastifyInstance) {
  fastify.get('/executions', async () => {
    return executionService.getAll();
  });

  fastify.get<{ Params: { id: string } }>('/executions/:id', async (req) => {
    return executionService.getById(req.params.id);
  });

  fastify.post<{ Params: { id: string } }>('/executions/:id/cancel', async (req) => {
    return executionService.cancel(req.params.id);
  });
}
