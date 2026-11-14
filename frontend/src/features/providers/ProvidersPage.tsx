import React, { useState } from 'react';
import {
  Cpu,
  KeyRound,
  CheckCircle2,
  XCircle,
  Zap,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProvidersStore } from '@/stores/providers.store';
import { ProviderModal } from './ProviderModal';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { AIProvider } from '@/types';
import { formatDate } from '@/lib/utils';

export const ProvidersPage: React.FC = () => {
  const { providers, testProviderConnection, disconnectProvider } = useProvidersStore();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<{ id: string; text: string } | null>(null);

  const handleTest = async (provider: AIProvider) => {
    setTestingId(provider.id);
    setTestNotice(null);
    try {
      const res = await testProviderConnection(provider.id);
      setTestNotice({ id: provider.id, text: `✓ OK (${res.latencyMs}ms)` });
    } catch (e: any) {
      setTestNotice({ id: provider.id, text: '✗ Error' });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary flex items-center gap-2">
            Proveedores de Inteligencia Artificial
            <Badge variant="secondary" className="font-mono text-caption">{providers.length} Disponibles</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Conecta credenciales para Claude, GPT-4o, Gemini y Ollama. Las llamadas se distribuyen según las capacidades de cada modelo.
          </p>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => {
          const isConnected = provider.status === 'connected';
          const defaultModel = provider.models.find((m) => m.id === provider.defaultModelId) || provider.models[0];

          return (
            <Card
              key={provider.id}
              className="flex flex-col justify-between border-border-default bg-bg-card/60 hover:border-slate-700/80 transition-all"
            >
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center space-x-3.5">
                    <ProviderLogo providerId={provider.id} size="xl" className="shadow-lg ring-1 ring-slate-800" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-subtitle font-semibold">{provider.name}</CardTitle>
                        <Badge variant="outline" className="text-caption font-mono">
                          {provider.badge}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isConnected ? (
                          <span className="flex items-center gap-1 text-caption text-fg-success font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-caption text-fg-secondary font-medium">
                            <XCircle className="h-3.5 w-3.5" /> No conectado
                          </span>
                        )}
                        {provider.latencyMs && isConnected && (
                          <span className="text-caption font-mono text-fg-secondary">
                            • {provider.latencyMs}ms ping
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant={isConnected ? 'success' : 'secondary'} className="text-caption">
                    {isConnected ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  <p className="text-caption text-fg-secondary leading-relaxed">
                    {provider.description}
                  </p>

                  {/* Models list inside provider */}
                  <div className="space-y-2 rounded-lg bg-bg-card/60 p-3 border border-border-default/80">
                    <div className="flex items-center justify-between text-caption font-medium text-fg-secondary">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-fg-brand" />
                        Modelos Disponibles ({provider.models.length})
                      </span>
                      <span>Ctx / Precios</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {provider.models.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between text-caption py-1 px-2 rounded hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-fg-primary">{model.name}</span>
                            {model.id === provider.defaultModelId && (
                              <Badge variant="default" className="text-caption py-0 px-1">
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-caption font-mono text-fg-secondary">
                            {model.contextWindow / 1000}k ctx • ${model.inputPricePerMillion}/M
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security and credentials disclaimer */}
                  <div className="flex items-center justify-between text-caption text-fg-secondary pt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-fg-success" />
                      {provider.id === 'ollama' ? 'Inferencia Local sin envío de datos' : 'Vault E2E TLS'}
                    </span>
                    {provider.lastTested && (
                      <span className="flex items-center gap-1 text-caption font-mono">
                        <Clock className="h-3 w-3" /> {formatDate(provider.lastTested)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border-default/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-caption"
                    onClick={() => handleTest(provider)}
                    isLoading={testingId === provider.id}
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                    Probar Ping
                  </Button>
                  {testNotice?.id === provider.id && (
                    <span className="text-caption font-mono font-medium text-fg-success">
                      {testNotice.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-caption text-fg-error hover:text-red-300"
                      onClick={() => disconnectProvider(provider.id)}
                    >
                      Desconectar
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="text-caption"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                    Configurar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Provider Configuration Modal */}
      <ProviderModal
        provider={selectedProvider}
        open={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
      />
    </div>
  );
};

