import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkflowExecution, ExecutionStep, ExecutionLog } from '@/types';
import { initialExecutions } from '@/services/mock-data';
import { generateId } from '@/lib/utils';

interface ExecutionsState {
  executions: WorkflowExecution[];
  selectedExecutionId: string | null;
  statusFilter: string;
  searchQuery: string;
  setSelectedExecutionId: (id: string | null) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (q: string) => void;
  addExecution: (exec: WorkflowExecution) => void;
  cancelExecution: (id: string) => void;
  retryExecution: (id: string) => Promise<string>;
  getExecutionById: (id: string) => WorkflowExecution | undefined;
}

export const useExecutionsStore = create<ExecutionsState>()(
  persist(
    (set, get) => ({
      executions: initialExecutions,
      selectedExecutionId: 'exec-8941',
      statusFilter: 'ALL',
      searchQuery: '',

      setSelectedExecutionId: (id) => set({ selectedExecutionId: id }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      addExecution: (exec) => {
        set((state) => ({
          executions: [exec, ...state.executions],
        }));
      },

      cancelExecution: (id) => {
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'failed',
                  finishedAt: new Date().toISOString(),
                  errorMessage: 'Ejecución cancelada manualmente por el operador.',
                }
              : e
          ),
        }));
      },

      retryExecution: async (id) => {
        const original = get().executions.find((e) => e.id === id);
        if (!original) return '';

        const newId = generateId('exec');
        const newExecution: WorkflowExecution = {
          ...original,
          id: newId,
          status: 'running',
          startedAt: new Date().toISOString(),
          finishedAt: undefined,
          errorMessage: undefined,
          steps: original.steps.map((s, idx) => ({
            ...s,
            id: generateId('step'),
            status: idx === 0 ? 'running' : 'pending',
          })),
          logs: [
            {
              id: generateId('log'),
              timestamp: new Date().toISOString(),
              level: 'info',
              source: 'WorkflowEngine',
              message: `Reintento de ejecución iniciado para ${original.workflowName}`,
            },
          ],
        };

        set((state) => ({
          executions: [newExecution, ...state.executions],
          selectedExecutionId: newId,
        }));

        // Simulate background steps completion
        setTimeout(() => {
          set((state) => ({
            executions: state.executions.map((e) =>
              e.id === newId
                ? {
                    ...e,
                    status: 'completed',
                    finishedAt: new Date().toISOString(),
                    durationMs: 19500,
                    steps: e.steps.map((s) => ({ ...s, status: 'completed' })),
                    logs: [
                      ...e.logs,
                      {
                        id: generateId('log'),
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        source: 'WorkflowEngine',
                        message: 'Reintento completado satisfactoriamente con código 0.',
                      },
                    ],
                  }
                : e
            ),
          }));
        }, 3000);

        return newId;
      },

      getExecutionById: (id) => {
        return get().executions.find((e) => e.id === id);
      },
    }),
    {
      name: 'agenthub-executions-storage',
      partialize: (state) => ({ executions: state.executions }),
    }
  )
);

