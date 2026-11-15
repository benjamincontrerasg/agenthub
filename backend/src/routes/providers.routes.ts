import { FastifyInstance } from 'fastify';
import { providerService } from '../services/provider.service.js';
import { connectProviderSchema, updateProviderSchema } from '../lib/validators.js';

export async function providersRoutes(fastify: FastifyInstance) {
  fastify.get('/providers', async () => {
    return providerService.getAll();
  });

  fastify.get<{ Params: { id: string } }>('/providers/:id', async (req) => {
    return providerService.getById(req.params.id);
  });

  fastify.post<{ Params: { id: string }; Body: { apiKey: string; defaultModelId?: string; baseUrl?: string; kind?: string } }>(
    '/providers/:id/connect',
    async (req) => {
      const parsed = connectProviderSchema.parse(req.body);
      return providerService.connect(req.params.id, parsed.apiKey, parsed.defaultModelId, parsed.baseUrl, parsed.kind);
    }
  );

  fastify.delete<{ Params: { id: string } }>('/providers/:id/credentials', async (req) => {
    return providerService.disconnect(req.params.id);
  });

  fastify.patch<{ Params: { id: string }; Body: { defaultModelId?: string; baseUrl?: string; kind?: string } }>(
    '/providers/:id',
    async (req) => {
      const parsed = updateProviderSchema.parse(req.body);
      return providerService.updateDefaultModel(req.params.id, parsed.defaultModelId, parsed.baseUrl, parsed.kind);
    }
  );

  fastify.post<{ Params: { id: string } }>('/providers/:id/test', async (req) => {
    return providerService.testConnection(req.params.id);
  });
}
