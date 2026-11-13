import { FastifyInstance } from 'fastify';
import { providerService } from '../services/provider.service.js';
import { connectProviderSchema } from '../lib/validators.js';

export async function providersRoutes(fastify: FastifyInstance) {
  fastify.get('/providers', async () => {
    return providerService.getAll();
  });

  fastify.get<{ Params: { id: string } }>('/providers/:id', async (req) => {
    return providerService.getById(req.params.id);
  });

  fastify.post<{ Params: { id: string }; Body: { apiKey: string; defaultModelId?: string } }>(
    '/providers/:id/connect',
    async (req) => {
      const parsed = connectProviderSchema.parse(req.body);
      return providerService.connect(req.params.id, parsed.apiKey, parsed.defaultModelId);
    }
  );

  fastify.post<{ Params: { id: string } }>('/providers/:id/test', async (req) => {
    return providerService.testConnection(req.params.id);
  });
}
