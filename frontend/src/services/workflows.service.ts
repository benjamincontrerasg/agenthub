import { Workflow } from '@/types';
import { initialWorkflows } from '@/services/mock-data';
import { apiClient } from '@/services/api';

let mockWorkflows: Workflow[] = structuredClone(initialWorkflows);
let mockModeOverride: boolean | null = null;

export const isMockMode = (): boolean => {
  if (mockModeOverride !== null) return mockModeOverride;
  return import.meta.env.VITE_USE_MOCK !== 'false';
};

export const setMockMode = (enabled: boolean | null) => {
  mockModeOverride = enabled;
};

export const resetMockWorkflows = () => {
  mockWorkflows = structuredClone(initialWorkflows);
};

export const workflowsService = {
  async getWorkflows(): Promise<Workflow[]> {
    if (isMockMode()) {
      return structuredClone(mockWorkflows);
    }
    return apiClient<Workflow[]>('/workflows');
  },

  async getWorkflowById(id: string): Promise<Workflow> {
    if (isMockMode()) {
      const found = mockWorkflows.find((w) => w.id === id);
      if (!found) throw new Error(`Workflow '${id}' no encontrado`);
      return structuredClone(found);
    }
    return apiClient<Workflow>(`/workflows/${id}`);
  },

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const idx = mockWorkflows.findIndex((w) => w.id === workflow.id);
      const updated = { ...workflow, updatedAt: new Date().toISOString() };
      if (idx !== -1) {
        mockWorkflows[idx] = updated;
      } else {
        mockWorkflows.push(updated);
      }
      return structuredClone(updated);
    }

    return apiClient<Workflow>(`/workflows/${workflow.id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  },

  async executeWorkflow(id: string, inputs?: Record<string, any>): Promise<{ executionId: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      return { executionId: `exec-${Date.now()}` };
    }

    return apiClient<{ executionId: string }>(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  },

  async deleteWorkflow(id: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const idx = mockWorkflows.findIndex((w) => w.id === id);
      if (idx !== -1) {
        mockWorkflows.splice(idx, 1);
      }
      return { success: true };
    }

    return apiClient<{ success: boolean }>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  },
};
