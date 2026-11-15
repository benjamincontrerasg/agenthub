import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  Settings,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Shield,
  Layers,
  Wrench,
  Terminal,
  Database,
  Plus,
  Search,
  Download,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgent, useToggleAgentStatus, useDeleteAgent, useAgentMemories, useAddAgentMemory, useDeleteAgentMemory, useCreateAgent } from './hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { useExecutionsStore } from '@/stores/executions.store';
import { AgentFormModal } from './AgentFormModal';
import { formatNumber, formatDate } from '@/lib/utils';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { toast } from '@/stores/toast.store';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id);
  const toggleStatusMutation = useToggleAgentStatus();
  const deleteMutation = useDeleteAgent();
  const createAgentMutation = useCreateAgent();
  const { getAllTools } = useMCPStore();
  const { executions } = useExecutionsStore();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'history'>('overview');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('general');
  const [searchMemoryQuery, setSearchMemoryQuery] = useState('');

  const { data: memories = [], isLoading: memoriesLoading } = useAgentMemories(id);
  const addMemoryMutation = useAddAgentMemory(id);
  const deleteMemoryMutation = useDeleteAgentMemory(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Bot className="h-10 w-10 text-fg-brand animate-pulse mb-3" />
        <p className="text-body text-fg-secondary">Cargando detalles del agente...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Bot className="h-12 w-12 text-fg-muted mb-4" />
        <h3 className="text-lg font-[510] text-fg-primary">Agente no encontrado</h3>
        <p className="text-body text-fg-secondary mt-1">El agente solicitado no existe o fue eliminado.</p>
        <Button variant="default" size="sm" onClick={() => navigate('/agents')} className="mt-4">
          Volver a Agentes
        </Button>
      </div>
    );
  }

  const allTools = getAllTools();
  const assignedTools = allTools.filter((t) => agent.allowedToolIds.includes(t.id));
  const agentExecutions = executions.filter(
    (e) => e.responsibleAgentId === agent.id || e.steps.some((s) => s.agentOrToolName === agent.name)
  );

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar al agente "${agent.name}"?`)) {
      deleteMutation.mutate(agent.id, {
        onSuccess: () => navigate('/agents'),
      });
    }
  };

  const handleExportAgent = () => {
    const exportData = {
      _exportVersion: '1.0',
      _exportedAt: new Date().toISOString(),
      _platform: 'NEXORA',
      name: agent.name,
      description: agent.description,
      role: agent.role,
      providerId: agent.providerId,
      modelId: agent.modelId,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxIterations: agent.maxIterations,
      allowedToolIds: agent.allowedToolIds,
      allowedAgentCommunicationIds: agent.allowedAgentCommunicationIds,
      status: agent.status,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Agente Exportado', `Configuración de "${agent.name}" exportada como JSON.`);
  };

  const handleImportAgent = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (!imported.name || !imported.systemPrompt) {
            toast.error('Formato Inválido', 'El archivo JSON no contiene un agente válido.');
            return;
          }
          createAgentMutation.mutate({
            name: imported.name + ' (Importado)',
            description: imported.description || '',
            role: imported.role || 'Developer',
            providerId: imported.providerId || 'anthropic',
            modelId: imported.modelId || 'claude-sonnet-4-20250514',
            systemPrompt: imported.systemPrompt,
            temperature: imported.temperature ?? 0.7,
            maxIterations: imported.maxIterations ?? 10,
            allowedToolIds: imported.allowedToolIds || [],
            allowedAgentCommunicationIds: imported.allowedAgentCommunicationIds || [],
            status: 'paused' as const,
          }, {
            onSuccess: (created) => {
              toast.success('Agente Importado', `"${created.name}" creado desde archivo JSON.`);
              navigate(`/agents/${created.id}`);
            },
          });
        } catch {
          toast.error('Error de Importación', 'El archivo no contiene JSON válido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/agents')}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <AgentAvatar
            agentName={agent.name}
            role={agent.role}
            providerId={agent.providerId}
            size="md"
            status={agent.status}
          />

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-title sm:text-2xl font-[510] tracking-tight text-fg-primary">
                {agent.name}
              </h2>
              <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                {agent.status === 'active' ? 'Activo' : 'En pausa'}
              </Badge>
              <Badge variant="outline">{agent.role}</Badge>
            </div>
            <p className="text-caption text-fg-secondary mt-0.5">{agent.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatusMutation.mutate({ id: agent.id, currentStatus: agent.status })}
          >
            {agent.status === 'active' ? (
              <>
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Activar
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Editar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAgent}
            title="Exportar configuración como JSON"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportAgent}
            title="Importar agente desde JSON"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Importar
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Probar en Chat
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9"
            onClick={handleDelete}
            title="Eliminar Agente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Total de Ejecuciones</span>
            <p className="text-title font-[510] text-fg-primary mt-1">{agent.stats.totalRuns}</p>
            <span className="text-caption text-fg-success">Tasa de éxito: {agent.stats.successRate}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Tokens Procesados</span>
            <p className="text-title font-[510] text-fg-brand mt-1">{formatNumber(agent.stats.totalTokens)}</p>
            <span className="text-caption text-fg-secondary">Prompt & Output</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Tiempo Medio</span>
            <p className="text-title font-[510] text-fg-primary mt-1">{agent.stats.avgDurationSec}s</p>
            <span className="text-caption text-fg-secondary">Por ciclo de tarea</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Modelo Asociado</span>
            <p className="text-body font-[510] text-fg-primary mt-1.5 truncate">{agent.modelId}</p>
            <span className="text-caption text-fg-brand font-mono">Temp: {agent.temperature}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-default space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-caption font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-border-brand text-fg-brand font-[510]'
              : 'border-transparent text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Configuración & Herramientas</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`flex items-center gap-2 px-4 py-2 text-caption font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'memory'
              ? 'border-border-brand text-fg-brand font-[510]'
              : 'border-transparent text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Memoria Semántica & RAG</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
            {memories.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-caption font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-border-brand text-fg-brand font-[510]'
              : 'border-transparent text-fg-secondary hover:text-fg-primary'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Historial de Tareas</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
            {agentExecutions.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Detailed Configuration Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Prompt & Instructions (2 columns) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-subtitle flex items-center gap-2">
                <Terminal className="h-4 w-4 text-fg-brand" />
                System Prompt & Instrucciones de Rol
              </CardTitle>
              <CardDescription>
                Directrices de contexto aplicadas en cada iteración del modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-[6px] bg-bg-card border border-border-default text-caption font-mono text-fg-secondary leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {agent.systemPrompt}
              </pre>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-caption">
                <div className="p-2.5 rounded-[6px] bg-bg-card/60 border border-border-default">
                  <span className="text-fg-secondary text-caption block">Temperatura</span>
                  <span className="font-[510] text-fg-primary font-mono">{agent.temperature}</span>
                </div>
                <div className="p-2.5 rounded-[6px] bg-bg-card/60 border border-border-default">
                  <span className="text-fg-secondary text-caption block">Límite de Iteraciones</span>
                  <span className="font-[510] text-fg-primary font-mono">{agent.maxIterations} pasos</span>
                </div>
                <div className="p-2.5 rounded-[6px] bg-bg-card/60 border border-border-default flex items-center justify-between">
                  <div>
                    <span className="text-fg-secondary text-caption block">Proveedor</span>
                    <span className="font-[510] text-fg-primary font-mono capitalize">{agent.providerId}</span>
                  </div>
                  <ProviderLogo providerId={agent.providerId} size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools and Delegation Network */}
          <div className="space-y-6">
            {/* MCP Tools Assigned */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-fg-warning" />
                  Herramientas MCP ({assignedTools.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedTools.length > 0 ? (
                  assignedTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-2 rounded-[6px] bg-bg-card/60 border border-border-default text-caption flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-fg-primary">{tool.name}</p>
                        <p className="text-caption text-fg-secondary">{tool.serverName}</p>
                      </div>
                      {tool.isWriteOperation && (
                        <Badge variant="warning" className="text-caption py-0 px-1">
                          Escritura
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-fg-secondary">Sin herramientas MCP asignadas.</p>
                )}
              </CardContent>
            </Card>

            {/* Peer Communication Network */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2">
                  <Layers className="h-4 w-4 text-fg-brand" />
                  Red de Delegación ({agent.allowedAgentCommunicationIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {agent.allowedAgentCommunicationIds.map((peerId) => (
                    <Badge key={peerId} variant="outline" className="text-caption font-mono">
                      {peerId}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Semantic Memory & RAG */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <Card className="border-border-brand/30 bg-gradient-to-r from-bg-brand-subtle/30 to-bg-card">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-fg-brand" />
                  <h3 className="text-subtitle font-[510] text-fg-primary">Memoria Semántica & Contexto Vectorial</h3>
                </div>
                <p className="text-caption text-fg-secondary mt-1">
                  Embeddings de 1536 dimensiones recuperados mediante ranking de similitud coseno (RAG en tiempo real).
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-caption text-fg-brand border-border-brand/60">
                pgvector 1536-dim
              </Badge>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Memory Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Plus className="h-4 w-4 text-fg-brand" />
                  Indexar Nuevo Recuerdo
                </CardTitle>
                <CardDescription>
                  Inyecta conocimiento semántico permanente en este agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newMemoryContent.trim()) return;
                    addMemoryMutation.mutate(
                      { content: newMemoryContent, metadata: { category: newMemoryCategory } },
                      {
                        onSuccess: () => {
                          setNewMemoryContent('');
                        },
                      }
                    );
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">
                      Categoría
                    </label>
                    <select
                      value={newMemoryCategory}
                      onChange={(e) => setNewMemoryCategory(e.target.value)}
                      className="w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-1.5 text-caption text-fg-primary focus:border-border-brand focus:outline-none"
                    >
                      <option value="general">General</option>
                      <option value="architecture">Arquitectura & DB</option>
                      <option value="rules">Reglas de Negocio</option>
                      <option value="preferences">Preferencias del Usuario</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">
                      Contenido Semántico
                    </label>
                    <textarea
                      value={newMemoryContent}
                      onChange={(e) => setNewMemoryContent(e.target.value)}
                      rows={4}
                      placeholder="Ej: Toda consulta a producción debe pasar por el Security Gate humano..."
                      className="w-full rounded-[6px] border border-border-default bg-bg-surface p-3 text-caption text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-[#62666d]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={addMemoryMutation.isPending || !newMemoryContent.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {addMemoryMutation.isPending ? 'Indexando...' : 'Indexar en Vector Store'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Memories List & Search Sandbox */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-subtitle flex items-center gap-2">
                      <Search className="h-4 w-4 text-fg-brand" />
                      Recuerdos Almacenados ({memories.length})
                    </CardTitle>
                    <CardDescription>
                      Probador de similitud semántica y gestión de memoria
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-secondary" />
                    <input
                      type="text"
                      placeholder="Filtrar o buscar recuerdos..."
                      value={searchMemoryQuery}
                      onChange={(e) => setSearchMemoryQuery(e.target.value)}
                      className="w-full rounded-[6px] border border-border-default bg-bg-surface pl-8 pr-3 py-1 text-caption text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-[#62666d]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {memoriesLoading ? (
                  <p className="text-caption text-fg-secondary py-6 text-center">Cargando memoria semántica...</p>
                ) : memories.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border-default rounded-[12px]">
                    <Database className="h-8 w-8 text-fg-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-caption text-fg-secondary">Este agente no tiene recuerdos en su memoria vectorial.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memories
                      .filter((m) =>
                        searchMemoryQuery
                          ? m.content.toLowerCase().includes(searchMemoryQuery.toLowerCase()) ||
                            (m.metadata?.category || '').toLowerCase().includes(searchMemoryQuery.toLowerCase())
                          : true
                      )
                      .map((mem) => (
                        <div
                          key={mem.id}
                          className="p-3.5 rounded-[12px] border border-border-default bg-bg-card/80 hover:border-border-default transition-colors flex items-start justify-between gap-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-[10px] font-mono capitalize">
                                {mem.metadata?.category || 'General'}
                              </Badge>
                              <span className="text-[11px] text-fg-secondary font-mono">{formatDate(mem.createdAt)}</span>
                              {mem.similarity !== undefined && (
                                <Badge variant="success" className="text-[10px]">
                                  Similitud: {(mem.similarity * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-caption text-fg-primary leading-relaxed">{mem.content}</p>
                          </div>
                          <button
                            onClick={() => deleteMemoryMutation.mutate(mem.id)}
                            disabled={deleteMemoryMutation.isPending}
                            className="p-1.5 rounded-[6px] text-fg-secondary hover:text-fg-error hover:bg-bg-error-subtle transition-colors cursor-pointer"
                            title="Eliminar Recuerdo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Execution History Table */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <Clock className="h-4 w-4 text-fg-brand" />
              Historial de Ejecuciones de {agent.name}
            </CardTitle>
            <CardDescription>
              Registros de tareas donde participó activamente este agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentExecutions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-caption">
                  <thead className="border-b border-border-default text-fg-secondary font-medium">
                    <tr>
                      <th className="pb-3 pl-2">ID Ejecución</th>
                      <th className="pb-3">Workflow</th>
                      <th className="pb-3">Estado</th>
                      <th className="pb-3">Tokens</th>
                      <th className="pb-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {agentExecutions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-bg-card/40">
                        <td className="py-2.5 pl-2 font-mono text-fg-brand">{ex.id}</td>
                        <td className="py-2.5 text-fg-primary">{ex.workflowName}</td>
                        <td className="py-2.5">
                          <Badge variant={ex.status === 'completed' ? 'success' : 'secondary'}>
                            {ex.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 font-mono text-fg-secondary">{formatNumber(ex.totalTokens)}</td>
                        <td className="py-2.5 text-fg-secondary">{formatDate(ex.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-caption text-fg-secondary py-3">No hay ejecuciones registradas todavía.</p>
            )}
          </CardContent>
        </Card>
      )}

      <AgentFormModal
        agent={agent}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
};

