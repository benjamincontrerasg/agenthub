import { FastifyInstance } from 'fastify';
import { mcpService } from '../services/mcp.service.js';
import { toolPolicyService } from '../services/tool-policy.service.js';
import { registerMCPServerSchema, toggleMCPActivationSchema, respondToolApprovalSchema } from '../lib/validators.js';

export async function mcpRoutes(fastify: FastifyInstance) {
  fastify.get('/mcp/servers', async () => {
    return mcpService.getAll();
  });

  fastify.post('/mcp/servers', async (req) => {
    const parsed = registerMCPServerSchema.parse(req.body);
    return mcpService.registerServer(parsed as any);
  });

  fastify.post<{ Params: { id: string } }>('/mcp/servers/:id/validate', async (req) => {
    return mcpService.validateServer(req.params.id);
  });

  fastify.patch<{ Params: { id: string }; Body: { active: boolean } }>(
    '/mcp/servers/:id/activation',
    async (req) => {
      const parsed = toggleMCPActivationSchema.parse(req.body);
      return mcpService.toggleActivation(req.params.id, parsed.active);
    }
  );

  fastify.delete<{ Params: { id: string } }>('/mcp/servers/:id', async (req) => {
    return mcpService.delete(req.params.id);
  });

  fastify.get('/mcp/approvals/pending', async () => {
    return toolPolicyService.getPendingApprovals();
  });

  fastify.post<{ Params: { id: string } }>('/mcp/approvals/:id/respond', async (req) => {
    const parsed = respondToolApprovalSchema.parse(req.body);
    return toolPolicyService.respondApproval(req.params.id, parsed.approved, parsed.rememberForSession, parsed.sessionId);
  });
}
