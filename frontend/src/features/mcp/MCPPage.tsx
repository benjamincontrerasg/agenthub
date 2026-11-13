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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            MCP Hub (Model Context Protocol)
            <Badge variant="secondary" className="font-mono text-xs">
              {servers.length} Servidores
            </Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
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
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
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
                      ? 'border-violet-600/80 bg-slate-900/90 shadow-md shadow-violet-950/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-2 rounded-lg border ${
                          server.transport === 'stdio'
                            ? 'bg-blue-950/40 border-blue-800/50 text-blue-400'
                            : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                        }`}
                      >
                        {server.transport === 'stdio' ? (
                          <Terminal className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white truncate max-w-[170px]">
                          {server.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] font-mono py-0">
                            {server.transport === 'stdio' ? 'STDIO' : 'HTTP-SSE'}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
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

                  <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      {isPending ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Pendiente validación
                        </span>
                      ) : isConnected && server.isActivated ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Conectado
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Desactivado
                        </span>
                      )}
                    </div>

                    <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? 'text-violet-400' : 'text-slate-600'}`} />
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-950/50 border border-violet-800/50 text-violet-400">
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
                          className="text-[10px]"
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
                        className="bg-amber-600 hover:bg-amber-500 text-xs"
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
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans mb-1">
                    <span>Comando / Endpoint</span>
                    <Badge variant="outline">{activeServer.transport}</Badge>
                  </div>
                  <div className="truncate text-violet-300 font-semibold">{activeServer.commandOrEndpoint}</div>

                  {activeServer.allowedDirectories && (
                    <div className="pt-2 border-t border-slate-800/70 text-[11px] font-sans">
                      <span className="text-slate-400 flex items-center gap-1 mb-1">
                        <FolderLock className="h-3 w-3 text-emerald-400" /> Directorios autorizados:
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {activeServer.allowedDirectories.map((d) => (
                          <span key={d} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
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
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-400" />
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
                    className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white font-mono">{tool.name}</span>
                        {tool.isWriteOperation ? (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <ShieldAlert className="h-3 w-3" /> Operación de Escritura (Humano)
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px] gap-1">
                            <ShieldCheck className="h-3 w-3" /> Solo Lectura
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setSelectedToolForAssign(tool)}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Asignar a Agentes ({tool.assignedAgentIds.length})
                      </Button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>

                    {/* Input Schema Parameters */}
                    {tool.inputSchema.properties && (
                      <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800/70 text-[11px]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Parámetros del Input Schema
                        </span>
                        <div className="space-y-1">
                          {Object.entries(tool.inputSchema.properties).map(([pName, pDef]) => (
                            <div key={pName} className="flex items-baseline gap-2 font-mono">
                              <span className="text-violet-400 font-semibold">{pName}:</span>
                              <span className="text-slate-400 text-[10px]">{pDef.type}</span>
                              <span className="text-slate-400 font-sans text-[11px] truncate">
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
                <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                  <Terminal className="h-4 w-4 text-violet-400" />
                  Terminal de Logs y Diagnóstico MCP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36 overflow-y-auto p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] space-y-1">
                  {activeServer.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">{formatDate(log.timestamp)}</span>
                      <span
                        className={
                          log.level === 'warn'
                            ? 'text-amber-400'
                            : log.level === 'error'
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }
                      >
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-800">
            <Server className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No hay servidor MCP seleccionado</p>
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

