import { FastifyInstance } from 'fastify';
import { secretsService } from '../services/secrets.service.js';
import { z } from 'zod';

const createSecretSchema = z.object({
  name: z.string().min(1, 'El nombre del secreto es obligatorio').max(100),
  value: z.string().min(1, 'El valor del secreto es obligatorio'),
  description: z.string().optional(),
  category: z.enum(['api_key', 'database', 'auth', 'webhook', 'custom']).optional(),
});

export async function secretsRoutes(app: FastifyInstance) {
  // GET /secrets - Listar todos los secretos (valores ofuscados)
  app.get('/secrets', async (_req, reply) => {
    const list = await secretsService.getSecrets();
    return reply.send(list);
  });

  // POST /secrets - Crear o actualizar un secreto
  app.post('/secrets', async (req, reply) => {
    const parsed = createSecretSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.format(),
      });
    }

    const { name, value, description, category } = parsed.data;
    const auditContext = {
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
    };

    const secret = await secretsService.setSecret(
      { name, value, description, category },
      auditContext
    );

    return reply.status(201).send(secret);
  });

  // POST /secrets/:name/reveal - Descifrar y revelar valor en texto plano (con traza de auditoría)
  app.post('/secrets/:name/reveal', async (req, reply) => {
    const { name } = req.params as { name: string };
    const auditContext = {
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
    };

    try {
      const revealed = await secretsService.revealSecret(name, auditContext);
      return reply.send(revealed);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message || 'Secreto no encontrado' });
    }
  });

  // DELETE /secrets/:name - Eliminar secreto permanentemente
  app.delete('/secrets/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const auditContext = {
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
    };

    const deleted = await secretsService.deleteSecret(name, auditContext);
    if (!deleted) {
      return reply.status(404).send({ error: 'Secreto no encontrado' });
    }

    return reply.send({ success: true, message: `Secreto "${name}" eliminado.` });
  });
}
