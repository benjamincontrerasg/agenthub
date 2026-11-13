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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Proveedores de Inteligencia Artificial
            <Badge variant="secondary" className="font-mono text-xs">{providers.length} Disponibles</Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
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
              className="flex flex-col justify-between border-slate-800 bg-slate-900/60 hover:border-slate-700/80 transition-all"
            >
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/70 shadow-inner text-lg font-bold text-violet-400">
                      {provider.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {provider.badge}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isConnected ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <XCircle className="h-3.5 w-3.5" /> No conectado
                          </span>
                        )}
                        {provider.latencyMs && isConnected && (
                          <span className="text-[11px] font-mono text-slate-400">
                            • {provider.latencyMs}ms ping
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant={isConnected ? 'success' : 'secondary'} className="text-[10px]">
                    {isConnected ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {provider.description}
                  </p>

                  {/* Models list inside provider */}
                  <div className="space-y-2 rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-violet-400" />
                        Modelos Disponibles ({provider.models.length})
                      </span>
                      <span>Ctx / Precios</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {provider.models.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{model.name}</span>
                            {model.id === provider.defaultModelId && (
                              <Badge variant="default" className="text-[9px] py-0 px-1">
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {model.contextWindow / 1000}k ctx • ${model.inputPricePerMillion}/M
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security and credentials disclaimer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      {provider.id === 'ollama' ? 'Inferencia Local sin envío de datos' : 'Vault E2E TLS'}
                    </span>
                    {provider.lastTested && (
                      <span className="flex items-center gap-1 text-[10px] font-mono">
                        <Clock className="h-3 w-3" /> {formatDate(provider.lastTested)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTest(provider)}
                    isLoading={testingId === provider.id}
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                    Probar Ping
                  </Button>
                  {testNotice?.id === provider.id && (
                    <span className="text-xs font-mono font-medium text-emerald-400">
                      {testNotice.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => disconnectProvider(provider.id)}
                    >
                      Desconectar
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs"
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

