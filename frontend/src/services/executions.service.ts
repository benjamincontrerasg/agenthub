import { WorkflowExecution } from '@/types';
import { initialExecutions } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const executionsService = {
  async getExecutions(): Promise<WorkflowExecution[]> {
    if (USE_MOCK) {
      return initialExecutions;
    }
    return apiClient<WorkflowExecution[]>('/executions');
  },

  async getExecutionById(id: string): Promise<WorkflowExecution> {
    if (USE_MOCK) {
      const found = initialExecutions.find((e) => e.id === id);
      if (!found) throw new Error('Ejecución no encontrada');
      return found;
    }
    return apiClient<WorkflowExecution>(`/executions/${id}`);
  },

  async cancelExecution(id: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/executions/${id}/cancel`, {
      method: 'POST',
    });
  },
};
