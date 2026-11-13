import { FastifyInstance } from 'fastify';
import { chatService } from '../services/chat.service.js';
import { sendMessageSchema, respondApprovalSchema } from '../lib/validators.js';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/chat/conversations', async () => {
    return chatService.getConversations();
  });

  fastify.get<{ Params: { id: string } }>('/chat/conversations/:id', async (req) => {
    return chatService.getById(req.params.id);
  });

  fastify.post<{ Params: { id: string }; Body: { content: string } }>(
    '/chat/conversations/:id/messages',
    async (req) => {
      const parsed = sendMessageSchema.parse(req.body);
      return chatService.sendMessage(req.params.id, parsed.content);
    }
  );

  fastify.post<{ Params: { id: string }; Body: { approved: boolean } }>(
    '/chat/approvals/:id/respond',
    async (req) => {
      const parsed = respondApprovalSchema.parse(req.body);
      return chatService.respondApproval(req.params.id, parsed.approved);
    }
  );
}
