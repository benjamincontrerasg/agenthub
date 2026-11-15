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
import { KeyRound, ShieldAlert, Zap, Globe, Sparkles, Wrench } from 'lucide-react';
import { useConnectProvider, useTestProvider } from './hooks';
import { PROVIDER_PRESETS } from './presets';

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
  const [selectedKind, setSelectedKind] = useState<'openai-compatible' | 'anthropic'>('openai-compatible');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setSelectedModel(provider.defaultModelId || provider.models[0]?.id || '');
      const preset = PROVIDER_PRESETS[provider.id];
      if (preset) {
        setSelectedPresetKey(provider.id);
        setCustomEndpoint(provider.apiEndpoint || preset.baseUrl);
        setSelectedKind(preset.kind);
      } else {
        setSelectedPresetKey('custom');
        setCustomEndpoint(provider.apiEndpoint || '');
        setSelectedKind((provider as any).kind || 'openai-compatible');
      }
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

  const currentModel = provider.models.find((m) => m.id === selectedModel);
  const currentModelSupportsTools = currentModel?.supportsToolCalling ?? true;

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetKey(presetId);
    if (presetId in PROVIDER_PRESETS) {
      const p = PROVIDER_PRESETS[presetId];
      setCustomEndpoint(p.baseUrl);
      setSelectedKind(p.kind);
    }
  };

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
        apiKey: apiKey.trim() || undefined,
        defaultModelId: selectedModel || undefined,
        baseUrl: customEndpoint.trim() || undefined,
        kind: selectedKind,
      });
      // Limpiar credencial de la memoria del navegador inmediatamente
      setApiKey('');
      handleClose();
    } catch {
      // Manejado y notificado por el hook de mutación
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="sm:max-w-lg">
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
                  Ajustes de conexión unificada, endpoints y selección de modelos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Security Notice Box */}
          <div className="mb-4 rounded-[8px] border border-fg-warning/60 bg-bg-warning/30 p-3 text-caption text-fg-warning flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-fg-warning mt-0.5" />
            <div className="space-y-1">
              <span className="font-[510] block">Manejo Seguro de Credenciales (Write-Only):</span>
              <p className="text-caption text-fg-warning/80 leading-relaxed">
                Por política Zero-Trust, el backend nunca retorna tu API key guardada. Si deseas conservarla sin cambios, deja el campo vacío. Las credenciales se cifran con AES-256-GCM y derivación HKDF.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Preset Selector */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-fg-brand" />
                Plantilla / Preset de Proveedor
              </label>
              <Select
                value={selectedPresetKey}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {Object.values(PROVIDER_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.kind})
                  </option>
                ))}
                <option value="custom">Personalizado / Endpoint propio (OpenAI-Compatible)</option>
              </Select>
            </div>

            {/* Base URL Input */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-fg-brand" />
                URL Base de la API (Endpoint)
              </label>
              <Input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
              <span className="text-[11px] text-fg-muted mt-1 block">
                Protección SSRF activa: IPs privadas y metadatos están bloqueados salvo localhost en proveedores locales.
              </span>
            </div>

            {/* API Key Input (Write-Only) */}
            {provider.id !== 'ollama' && (
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-fg-brand" />
                    API Key / Token Secreto
                  </span>
                  {provider.hasApiKey ? (
                    <span className="text-caption text-fg-success font-mono font-medium">
                      ✓ Credencial configurada
                    </span>
                  ) : (
                    <span className="text-caption text-fg-muted font-mono">
                      Sin credencial
                    </span>
                  )}
                </label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={provider.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'Ingresa la API key del proveedor'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <span className="text-[11px] text-fg-muted mt-1 block">
                  {provider.hasApiKey
                    ? 'Deja este campo vacío para mantener la clave actual sin modificaciones.'
                    : 'Requerida para realizar llamadas a través de este proveedor.'}
                </span>
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
                    {m.name} ({Math.round(m.contextWindow / 1000)}k ctx · ${m.inputPricePerMillion}/M in · {m.supportsToolCalling ? 'Tools OK' : 'Sin Tools'})
                  </option>
                ))}
              </Select>
            </div>

            {/* Tool Capability Warning */}
            {!currentModelSupportsTools && (
              <div className="rounded-[6px] border border-status-warning/40 bg-status-warning/10 p-2.5 text-xs text-status-warning flex items-start gap-2">
                <Wrench className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Advertencia Zero-Trust:</strong> El modelo seleccionado (<code>{currentModel?.name || selectedModel}</code>) no tiene soporte para Tool Calling. Si un agente con herramientas asignadas usa este modelo, las ejecuciones de tools fallarán.
                </span>
              </div>
            )}

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
