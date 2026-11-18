import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Trash2,
  Save,
  Server,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { ProviderId } from '@/types';
import {
  useProviders,
  useConnectProvider,
  useDisconnectProvider,
  useTestProvider,
} from '@/features/providers/hooks';

export const ApiKeysVault: React.FC = () => {
  const { data: providers = [], isLoading } = useProviders();
  const connectMutation = useConnectProvider();
  const disconnectMutation = useDisconnectProvider();
  const testMutation = useTestProvider();

  // Local state for keys inputs (never stored in localStorage or persisted on client)
  const [keysInput, setKeysInput] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { text: string; isError?: boolean }>>({});

  const handleKeyChange = (providerId: string, val: string) => {
    setKeysInput((prev) => ({ ...prev, [providerId]: val }));
  };

  const toggleVisibility = (providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSaveKey = async (providerId: ProviderId) => {
    const key = keysInput[providerId]?.trim();
    if (!key && providerId !== 'ollama') return;

    try {
      await connectMutation.mutateAsync({
        id: providerId,
        apiKey: key || '',
      });
      // Clear input after saving for security
      setKeysInput((prev) => ({ ...prev, [providerId]: '' }));
    } catch {
      // Handled by mutation toast
    }
  };

  const handleTestConnection = async (providerId: ProviderId) => {
    setTestingId(providerId);
    setTestResults((prev) => ({ ...prev, [providerId]: { text: 'Probando...' } }));
    try {
      const res = await testMutation.mutateAsync(providerId);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { text: `✓ Conexión OK (${res.latencyMs}ms)` },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { text: `✗ Error: ${err.message || 'Fallo de conexión'}`, isError: true },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDisconnect = async (providerId: ProviderId) => {
    if (confirm(`¿Eliminar la API Key almacenada para ${providerId}? El agente no podrá realizar inferencias reales hasta que vuelvas a configurarla.`)) {
      try {
        await disconnectMutation.mutateAsync(providerId);
        setTestResults((prev) => {
          const next = { ...prev };
          delete next[providerId];
          return next;
        });
      } catch {
        // Handled by toast
      }
    }
  };

  const providerPlaceholders: Record<string, string> = {
    anthropic: 'sk-ant-api03-... (Anthropic Console)',
    openai: 'sk-proj-... (OpenAI Platform)',
    gemini: 'AIzaSy... (Google AI Studio)',
    ollama: 'http://localhost:11434 (Servidor local)',
  };

  const providerLinks: Record<string, { url: string; label: string }> = {
    anthropic: { url: 'https://console.anthropic.com/settings/keys', label: 'Obtener en Anthropic Console' },
    openai: { url: 'https://platform.openai.com/api-keys', label: 'Obtener en OpenAI Platform' },
    gemini: { url: 'https://aistudio.google.com/app/apikey', label: 'Obtener en Google AI Studio' },
    ollama: { url: 'https://ollama.com', label: 'Descargar Ollama' },
  };

  return (
    <Card className="border-border-default bg-bg-card/95 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-subtitle sm:text-lg flex items-center gap-2 text-fg-primary">
            <KeyRound className="h-5 w-5 text-fg-brand" />
            Bóveda de Claves de API & Modelos LLM
          </CardTitle>
          <Badge variant="outline" className="border-border-brand/50 text-fg-brand font-mono text-caption">
            AES-256-GCM Zero-Trust
          </Badge>
        </div>
        <CardDescription className="text-caption text-fg-secondary">
          Configura y cifra de forma segura tus API Keys para cada proveedor. El backend las almacena cifradas en reposo usando la clave maestra de entorno.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Alert Banner */}
        <div className="p-3.5 rounded-[10px] border border-border-brand/40 bg-bg-brand-subtle/30 text-caption text-fg-secondary flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-fg-brand mt-0.5" />
          <div className="space-y-1">
            <span className="font-[510] text-fg-brand block">Cifrado Criptográfico en Reposo:</span>
            <p className="text-caption text-fg-secondary leading-relaxed">
              Tus claves nunca se almacenan en texto plano en la base de datos ni en el almacenamiento del navegador. Son cifradas con <strong>AES-256-GCM</strong> mediante el backend y descifradas en memoria solo en el momento exacto de ejecutar la inferencia del agente.
            </p>
          </div>
        </div>

        {/* Provider List */}
        <div className="space-y-4">
          {providers.map((p) => {
            const isOllama = p.id === 'ollama';
            const isVisible = visibleKeys[p.id];
            const testResult = testResults[p.id];
            const link = providerLinks[p.id];

            return (
              <div
                key={p.id}
                className="p-4 rounded-[12px] border border-border-default/80 bg-bg-surface/50 hover:bg-bg-surface/70 transition-colors space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border-default/50">
                  <div className="flex items-center gap-3">
                    <ProviderLogo providerId={p.id} size="md" rounded="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-body font-[510] text-fg-primary">{p.name}</span>
                        <Badge variant="secondary" className="text-[11px] font-mono py-0">
                          {p.badge}
                        </Badge>
                      </div>
                      <p className="text-caption text-fg-secondary">{p.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {p.hasApiKey || isOllama ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-bg-success-subtle text-fg-success text-caption font-medium border border-border-success/40">
                        <CheckCircle2 className="h-3 w-3" />
                        {isOllama ? 'Servidor Activo' : 'Clave Cifrada & Conectada'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-bg-warning-subtle text-fg-warning text-caption font-medium border border-border-warning/40">
                        <AlertTriangle className="h-3 w-3" />
                        Sin configurar
                      </span>
                    )}
                  </div>
                </div>

                {/* Input & Action Controls */}
                {!isOllama ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={isVisible ? 'text' : 'password'}
                          autoComplete="off"
                          placeholder={p.hasApiKey ? '••••••••••••••••••••••••••••••••' : providerPlaceholders[p.id] || 'sk-...'}
                          value={keysInput[p.id] || ''}
                          onChange={(e) => handleKeyChange(p.id, e.target.value)}
                          className="pr-10 text-caption font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(p.id)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg-primary p-1 cursor-pointer"
                          title={isVisible ? 'Ocultar' : 'Mostrar'}
                        >
                          {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveKey(p.id)}
                          isLoading={connectMutation.isPending}
                          disabled={!keysInput[p.id]?.trim()}
                          className="text-caption"
                        >
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                          Guardar y Cifrar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(p.id)}
                          isLoading={testingId === p.id}
                          disabled={!p.hasApiKey && !keysInput[p.id]?.trim()}
                          className="text-caption"
                        >
                          <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                          Probar
                        </Button>

                        {p.hasApiKey && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(p.id)}
                            isLoading={disconnectMutation.isPending}
                            className="text-caption text-fg-error hover:bg-bg-error-subtle hover:text-fg-error"
                            title="Eliminar API Key almacenada"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-fg-secondary">
                      {link && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-fg-brand hover:underline"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {testResult && (
                        <span
                          className={`font-mono font-medium ${
                            testResult.isError ? 'text-fg-error' : 'text-fg-success'
                          }`}
                        >
                          {testResult.text}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Ollama Local Controls */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card/40 p-3 rounded-[8px] border border-border-default/60">
                    <div className="flex items-center gap-2 text-caption text-fg-secondary">
                      <Server className="h-4 w-4 text-fg-brand" />
                      <span>Endpoint local: <strong className="text-fg-primary font-mono">http://localhost:11434</strong></span>
                      <span className="text-[11px] text-fg-muted">(Sin API Key requerida, inferencia 100% privada)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection('ollama')}
                        isLoading={testingId === 'ollama'}
                        className="text-caption"
                      >
                        <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                        Probar Ping Ollama
                      </Button>

                      {testResult && (
                        <span
                          className={`font-mono text-caption font-medium ${
                            testResult.isError ? 'text-fg-error' : 'text-fg-success'
                          }`}
                        >
                          {testResult.text}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
