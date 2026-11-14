import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService } from '@/services/workflows.service';
import { Workflow } from '@/types';
import { toast } from '@/stores/toast.store';

export const WORKFLOWS_QUERY_KEY = ['workflows'] as const;

export function useWorkflows() {
  return useQuery<Workflow[], Error>({
    queryKey: WORKFLOWS_QUERY_KEY,
    queryFn: () => workflowsService.getWorkflows(),
  });
}

export function useWorkflow(id?: string) {
  return useQuery<Workflow, Error>({
    queryKey: [...WORKFLOWS_QUERY_KEY, id],
    queryFn: () => workflowsService.getWorkflowById(id!),
    enabled: Boolean(id),
  });
}

export function useSaveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow: Workflow) => workflowsService.saveWorkflow(workflow),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Flujo Guardado', `"${saved.name}" se guardó con éxito en el servidor.`);
    },
    onError: (error: Error) => {
      toast.error('Error al guardar', error.message || 'No se pudo guardar el flujo');
    },
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, inputs }: { id: string; inputs?: Record<string, any> }) =>
      workflowsService.executeWorkflow(id, inputs),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Ejecución Iniciada', `Pipeline arrancó con ID: ${res.executionId}`);
    },
    onError: (error: Error) => {
      toast.error('Error de ejecución', error.message || 'No se pudo ejecutar el flujo');
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workflowsService.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Flujo Eliminado', 'El workflow fue eliminado del sistema.');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', error.message || 'No se pudo eliminar el workflow');
    },
  });
}
