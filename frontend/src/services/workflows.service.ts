import { Workflow } from '@/types';
import { initialWorkflows } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const workflowsService = {
  async getWorkflows(): Promise<Workflow[]> {
    if (USE_MOCK) {
      return initialWorkflows;
    }
    return apiClient<Workflow[]>('/workflows');
  },

  async getWorkflowById(id: string): Promise<Workflow> {
    if (USE_MOCK) {
      const found = initialWorkflows.find((w) => w.id === id);
      if (!found) throw new Error('Workflow no encontrado');
      return found;
    }
    return apiClient<Workflow>(`/workflows/${id}`);
  },

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    if (USE_MOCK) {
      return { ...workflow, updatedAt: new Date().toISOString() };
    }
    return apiClient<Workflow>(`/workflows/${workflow.id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  },

  async executeWorkflow(id: string, inputs?: Record<string, any>): Promise<{ executionId: string }> {
    if (USE_MOCK) {
      return { executionId: `exec-${Date.now()}` };
    }
    return apiClient<{ executionId: string }>(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  },
};

