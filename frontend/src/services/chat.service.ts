import { Conversation, Message } from '@/types';
import { initialConversations } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    if (USE_MOCK) {
      return initialConversations;
    }
    return apiClient<Conversation[]>('/chat/conversations');
  },

  async getConversationById(id: string): Promise<Conversation> {
    if (USE_MOCK) {
      const found = initialConversations.find((c) => c.id === id);
      if (!found) throw new Error('Conversación no encontrada');
      return found;
    }
    return apiClient<Conversation>(`/chat/conversations/${id}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    if (USE_MOCK) {
      return {
        id: `msg-${Date.now()}`,
        conversationId,
        senderType: 'user',
        senderName: 'Usuario',
        content,
        timestamp: new Date().toISOString(),
      };
    }
    return apiClient<Message>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async respondApproval(approvalId: string, approved: boolean): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/chat/approvals/${approvalId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  },
};
