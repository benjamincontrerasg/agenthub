import React, { useState } from 'react';
import {
  Server,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Trash2,
  Wrench,
  Terminal,
  FolderLock,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Users,
  ChevronRight,
  RefreshCw,
  Zap,
  Clock,
  Code,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  useMCPServers,
  useValidateMCPServer,
  useToggleMCPActivation,
  useDeleteMCPServer,
  useExecuteMCPTool,
} from './hooks';
import { RegisterMCPServerModal } from './RegisterMCPServerModal';
import { AssignToolModal } from './AssignToolModal';
import { MCPServer, MCPTool } from '@/types';
import { formatDate } from '@/lib/utils';

export const MCPPage: React.FC = () => {
  const { data: servers = [], isLoading } = useMCPServers();
  const validateMutation = useValidateMCPServer();
  const toggleActivationMutation = useToggleMCPActivation();
  const deleteMutation = useDeleteMCPServer();
  const executeMutation = useExecuteMCPTool();

  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedToolForAssign, setSelectedToolForAssign] = useState<MCPTool | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'playground'>('details');

  // Playground state
  const [playgroundServerId, setPlaygroundServerId] = useState<string>('');
  const [playgroundToolName, setPlaygroundToolName] = useState<string>('');
  const [playgroundInput, setPlaygroundInput] = useState<string>('{}');
  const [playgroundResult, setPlaygroundResult] = useState<{
    output: any;
    executionTimeMs: number;
    requiresApproval: boolean;
  } | null>(null);

  const activeServer = servers.find((s) => s.id === (selectedServerId || servers[0]?.id)) || servers[0];

  const handleValidate = async (id: string) => {
    validateMutation.mutate(id);
  };

  const handleDelete = (server: MCPServer) => {
    if (confirm(`¿Eliminar el servidor MCP "${server.name}"?`)) {
      deleteMutation.mutate(server.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-[510] tracking-tight text-fg-primary flex items-center gap-2">
            MCP Hub (Model Context Protocol)
            <Badge variant="secondary" className="font-mono text-caption">
              {servers.length} Servidores
            </Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Administra servidores de herramientas y contexto externo para tus agentes con soporte STDIO y Streamable HTTP.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setRegisterModalOpen(true)}
          className="shadow-md shadow-violet-600/20"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Registrar Servidor MCP
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-default space-x-1">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2 text-caption font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'details'
              ? 'border-border-brand text-fg-brand font-[510]'
              : 'border-transparent text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Servidores y Herramientas</span>
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 px-4 py-2 text-caption font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'playground'
              ? 'border-border-brand text-fg-brand font-[510]'
              : 'border-transparent text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Playground de Herramientas</span>
        </button>
      </div>

      {/* Tab: Playground */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Tool Selector & Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-subtitle flex items-center gap-2">
                <Code className="h-4 w-4 text-fg-brand" />
                Selector y Parámetros
              </CardTitle>
              <CardDescription>
                Selecciona un servidor y herramienta MCP para ejecutar en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">Servidor MCP</label>
                <select
                  value={playgroundServerId}
                  onChange={(e) => {
                    setPlaygroundServerId(e.target.value);
                    setPlaygroundToolName('');
                    setPlaygroundResult(null);
                  }}
                  className="w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-2 text-caption text-fg-primary focus:border-border-brand focus:outline-none"
                >
                  <option value="">Seleccionar servidor...</option>
                  {servers.filter((s) => s.isActivated).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.transport})</option>
                  ))}
                </select>
              </div>

              {playgroundServerId && (
                <div>
                  <label className="block text-caption font-medium text-fg-secondary mb-1">Herramienta</label>
                  <select
                    value={playgroundToolName}
                    onChange={(e) => {
                      setPlaygroundToolName(e.target.value);
                      setPlaygroundResult(null);
                      const srv = servers.find((s) => s.id === playgroundServerId);
                      const tool = srv?.tools.find((t) => t.name === e.target.value);
                      if (tool?.inputSchema.properties) {
                        const defaults: Record<string, any> = {};
                        Object.entries(tool.inputSchema.properties).forEach(([key, def]) => {
                          defaults[key] = def.type === 'number' ? 0 : def.type === 'boolean' ? false : '';
                        });
                        setPlaygroundInput(JSON.stringify(defaults, null, 2));
                      } else {
                        setPlaygroundInput('{}');
                      }
                    }}
                    className="w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-2 text-caption text-fg-primary focus:border-border-brand focus:outline-none"
                  >
                    <option value="">Seleccionar herramienta...</option>
                    {servers.find((s) => s.id === playgroundServerId)?.tools.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.isWriteOperation ? '⚠️ Escritura' : '🔒 Lectura'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {playgroundToolName && (() => {
                const srv = servers.find((s) => s.id === playgroundServerId);
                const tool = srv?.tools.find((t) => t.name === playgroundToolName);
                return tool ? (
                  <div className="p-3 rounded-[6px] bg-bg-card/60 border border-border-default">
                    <p className="text-caption text-fg-secondary mb-1">{tool.description}</p>
                    <div className="flex items-center gap-2">
                      {tool.isWriteOperation ? (
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <ShieldAlert className="h-3 w-3" /> Operación de Escritura
                        </Badge>
                      ) : (
                        <Badge variant="info" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Solo Lectura
                        </Badge>
                      )}
                      {tool.requiresApproval && (
                        <Badge variant="secondary" className="text-[10px]">Requiere Aprobación</Badge>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Parámetros de Entrada (JSON)
                </label>
                <textarea
                  value={playgroundInput}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  rows={8}
                  className="w-full rounded-[6px] border border-border-default bg-black/60 p-3 text-caption font-mono text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-[#62666d]"
                  placeholder='{"key": "value"}'
                />
              </div>

              <Button
                variant="default"
                className="w-full"
                size="sm"
                disabled={!playgroundServerId || !playgroundToolName || executeMutation.isPending}
                onClick={() => {
                  try {
                    const parsed = JSON.parse(playgroundInput);
                    executeMutation.mutate(
                      { serverId: playgroundServerId, toolName: playgroundToolName, input: parsed },
                      { onSuccess: (data) => setPlaygroundResult(data) }
                    );
                  } catch {
                    setPlaygroundResult(null);
                  }
                }}
              >
                {executeMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" /> Ejecutar Herramienta
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Execution Result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-subtitle flex items-center gap-2">
                <Terminal className="h-4 w-4 text-fg-success" />
                Resultado de Ejecución
              </CardTitle>
              <CardDescription>
                Salida, latencia y metadatos de la última invocación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {playgroundResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-caption">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Completado
                    </Badge>
                    <span className="flex items-center gap-1 text-fg-secondary font-mono">
                      <Clock className="h-3 w-3" /> {playgroundResult.executionTimeMs}ms
                    </span>
                    {playgroundResult.requiresApproval && (
                      <Badge variant="warning" className="text-[10px]">Requiere Aprobación</Badge>
                    )}
                  </div>
                  <pre className="p-4 rounded-[6px] bg-black/60 border border-border-default text-caption font-mono text-fg-primary leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
                    {JSON.stringify(playgroundResult.output, null, 2)}
                  </pre>
                </div>
              ) : executeMutation.isError ? (
                <div className="text-center py-8 border border-dashed border-fg-error/30 rounded-[12px]">
                  <XCircle className="h-8 w-8 text-fg-error mx-auto mb-2" />
                  <p className="text-caption text-fg-error">Error en la ejecución</p>
                  <p className="text-caption text-fg-secondary mt-1">{(executeMutation.error as Error)?.message}</p>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border-default rounded-[12px]">
                  <Zap className="h-8 w-8 text-fg-secondary mx-auto mb-2 opacity-50" />
                  <p className="text-body font-medium text-fg-secondary">Sin resultado aún</p>
                  <p className="text-caption text-fg-secondary mt-1">Selecciona una herramienta y ejecuta para ver la salida aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Server Details - Main Split Interface */}
      {activeTab === 'details' && <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Servers List (4 columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-caption font-[510] text-fg-secondary uppercase tracking-wider px-1">
            <span>Servidores Registrados</span>
            <span>Activo</span>
          </div>

          <div className="space-y-2.5">
            {servers.map((server) => {
              const isSelected = activeServer?.id === server.id;
              const isPending = server.status === 'pending_validation';
              const isConnected = server.status === 'connected';

              return (
                <div
                  key={server.id}
                  onClick={() => setSelectedServerId(server.id)}
                  className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-border-brand/80 bg-bg-card/90 shadow-md shadow-violet-950/30'
                      : 'border-border-default/80 bg-bg-card/40 hover:bg-bg-card/70 hover:border-border-default'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-2 rounded-[6px] border ${
                          server.transport === 'stdio'
                            ? 'bg-bg-brand-subtle/40 border-border-brand/50 text-fg-brand'
                            : 'bg-bg-success/40 border-fg-success/50 text-fg-success'
                        }`}
                      >
                        {server.transport === 'stdio' ? (
                          <Terminal className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-body font-[510] text-fg-primary truncate max-w-[170px]">
                          {server.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-caption font-mono py-0">
                            {server.transport === 'stdio' ? 'STDIO' : 'HTTP-SSE'}
                          </Badge>
                          <span className="text-caption text-fg-secondary">
                            {server.tools.length} tools
                          </span>
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={server.isActivated}
                      onCheckedChange={(checked) =>
                        toggleActivationMutation.mutate({ id: server.id, active: checked })
                      }
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-caption pt-2 border-t border-border-default/60">
                    <div className="flex items-center gap-1">
                      {isPending ? (
                        <span className="text-fg-warning flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Pendiente validación
                        </span>
                      ) : isConnected && server.isActivated ? (
                        <span className="text-fg-success flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Conectado
                        </span>
                      ) : (
                        <span className="text-fg-secondary flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Desactivado
                        </span>
                      )}
                    </div>

                    <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? 'text-fg-brand' : 'text-fg-muted'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Server Details & Tools Inspector (8 columns) */}
        {activeServer ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Server Header Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-bg-brand-subtle/50 border border-border-brand/50 text-fg-brand">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {activeServer.name}
                        <Badge
                          variant={
                            activeServer.status === 'connected'
                              ? 'success'
                              : activeServer.status === 'pending_validation'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-caption"
                        >
                          {activeServer.status === 'connected'
                            ? 'Conectado'
                            : activeServer.status === 'pending_validation'
                            ? 'Pendiente de Validación'
                            : 'Desconectado'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{activeServer.description}</CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeServer.status === 'pending_validation' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleValidate(activeServer.id)}
                        isLoading={validateMutation.isPending}
                        className="bg-fg-warning hover:bg-amber-500 text-caption"
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Validar Handshake
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(activeServer)}
                      title="Eliminar Servidor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="p-3 rounded-[6px] bg-bg-card/70 border border-border-default text-caption font-mono text-fg-secondary space-y-1.5">
                  <div className="flex items-center justify-between text-caption text-fg-secondary font-sans mb-1">
                    <span>Comando / Endpoint</span>
                    <Badge variant="outline">{activeServer.transport}</Badge>
                  </div>
                  <div className="truncate text-fg-brand font-[510]">{activeServer.commandOrEndpoint}</div>

                  {activeServer.allowedDirectories && (
                    <div className="pt-2 border-t border-border-default/70 text-caption font-sans">
                      <span className="text-fg-secondary flex items-center gap-1 mb-1">
                        <FolderLock className="h-3 w-3 text-fg-success" /> Directorios autorizados:
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-caption">
                        {activeServer.allowedDirectories.map((d) => (
                          <span key={d} className="px-1.5 py-0.5 rounded bg-bg-card border border-border-default">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tools Explorer Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-subtitle flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-fg-warning" />
                    Herramientas Publicadas por este Servidor ({activeServer.tools.length})
                  </CardTitle>
                  <CardDescription>
                    Esquemas de invocación y agentes con permisos asignados
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeServer.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3.5 rounded-[12px] border border-border-default/80 bg-bg-card/60 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-[510] text-fg-primary font-mono">{tool.name}</span>
                        {tool.isWriteOperation ? (
                          <Badge variant="warning" className="text-caption gap-1">
                            <ShieldAlert className="h-3 w-3" /> Operación de Escritura (Humano)
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-caption gap-1">
                            <ShieldCheck className="h-3 w-3" /> Solo Lectura
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-caption h-7"
                        onClick={() => setSelectedToolForAssign(tool)}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Asignar a Agentes ({tool.assignedAgentIds.length})
                      </Button>
                    </div>

                    <p className="text-caption text-fg-secondary leading-relaxed">{tool.description}</p>

                    {/* Input Schema Parameters */}
                    {tool.inputSchema.properties && (
                      <div className="rounded-[6px] bg-bg-card/60 p-2 border border-border-default/70 text-caption">
                        <span className="text-caption font-[510] text-fg-secondary uppercase tracking-wider block mb-1">
                          Parámetros del Input Schema
                        </span>
                        <div className="space-y-1">
                          {Object.entries(tool.inputSchema.properties).map(([pName, pDef]) => (
                            <div key={pName} className="flex items-baseline gap-2 font-mono">
                              <span className="text-fg-brand font-[510]">{pName}:</span>
                              <span className="text-fg-secondary text-caption">{pDef.type}</span>
                              <span className="text-fg-secondary font-sans text-caption truncate">
                                — {pDef.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Server Logs and Diagnostics Drawer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2 text-fg-secondary">
                  <Terminal className="h-4 w-4 text-fg-brand" />
                  Terminal de Logs y Diagnóstico MCP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36 overflow-y-auto p-3 rounded-[6px] bg-black/80 border border-border-default font-mono text-caption space-y-1">
                  {activeServer.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-fg-secondary shrink-0">{formatDate(log.timestamp)}</span>
                      <span
                        className={
                          log.level === 'warn'
                            ? 'text-fg-warning'
                            : log.level === 'error'
                            ? 'text-fg-error'
                            : 'text-fg-success'
                        }
                      >
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-fg-secondary">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 text-center rounded-[12px] border border-dashed border-border-default">
            <Server className="h-10 w-10 text-fg-muted mb-2" />
            <p className="text-body font-medium text-fg-secondary">No hay servidor MCP seleccionado</p>
          </div>
        )}
      </div>}

      {/* Register Server Modal */}
      <RegisterMCPServerModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />

      {/* Assign Tool Modal */}
      <AssignToolModal
        tool={selectedToolForAssign}
        open={!!selectedToolForAssign}
        onClose={() => setSelectedToolForAssign(null)}
      />
    </div>
  );
};

