import { FastifyInstance } from 'fastify';
import { workflowService } from '../services/workflow.service.js';
import { saveWorkflowSchema, executeWorkflowSchema } from '../lib/validators.js';

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

  fastify.delete<{ Params: { id: string } }>('/workflows/:id', async (req) => {
    return workflowService.delete(req.params.id);
  });
}
