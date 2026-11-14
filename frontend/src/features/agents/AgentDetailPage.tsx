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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgent, useToggleAgentStatus, useDeleteAgent } from './hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { useExecutionsStore } from '@/stores/executions.store';
import { AgentFormModal } from './AgentFormModal';
import { formatNumber, formatDate } from '@/lib/utils';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id);
  const toggleStatusMutation = useToggleAgentStatus();
  const deleteMutation = useDeleteAgent();
  const { getAllTools } = useMCPStore();
  const { executions } = useExecutionsStore();

  const [editModalOpen, setEditModalOpen] = useState(false);

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
        <h3 className="text-lg font-semibold text-fg-primary">Agente no encontrado</h3>
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
              <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary">
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
            <p className="text-title font-bold text-fg-primary mt-1">{agent.stats.totalRuns}</p>
            <span className="text-caption text-fg-success">Tasa de éxito: {agent.stats.successRate}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Tokens Procesados</span>
            <p className="text-title font-bold text-fg-brand mt-1">{formatNumber(agent.stats.totalTokens)}</p>
            <span className="text-caption text-fg-secondary">Prompt & Output</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Tiempo Medio</span>
            <p className="text-title font-bold text-fg-primary mt-1">{agent.stats.avgDurationSec}s</p>
            <span className="text-caption text-fg-secondary">Por ciclo de tarea</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Modelo Asociado</span>
            <p className="text-body font-bold text-fg-primary mt-1.5 truncate">{agent.modelId}</p>
            <span className="text-caption text-fg-brand font-mono">Temp: {agent.temperature}</span>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Configuration Overview */}
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
            <pre className="p-4 rounded-lg bg-bg-card border border-border-default text-caption font-mono text-fg-secondary leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {agent.systemPrompt}
            </pre>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-caption">
              <div className="p-2.5 rounded-lg bg-bg-card/60 border border-border-default">
                <span className="text-fg-secondary text-caption block">Temperatura</span>
                <span className="font-semibold text-fg-primary font-mono">{agent.temperature}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-card/60 border border-border-default">
                <span className="text-fg-secondary text-caption block">Límite de Iteraciones</span>
                <span className="font-semibold text-fg-primary font-mono">{agent.maxIterations} pasos</span>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-card/60 border border-border-default flex items-center justify-between">
                <div>
                  <span className="text-fg-secondary text-caption block">Proveedor</span>
                  <span className="font-semibold text-fg-primary font-mono capitalize">{agent.providerId}</span>
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
                    className="p-2 rounded-lg bg-bg-card/60 border border-border-default text-caption flex items-center justify-between"
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

      {/* Execution History Table */}
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
                    <tr key={ex.id} className="hover:bg-slate-900/40">
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

      <AgentFormModal
        agent={agent}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
};

