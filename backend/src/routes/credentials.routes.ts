import { FastifyInstance } from 'fastify';
import { credentialsService } from '../services/credentials.service.js';
import { createCredentialSchema, updateCredentialSchema } from '../lib/validators.js';

export async function credentialsRoutes(fastify: FastifyInstance) {
  fastify.get('/credentials', async () => {
    return credentialsService.getAll();
  });

  fastify.post('/credentials', async (req, reply) => {
    const parsed = createCredentialSchema.parse(req.body);
    const created = await credentialsService.create(parsed);
    return reply.status(201).send(created);
  });

  fastify.patch<{ Params: { id: string } }>('/credentials/:id', async (req) => {
    const parsed = updateCredentialSchema.parse(req.body);
    return credentialsService.update(req.params.id, parsed);
  });

  fastify.delete<{ Params: { id: string } }>('/credentials/:id', async (req) => {
    return credentialsService.delete(req.params.id);
  });
}
