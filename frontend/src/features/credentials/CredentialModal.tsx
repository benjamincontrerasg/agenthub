import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import { useCreateCredential } from './hooks';
import { useProviders } from '@/features/providers/hooks';

const credentialSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  providerId: z.string().min(1, 'Selecciona un proveedor'),
  apiKey: z.string().min(1, 'Ingresa la API key'),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

interface CredentialModalProps {
  open: boolean;
  onClose: () => void;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({ open, onClose }) => {
  const { data: providers = [] } = useProviders();
  const createCredentialMutation = useCreateCredential();
  const [showKey, setShowKey] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: '',
      providerId: 'openai',
      apiKey: '',
    },
  });

  const onSubmit = async (data: CredentialFormData) => {
    try {
      await createCredentialMutation.mutateAsync(data);
      reset();
      onClose();
    } catch {
      // Error handled by mutation toast
    }
  };

  const providerOptions = providers.length > 0
    ? providers.map((p) => ({
        value: p.id,
        label: p.name,
        description: p.badge,
      }))
    : [
        { value: 'openai', label: 'OpenAI', description: 'GPT-4o, o1, o3' },
        { value: 'anthropic', label: 'Anthropic', description: 'Claude 3.7 Sonnet' },
        { value: 'gemini', label: 'Google Gemini', description: 'Gemini 2.5 Pro / Flash' },
        { value: 'groq', label: 'Groq Cloud', description: 'Llama 3, Mixtral' },
        { value: 'openrouter', label: 'OpenRouter', description: 'Multi-provider Gateway' },
        { value: 'deepseek', label: 'DeepSeek', description: 'DeepSeek V3, R1' },
      ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-fg-brand/10 text-fg-brand">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Nueva API Key en Bóveda</DialogTitle>
                <DialogDescription>
                  Guarda una credencial con un alias descriptivo para asignarla a tus agentes por nombre.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Alias / Nombre */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                Nombre de la Credencial (Alias)
              </label>
              <Input
                placeholder="ej. OpenAI Producción, Anthropic Equipo Dev..."
                error={errors.name?.message}
                {...register('name')}
              />
              <p className="mt-1 text-xs text-fg-secondary">
                Este nombre es el que verás en el selector de cada agente al asignarle la clave.
              </p>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                Proveedor de IA
              </label>
              <Controller
                name="providerId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={providerOptions}
                  />
                )}
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                API Key Secreta
              </label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  className="pr-10 font-mono text-xs"
                  error={errors.apiKey?.message}
                  {...register('apiKey')}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-fg-secondary hover:text-fg-primary focus:outline-none"
                  title={showKey ? 'Ocultar' : 'Mostrar'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 p-2.5 rounded-[6px] bg-bg-card/60 border border-border-default/80 flex items-start gap-2">
                <Shield className="h-4 w-4 text-fg-success shrink-0 mt-0.5" />
                <p className="text-xs text-fg-secondary leading-relaxed">
                  <strong className="text-fg-primary">Bóveda Zero-Trust:</strong> Se encripta con AES-256-GCM y HKDF en el servidor. Nunca se devuelve ni expone completa por la red.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={createCredentialMutation.isPending}
            >
              {createCredentialMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar en Bóveda'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
