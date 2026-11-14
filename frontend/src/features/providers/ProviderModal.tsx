import React, { useState, useEffect } from 'react';
import { AIProvider } from '@/types';
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
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { KeyRound, ShieldAlert, Zap } from 'lucide-react';
import { useConnectProvider, useTestProvider } from './hooks';

interface ProviderModalProps {
  provider: AIProvider | null;
  open: boolean;
  onClose: () => void;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({ provider, open, onClose }) => {
  const connectMutation = useConnectProvider();
  const testMutation = useTestProvider();

  // Local state for sensitive secret only during modal interaction
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setSelectedModel(provider.defaultModelId || provider.models[0]?.id || '');
      setCustomEndpoint(provider.apiEndpoint || '');
      setTestResult(null);
      setApiKey('');
    } else {
      setApiKey('');
      setTestResult(null);
    }
  }, [provider, open]);

  const handleClose = () => {
    setApiKey('');
    setTestResult(null);
    onClose();
  };

  if (!provider) return null;

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await testMutation.mutateAsync(provider.id);
      setTestResult(`✓ Conexión exitosa. Latencia: ${res.latencyMs}ms`);
    } catch (err: any) {
      setTestResult(`✗ Fallo de prueba: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await connectMutation.mutateAsync({
        id: provider.id,
        apiKey: apiKey.trim(),
        defaultModelId: selectedModel || undefined,
      });
      // Clear sensitive memory immediately
      setApiKey('');
      handleClose();
    } catch {
      // Error is handled and toasted by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ProviderLogo providerId={provider.id} size="lg" className="shadow-md" />
              <div>
                <DialogTitle className="flex items-center gap-2">
                  Configurar {provider.name}
                  <Badge variant="outline" className="text-caption">{provider.badge}</Badge>
                </DialogTitle>
                <DialogDescription>
                  Credenciales de acceso y selección de modelos de inferencia.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Security Notice Box */}
          <div className="mb-4 rounded-lg border border-fg-warning/60 bg-bg-warning/30 p-3 text-caption text-fg-warning flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-fg-warning mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Manejo de Credenciales Sensibles:</span>
              <p className="text-caption text-fg-warning/80 leading-relaxed">
                Las API Keys se transmiten cifradas mediante TLS hacia el backend con cifrado AES-256-GCM. Nunca se almacenan en texto plano en el cliente ni se persisten en caché ni localStorage.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* API Key Input */}
            {provider.id !== 'ollama' ? (
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-fg-brand" />
                    API Key / Token Secreto
                  </span>
                  {provider.hasApiKey && (
                    <span className="text-caption text-fg-success font-mono">
                      ✓ Credencial configurada
                    </span>
                  )}
                </label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={provider.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'sk-ant-api03-... o sk-proj-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!provider.hasApiKey}
                />
              </div>
            ) : (
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1.5">
                  Endpoint HTTP Local (Ollama Server)
                </label>
                <Input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                />
              </div>
            )}

            {/* Default Model Selector */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1.5">
                Modelo Predeterminado para Nuevos Agentes
              </label>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {provider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.contextWindow / 1000}k ctx - ${m.inputPricePerMillion}/M in)
                  </option>
                ))}
              </Select>
            </div>

            {/* Test Connection Button and Feedback */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  isLoading={testMutation.isPending}
                  className="text-caption"
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                  Probar Conexión en Vivo
                </Button>
                {testResult && (
                  <span className={`text-caption font-medium font-mono ${testResult.startsWith('✓') ? 'text-fg-success' : 'text-fg-error'}`}>
                    {testResult}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={connectMutation.isPending}
            >
              Guardar y Conectar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
