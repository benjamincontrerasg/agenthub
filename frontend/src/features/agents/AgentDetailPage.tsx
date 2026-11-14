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
import { useAgentsStore } from '@/stores/agents.store';
import { useMCPStore } from '@/stores/mcp.store';
import { useExecutionsStore } from '@/stores/executions.store';
import { AgentFormModal } from './AgentFormModal';
import { formatNumber, formatDate } from '@/lib/utils';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById, toggleAgentStatus, deleteAgent } = useAgentsStore();
  const { getAllTools } = useMCPStore();
  const { executions } = useExecutionsStore();

  const [editModalOpen, setEditModalOpen] = useState(false);

  const agent = getAgentById(id || '');

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Bot className="h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-white">Agente no encontrado</h3>
        <p className="text-sm text-slate-400 mt-1">El agente solicitado no existe o fue eliminado.</p>
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
      deleteAgent(agent.id);
      navigate('/agents');
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
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {agent.name}
              </h2>
              <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                {agent.status === 'active' ? 'Activo' : 'En pausa'}
              </Badge>
              <Badge variant="outline">{agent.role}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{agent.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAgentStatus(agent.id)}
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
            <span className="text-xs text-slate-400">Total de Ejecuciones</span>
            <p className="text-2xl font-bold text-white mt-1">{agent.stats.totalRuns}</p>
            <span className="text-[10px] text-emerald-400">Tasa de éxito: {agent.stats.successRate}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-400">Tokens Procesados</span>
            <p className="text-2xl font-bold text-violet-400 mt-1">{formatNumber(agent.stats.totalTokens)}</p>
            <span className="text-[10px] text-slate-400">Prompt & Output</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-400">Tiempo Medio</span>
            <p className="text-2xl font-bold text-white mt-1">{agent.stats.avgDurationSec}s</p>
            <span className="text-[10px] text-slate-400">Por ciclo de tarea</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-400">Modelo Asociado</span>
            <p className="text-sm font-bold text-white mt-1.5 truncate">{agent.modelId}</p>
            <span className="text-[10px] text-blue-400 font-mono">Temp: {agent.temperature}</span>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Configuration Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Prompt & Instructions (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-violet-400" />
              System Prompt & Instrucciones de Rol
            </CardTitle>
            <CardDescription>
              Directrices de contexto aplicadas en cada iteración del modelo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {agent.systemPrompt}
            </pre>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Temperatura</span>
                <span className="font-semibold text-white font-mono">{agent.temperature}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Límite de Iteraciones</span>
                <span className="font-semibold text-white font-mono">{agent.maxIterations} pasos</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block">Proveedor</span>
                  <span className="font-semibold text-white font-mono capitalize">{agent.providerId}</span>
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
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                Herramientas MCP ({assignedTools.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignedTools.length > 0 ? (
                assignedTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{tool.name}</p>
                      <p className="text-[10px] text-slate-400">{tool.serverName}</p>
                    </div>
                    {tool.isWriteOperation && (
                      <Badge variant="warning" className="text-[9px] py-0 px-1">
                        Escritura
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Sin herramientas MCP asignadas.</p>
              )}
            </CardContent>
          </Card>

          {/* Peer Communication Network */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Red de Delegación ({agent.allowedAgentCommunicationIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {agent.allowedAgentCommunicationIds.map((peerId) => (
                  <Badge key={peerId} variant="outline" className="text-xs font-mono">
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
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-400" />
            Historial de Ejecuciones de {agent.name}
          </CardTitle>
          <CardDescription>
            Registros de tareas donde participó activamente este agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentExecutions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-medium">
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
                      <td className="py-2.5 pl-2 font-mono text-violet-400">{ex.id}</td>
                      <td className="py-2.5 text-slate-200">{ex.workflowName}</td>
                      <td className="py-2.5">
                        <Badge variant={ex.status === 'completed' ? 'success' : 'secondary'}>
                          {ex.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">{formatNumber(ex.totalTokens)}</td>
                      <td className="py-2.5 text-slate-400">{formatDate(ex.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">No hay ejecuciones registradas todavía.</p>
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

