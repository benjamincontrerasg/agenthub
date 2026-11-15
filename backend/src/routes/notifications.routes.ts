import { FastifyInstance } from 'fastify';
import { notificationsService } from '../services/notifications.service.js';

export async function notificationsRoutes(app: FastifyInstance) {
  // GET /notifications/channels - Listar canales configurados
  app.get('/notifications/channels', async (_req, reply) => {
    const channels = notificationsService.getChannels();
    return reply.send(channels);
  });

  // POST /notifications/channels - Registrar nuevo canal
  app.post('/notifications/channels', async (req, reply) => {
    const { name, type, url, events } = req.body as {
      name: string;
      type: 'slack' | 'discord' | 'webhook';
      url: string;
      events?: string[];
    };

    if (!name || !type || !url) {
      return reply.status(400).send({ error: 'name, type y url son obligatorios' });
    }

    const channel = notificationsService.addChannel({
      name,
      type,
      url,
      enabled: true,
      events: events || ['*'],
    });

    return reply.status(201).send(channel);
  });

  // DELETE /notifications/channels/:id - Eliminar canal
  app.delete('/notifications/channels/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const removed = notificationsService.removeChannel(id);
    if (!removed) {
      return reply.status(404).send({ error: 'Canal no encontrado' });
    }
    return reply.send({ success: true });
  });

  // PATCH /notifications/channels/:id/toggle - Activar/desactivar canal
  app.patch('/notifications/channels/:id/toggle', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { enabled } = req.body as { enabled: boolean };
    const channel = notificationsService.toggleChannel(id, enabled);
    if (!channel) {
      return reply.status(404).send({ error: 'Canal no encontrado' });
    }
    return reply.send(channel);
  });

  // POST /notifications/test - Enviar notificación de prueba
  app.post('/notifications/test', async (_req, reply) => {
    const result = await notificationsService.sendNotification({
      event: 'test',
      title: '🧪 Notificación de Prueba - AgentHub',
      message: 'Esta es una notificación de prueba desde AgentHub. Si recibes este mensaje, el canal está configurado correctamente.',
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
    return reply.send(result);
  });
}
