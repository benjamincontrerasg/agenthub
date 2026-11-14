import React, { useState } from 'react';
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
import { useProvidersStore } from '@/stores/providers.store';
import { toast } from '@/stores/toast.store';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { KeyRound, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';

interface ProviderModalProps {
  provider: AIProvider | null;
  open: boolean;
  onClose: () => void;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({ provider, open, onClose }) => {
  const { connectProvider, setDefaultModel, testProviderConnection } = useProvidersStore();

  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(provider?.defaultModelId || '');
  const [customEndpoint, setCustomEndpoint] = useState(provider?.apiEndpoint || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (provider) {
      setSelectedModel(provider.defaultModelId);
      setCustomEndpoint(provider.apiEndpoint || '');
      setTestResult(null);
      setApiKey('');
    }
  }, [provider]);

  if (!provider) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testProviderConnection(provider.id);
      setTestResult(`✓ Conexión exitosa. Latencia: ${res.latencyMs}ms`);
    } catch (err: any) {
      setTestResult(`✗ Fallo de prueba: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await connectProvider(provider.id, apiKey, selectedModel);
      if (selectedModel) {
        setDefaultModel(provider.id, selectedModel);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-md">
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
                Las API Keys se tratan como secretos cifrados. En producción son transmitidas exclusivamente al Backend Vault a través de canal TLS seguro y nunca se persisten en texto plano en el cliente.
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
                    API Key / Secret Token
                  </span>
                  {provider.hasApiKey && (
                    <span className="text-caption text-fg-success font-mono">
                      ✓ Credencial configurada
                    </span>
                  )}
                </label>
                <Input
                  type="password"
                  placeholder={provider.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'sk-ant-api03-... o sk-proj-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
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
                  isLoading={isTesting}
                  className="text-caption"
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                  Probar Conexión en Vivo
                </Button>
                {testResult && (
                  <span className="text-caption font-medium text-fg-success font-mono">
                    {testResult}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={isSubmitting}>
              Guardar y Conectar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

