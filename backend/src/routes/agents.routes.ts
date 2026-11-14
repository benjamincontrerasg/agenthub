import { FastifyInstance } from 'fastify';
import { agentService } from '../services/agent.service.js';
import { memoryService } from '../services/memory.service.js';
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

  // Semantic Memory & RAG endpoints
  fastify.get<{ Params: { id: string } }>('/agents/:id/memories', async (req) => {
    return memoryService.getMemories(req.params.id);
  });

  fastify.post<{ Params: { id: string }; Body: { content: string; metadata?: any } }>(
    '/agents/:id/memories',
    async (req) => {
      return memoryService.addMemory({
        agentId: req.params.id,
        content: req.body.content,
        metadata: req.body.metadata,
      });
    }
  );

  fastify.get<{ Params: { id: string }; Querystring: { q: string; limit?: string } }>(
    '/agents/:id/memories/search',
    async (req) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      return memoryService.searchMemories(req.params.id, req.query.q || '', limit);
    }
  );

  fastify.delete<{ Params: { id: string } }>('/agents/memories/:id', async (req) => {
    return memoryService.deleteMemory(req.params.id);
  });
}
