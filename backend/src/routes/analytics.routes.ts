import { FastifyInstance } from 'fastify';
import { analyticsService } from '../services/analytics.service.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get('/analytics', async () => {
    return analyticsService.getSummary();
  });
}
