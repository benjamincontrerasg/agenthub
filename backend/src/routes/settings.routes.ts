import { FastifyInstance } from 'fastify';
import { settingsService } from '../services/settings.service.js';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/settings', async () => {
    return settingsService.getSettings();
  });

  fastify.put('/settings', async (req) => {
    return settingsService.updateSettings(req.body as any);
  });
}
