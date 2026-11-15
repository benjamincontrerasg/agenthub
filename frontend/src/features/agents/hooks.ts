import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsService, AgentMemoryItem } from '@/services/agents.service';
import { Agent } from '@/types';
import { toast } from '@/stores/toast.store';

export const AGENTS_QUERY_KEY = ['agents'] as const;
export const MEMORIES_QUERY_KEY = ['agent_memories'] as const;

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

export function useAgentMemories(agentId?: string) {
  return useQuery<AgentMemoryItem[], Error>({
    queryKey: [...MEMORIES_QUERY_KEY, agentId],
    queryFn: () => agentsService.getMemories(agentId!),
    enabled: Boolean(agentId),
  });
}

export function useAddAgentMemory(agentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, metadata }: { content: string; metadata?: Record<string, any> }) =>
      agentsService.addMemory(agentId!, content, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MEMORIES_QUERY_KEY, agentId] });
      toast.success('Memoria Almacenada', 'El conocimiento semántico fue indexado en el vector store.');
    },
    onError: (error: Error) => {
      toast.error('Error al guardar memoria', error.message || 'No se pudo guardar la memoria');
    },
  });
}

export function useDeleteAgentMemory(agentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memoryId: string) => agentsService.deleteMemory(agentId!, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MEMORIES_QUERY_KEY, agentId] });
      toast.success('Memoria Eliminada', 'El recuerdo fue purgado de la memoria semántica.');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar memoria', error.message || 'No se pudo eliminar el registro');
    },
  });
}
