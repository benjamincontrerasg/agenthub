import { APICredential } from '@/types';
import { apiClient } from '@/services/api';
import { isMockMode } from './providers.service';

let mockCredentials: APICredential[] = [
  {
    id: 'cred-mock-1',
    name: 'OpenAI Producción',
    providerId: 'openai',
    maskedKey: 'sk-••••7890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cred-mock-2',
    name: 'Anthropic Claude Core',
    providerId: 'anthropic',
    maskedKey: 'sk-ant-••••2143',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const credentialsService = {
  async getCredentials(): Promise<APICredential[]> {
    if (isMockMode()) {
      return structuredClone(mockCredentials);
    }
    return apiClient<APICredential[]>('/credentials');
  },

  async createCredential(data: {
    name: string;
    providerId: string;
    apiKey: string;
  }): Promise<APICredential> {
    if (isMockMode()) {
      const suffix = data.apiKey.slice(-4);
      const prefix = data.apiKey.startsWith('sk-') ? 'sk-' : data.apiKey.slice(0, 3);
      const newCred: APICredential = {
        id: `cred-${Date.now()}`,
        name: data.name,
        providerId: data.providerId,
        maskedKey: `${prefix}••••${suffix}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCredentials.push(newCred);
      return structuredClone(newCred);
    }

    return apiClient<APICredential>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteCredential(id: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      mockCredentials = mockCredentials.filter((c) => c.id !== id);
      return { success: true };
    }

    return apiClient<{ success: boolean }>(`/credentials/${id}`, {
      method: 'DELETE',
    });
  },
};
