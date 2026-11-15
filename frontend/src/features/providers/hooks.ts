import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersService } from '@/services/providers.service';
import { ProviderId, AIProvider } from '@/types';
import { toast } from '@/stores/toast.store';

export const PROVIDERS_QUERY_KEY = ['providers'] as const;

export function useProviders() {
  return useQuery<AIProvider[], Error>({
    queryKey: PROVIDERS_QUERY_KEY,
    queryFn: () => providersService.getProviders(),
  });
}

export function useConnectProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      apiKey,
      defaultModelId,
      baseUrl,
      kind,
    }: {
      id: ProviderId;
      apiKey?: string;
      defaultModelId?: string;
      baseUrl?: string;
      kind?: string;
    }) => providersService.connectProvider(id, apiKey, defaultModelId, baseUrl, kind),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success('Proveedor conectado', data.message);
    },
    onError: (error: Error) => {
      toast.error('Error al conectar', error.message || 'No se pudo conectar el proveedor');
    },
  });
}

export function useDisconnectProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ProviderId) => providersService.disconnectProvider(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success('Proveedor desconectado', data.message);
    },
    onError: (error: Error) => {
      toast.error('Error al desconectar', error.message || 'No se pudo desconectar el proveedor');
    },
  });
}

export function useTestProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ProviderId) => providersService.testConnection(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success('Prueba de conexión exitosa', data.message);
    },
    onError: (error: Error) => {
      toast.error('Fallo de prueba', error.message || 'No se pudo verificar la conexión');
    },
  });
}

export function useSetDefaultModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      defaultModelId,
    }: {
      id: ProviderId;
      defaultModelId: string;
    }) => providersService.setDefaultModel(id, defaultModelId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success('Modelo predeterminado actualizado', data.message);
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar modelo', error.message || 'No se pudo cambiar el modelo predeterminado');
    },
  });
}
