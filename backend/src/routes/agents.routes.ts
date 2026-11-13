import { FastifyInstance } from 'fastify';
import { agentService } from '../services/agent.service.js';
import { createAgentSchema, updateAgentSchema } from '../lib/validators.js';

export async function agentsRoutes(fastify: FastifyInstance) {
  fastify.get('/agents', async () => {
    return agentService.getAll();
  });

  fastify.get<{ Params: { id: string } }>('/agents/:id', async (req) => {
    return agentService.getById(req.params.id);
  });

  fastify.post('/agents', async (req) => {
    const parsed = createAgentSchema.parse(req.body);
    return agentService.create(parsed as any);
  });

  fastify.patch<{ Params: { id: string } }>('/agents/:id', async (req) => {
    const parsed = updateAgentSchema.parse(req.body);
    return agentService.update(req.params.id, parsed as any);
  });

  fastify.delete<{ Params: { id: string } }>('/agents/:id', async (req) => {
    return agentService.delete(req.params.id);
  });
}
