import { describe, it, expect } from 'vitest';
import { chatService } from '../chat.service.js';

describe('Chat & Multi-Agent Orchestration Service', () => {
  it('retrieves conversations with messages and participant agents', async () => {
    const convs = await chatService.getConversations();
    expect(convs.length).toBeGreaterThan(0);

    const conv101 = convs.find((c) => c.id === 'conv-101');
    expect(conv101).toBeDefined();
    expect(conv101?.messages.length).toBeGreaterThanOrEqual(4);
    expect(conv101?.participantAgentIds.length).toBeGreaterThan(0);
  });

  it('handles user messages and initiates agent responses', async () => {
    const msg = await chatService.sendMessage('conv-101', 'Test prompt for automated test suite');
    expect(msg.id).toBeDefined();
    expect(msg.senderType).toBe('user');
    expect(msg.content).toBe('Test prompt for automated test suite');
  });

  it('processes human approval for write tools', async () => {
    const res = await chatService.respondApproval('appr-501', true);
    expect(res.success).toBe(true);
  });
});
