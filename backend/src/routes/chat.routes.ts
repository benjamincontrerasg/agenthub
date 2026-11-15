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

  // Server-Sent Events (SSE) stream for real-time conversation updates
  fastify.get<{ Params: { id: string } }>(
    '/chat/conversations/:id/stream',
    async (req, reply) => {
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial heartbeat
      reply.raw.write(`event: connected\ndata: ${JSON.stringify({ conversationId: req.params.id })}\n\n`);

      const interval = setInterval(() => {
        reply.raw.write(': ping\n\n');
      }, 15000);

      req.raw.on('close', () => {
        clearInterval(interval);
      });
    }
  );

  fastify.post<{ Params: { id: string }; Body: { content: string } }>(
    '/chat/conversations/:id/messages',
    async (req) => {
      const parsed = sendMessageSchema.parse(req.body);
      return chatService.sendMessage(req.params.id, parsed.content);
    }
  );

  fastify.post<{ Params: { id: string }; Body: { approved: boolean; rememberForSession?: boolean } }>(
    '/chat/approvals/:id/respond',
    async (req) => {
      const parsed = respondApprovalSchema.parse(req.body);
      return chatService.respondApproval(req.params.id, parsed.approved, parsed.rememberForSession);
    }
  );
}
