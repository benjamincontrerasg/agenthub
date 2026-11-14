import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsService } from '@/services/agents.service';
import { Agent } from '@/types';
import { toast } from '@/stores/toast.store';

export const AGENTS_QUERY_KEY = ['agents'] as const;

export function useAgents() {
  return useQuery<Agent[], Error>({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: () => agentsService.getAgents(),
  });
}

export function useAgent(id?: string) {
  return useQuery<Agent, Error>({
    queryKey: [...AGENTS_QUERY_KEY, id],
    queryFn: () => agentsService.getAgentById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) =>
      agentsService.createAgent(agentData),
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('Agente Creado', `El agente "${newAgent.name}" se registró con éxito.`);
    },
    onError: (error: Error) => {
      toast.error('Error al crear agente', error.message || 'No se pudo guardar el agente');
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Agent> }) =>
      agentsService.updateAgent(id, updates),
    onSuccess: (updatedAgent) => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('Agente Actualizado', `Cambios en "${updatedAgent.name}" guardados.`);
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar', error.message || 'No se pudieron guardar los cambios');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentsService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('Agente Eliminado', 'El agente fue removido del sistema.');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', error.message || 'No se pudo eliminar el agente');
    },
  });
}

export function useToggleAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      return agentsService.updateAgent(id, { status: nextStatus });
    },
    onSuccess: (updatedAgent) => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      const statusLabel = updatedAgent.status === 'active' ? 'Activado' : 'Pausado';
      toast.success(`Agente ${statusLabel}`, `Estado de "${updatedAgent.name}" actualizado.`);
    },
    onError: (error: Error) => {
      toast.error('Error de estado', error.message || 'No se pudo cambiar el estado del agente');
    },
  });
}
