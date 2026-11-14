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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMCPStore } from '@/stores/mcp.store';
import { RegisterMCPServerModal } from './RegisterMCPServerModal';
import { AssignToolModal } from './AssignToolModal';
import { MCPServer, MCPTool } from '@/types';
import { formatDate } from '@/lib/utils';

export const MCPPage: React.FC = () => {
  const {
    servers,
    selectedServerId,
    setSelectedServerId,
    toggleServerActivation,
    validateServer,
    deleteServer,
  } = useMCPStore();

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedToolForAssign, setSelectedToolForAssign] = useState<MCPTool | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const activeServer = servers.find((s) => s.id === selectedServerId) || servers[0];

  const handleValidate = async (id: string) => {
    setIsValidating(true);
    try {
      await validateServer(id);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDelete = (server: MCPServer) => {
    if (confirm(`¿Eliminar el servidor MCP "${server.name}"?`)) {
      deleteServer(server.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary flex items-center gap-2">
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

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Servers List (4 columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-caption font-semibold text-fg-secondary uppercase tracking-wider px-1">
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
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-border-brand/80 bg-bg-card/90 shadow-md shadow-violet-950/30'
                      : 'border-border-default/80 bg-bg-card/40 hover:bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-2 rounded-lg border ${
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
                        <p className="text-body font-semibold text-fg-primary truncate max-w-[170px]">
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
                      onCheckedChange={() => toggleServerActivation(server.id)}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-brand-subtle/50 border border-border-brand/50 text-fg-brand">
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
                        isLoading={isValidating}
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
                <div className="p-3 rounded-lg bg-bg-card/70 border border-border-default text-caption font-mono text-fg-secondary space-y-1.5">
                  <div className="flex items-center justify-between text-caption text-fg-secondary font-sans mb-1">
                    <span>Comando / Endpoint</span>
                    <Badge variant="outline">{activeServer.transport}</Badge>
                  </div>
                  <div className="truncate text-fg-brand font-semibold">{activeServer.commandOrEndpoint}</div>

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
                    className="p-3.5 rounded-xl border border-border-default/80 bg-bg-card/60 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-semibold text-fg-primary font-mono">{tool.name}</span>
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
                      <div className="rounded-lg bg-bg-card/60 p-2 border border-border-default/70 text-caption">
                        <span className="text-caption font-semibold text-fg-secondary uppercase tracking-wider block mb-1">
                          Parámetros del Input Schema
                        </span>
                        <div className="space-y-1">
                          {Object.entries(tool.inputSchema.properties).map(([pName, pDef]) => (
                            <div key={pName} className="flex items-baseline gap-2 font-mono">
                              <span className="text-fg-brand font-semibold">{pName}:</span>
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
                <div className="h-36 overflow-y-auto p-3 rounded-lg bg-black/80 border border-border-default font-mono text-caption space-y-1">
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
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border-default">
            <Server className="h-10 w-10 text-fg-muted mb-2" />
            <p className="text-body font-medium text-fg-secondary">No hay servidor MCP seleccionado</p>
          </div>
        )}
      </div>

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

