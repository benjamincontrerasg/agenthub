import { FastifyInstance } from 'fastify';
import { workflowService } from '../services/workflow.service.js';
import { saveWorkflowSchema, executeWorkflowSchema } from '../lib/validators.js';
import { auditService } from '../services/audit.service.js';

export async function workflowsRoutes(fastify: FastifyInstance) {
  fastify.get('/workflows', async () => {
    return workflowService.getAll();
  });

  fastify.get<{ Params: { id: string } }>('/workflows/:id', async (req) => {
    return workflowService.getById(req.params.id);
  });

  fastify.put<{ Params: { id: string } }>('/workflows/:id', async (req) => {
    const parsed = saveWorkflowSchema.parse(req.body);
    return workflowService.save({ ...parsed, id: req.params.id } as any);
  });

  fastify.post<{ Params: { id: string } }>('/workflows/:id/execute', async (req) => {
    const parsed = executeWorkflowSchema.parse(req.body || {});
    return workflowService.execute(req.params.id, parsed.inputs);
  });

  // Webhook trigger endpoint for CI/CD and external systems (GitHub Actions, cURL, Jira)
  fastify.post<{ Params: { id: string } }>('/workflows/:id/trigger', async (req, reply) => {
    const wf = await workflowService.getById(req.params.id);
    if (!wf) {
      return reply.status(404).send({
        code: 'NOT_FOUND',
        message: `Workflow con ID "${req.params.id}" no encontrado.`,
      });
    }

    const body = (req.body as any) || {};

    await auditService.log({
      action: 'workflow.triggered_webhook',
      resource: `workflow:${wf.id}`,
      ip: req.ip,
      status: 'success',
      details: { workflowName: wf.name, payloadKeys: Object.keys(body) },
    });

    const result = await workflowService.execute(req.params.id, body.inputs || body);
    return reply.send({
      success: true,
      message: `Workflow '${wf.name}' iniciado exitosamente vía Webhook Trigger.`,
      executionId: result.executionId,
      status: 'running',
      triggeredAt: new Date().toISOString(),
    });
  });

  fastify.delete<{ Params: { id: string } }>('/workflows/:id', async (req) => {
    return workflowService.delete(req.params.id);
  });
}
