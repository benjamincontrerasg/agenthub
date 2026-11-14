import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpService } from '@/services/mcp.service';
import { MCPServer } from '@/types';
import { toast } from '@/stores/toast.store';

export const MCP_QUERY_KEY = ['mcp-servers'] as const;

export function useMCPServers() {
  return useQuery<MCPServer[], Error>({
    queryKey: MCP_QUERY_KEY,
    queryFn: () => mcpService.getServers(),
  });
}

export function useRegisterMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      description: string;
      transport: 'stdio' | 'streamable-http';
      commandOrEndpoint: string;
      args?: string[];
      env?: Record<string, string>;
      allowedDirectories?: string[];
    }) => mcpService.registerServer(payload),
    onSuccess: (newServer) => {
      queryClient.invalidateQueries({ queryKey: MCP_QUERY_KEY });
      toast.success('Servidor MCP Registrado', `"${newServer.name}" registrado en modo Zero-Trust.`);
    },
    onError: (error: Error) => {
      toast.error('Error de registro', error.message || 'No se pudo registrar el servidor MCP');
    },
  });
}

export function useValidateMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mcpService.validateServer(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MCP_QUERY_KEY });
      toast.success('Validación Exitosa', data.message);
    },
    onError: (error: Error) => {
      toast.error('Fallo de validación', error.message || 'No se pudo validar el servidor');
    },
  });
}

export function useToggleMCPActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      mcpService.toggleActivation(id, active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MCP_QUERY_KEY });
      toast.success(
        variables.active ? 'Servidor Activado' : 'Servidor Desactivado',
        `Estado del servidor MCP actualizado.`
      );
    },
    onError: (error: Error) => {
      toast.error('Error de activación', error.message || 'No se pudo cambiar el estado');
    },
  });
}

export function useDeleteMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mcpService.deleteServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MCP_QUERY_KEY });
      toast.success('Servidor Eliminado', 'El servidor MCP fue removido correctamente.');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', error.message || 'No se pudo eliminar el servidor MCP');
    },
  });
}
