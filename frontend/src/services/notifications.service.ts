import { apiClient } from '@/services/api';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'webhook';
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
}

// Mock channels for development
let mockChannels: NotificationChannel[] = [
  {
    id: 'notif-demo-slack',
    name: 'Canal #alertas-agentes',
    type: 'slack',
    url: 'https://hooks.slack.com/services/DEMO/WEBHOOK',
    enabled: true,
    events: ['approval.required', 'execution.completed', 'security.alert'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'notif-demo-discord',
    name: 'Discord Devops',
    type: 'discord',
    url: 'https://discord.com/api/webhooks/DEMO/TOKEN',
    enabled: false,
    events: ['*'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const isMockMode = (): boolean => import.meta.env.VITE_USE_MOCK !== 'false';

export const notificationsService = {
  async getChannels(): Promise<NotificationChannel[]> {
    if (isMockMode()) {
      return structuredClone(mockChannels);
    }
    return apiClient<NotificationChannel[]>('/notifications/channels');
  },

  async addChannel(payload: {
    name: string;
    type: 'slack' | 'discord' | 'webhook';
    url: string;
    events?: string[];
  }): Promise<NotificationChannel> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const channel: NotificationChannel = {
        ...payload,
        id: `notif-${Date.now()}`,
        enabled: true,
        events: payload.events || ['*'],
        createdAt: new Date().toISOString(),
      };
      mockChannels.push(channel);
      return structuredClone(channel);
    }
    return apiClient<NotificationChannel>('/notifications/channels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteChannel(id: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      mockChannels = mockChannels.filter((c) => c.id !== id);
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/notifications/channels/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleChannel(id: string, enabled: boolean): Promise<NotificationChannel> {
    if (isMockMode()) {
      const ch = mockChannels.find((c) => c.id === id);
      if (ch) ch.enabled = enabled;
      return structuredClone(ch!);
    }
    return apiClient<NotificationChannel>(`/notifications/channels/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },

  async sendTest(): Promise<{ sent: number; failed: number }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return { sent: mockChannels.filter((c) => c.enabled).length, failed: 0 };
    }
    return apiClient<{ sent: number; failed: number }>('/notifications/test', {
      method: 'POST',
    });
  },
};
