import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialsService } from '@/services/credentials.service';
import { APICredential } from '@/types';
import { toast } from '@/stores/toast.store';

export const CREDENTIALS_QUERY_KEY = ['credentials'] as const;

export function useCredentials() {
  return useQuery<APICredential[], Error>({
    queryKey: CREDENTIALS_QUERY_KEY,
    queryFn: () => credentialsService.getCredentials(),
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; providerId: string; apiKey: string }) =>
      credentialsService.createCredential(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('API Key guardada', `Se guardó '${data.name}' en la bóveda cifrada.`);
    },
    onError: (error: Error) => {
      toast.error('Error al guardar credencial', error.message || 'No se pudo guardar la API Key');
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => credentialsService.deleteCredential(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Credencial eliminada', 'La API Key fue removida de la bóveda de forma segura.');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar credencial', error.message || 'No se pudo eliminar la credencial');
    },
  });
}
