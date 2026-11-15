import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Zap,
  Terminal,
  AlertTriangle,
  Wrench,
  Bot,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  Play,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useExecutionsStore } from '@/stores/executions.store';
import { formatNumber, formatDuration, formatDate } from '@/lib/utils';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { WorkflowExecution } from '@/types';

export const ExecutionsPage: React.FC = () => {
  const {
    executions,
    selectedExecutionId,
    setSelectedExecutionId,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    cancelExecution,
    retryExecution,
  } = useExecutionsStore();

  const [isRetrying, setIsRetrying] = useState(false);

  const filterOptions = ['ALL', 'completed', 'running', 'failed', 'waiting_approval'];

  const filtered = executions.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesSearch =
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.responsibleAgentName && e.responsibleAgentName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const activeExecution = selectedExecutionId
    ? executions.find((e) => e.id === selectedExecutionId) || null
    : null;

  const handleRetry = async (id: string) => {
    setIsRetrying(true);
    try {
      await retryExecution(id);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-[510] tracking-tight text-fg-primary flex items-center gap-2">
            Execution Center & Telemetría
            <Badge variant="secondary" className="font-mono text-caption">{executions.length} Ejecuciones</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Monitorea el ciclo de vida, logs detallados, llamadas a herramientas MCP y consumo de tokens en cada ejecución.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-fg-secondary" />
          <Input
            placeholder="Buscar por ID, workflow o agente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-caption"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {filterOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-[6px] text-caption font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-bg-brand text-fg-primary shadow-sm'
                  : 'bg-bg-card/80 text-fg-secondary hover:bg-[#161718] hover:text-[#d0d6e0] border border-border-default'
              }`}
            >
              {st === 'ALL'
                ? 'Todos'
                : st === 'completed'
                ? 'Completados'
                : st === 'running'
                ? 'Ejecutando'
                : st === 'failed'
                ? 'Fallidos'
                : 'Pendiente Aprobación'}
            </button>
          ))}
        </div>
      </div>

      {/* Layout: Full width List OR Two Columns with Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executions List */}
        <div className={`${activeExecution ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-2.5 transition-all`}>
          {filtered.map((exec) => {
            const isSelected = activeExecution?.id === exec.id;

            return (
              <div
                key={exec.id}
                onClick={() => setSelectedExecutionId(exec.id)}
                className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-border-brand/80 bg-bg-card shadow-lg shadow-violet-950/20'
                    : 'border-border-default/80 bg-bg-card/40 hover:bg-[#0f1011]/70 hover:border-[#23252a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption font-[510] text-fg-brand">{exec.id}</span>
                  {exec.status === 'completed' && (
                    <Badge variant="success" className="text-caption gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Completado
                    </Badge>
                  )}
                  {exec.status === 'running' && (
                    <Badge variant="default" className="text-caption gap-1 animate-pulse">
                      <Zap className="h-3 w-3" /> Ejecutando
                    </Badge>
                  )}
                  {exec.status === 'failed' && (
                    <Badge variant="destructive" className="text-caption gap-1">
                      <XCircle className="h-3 w-3" /> Fallido
                    </Badge>
                  )}
                  {exec.status === 'waiting_approval' && (
                    <Badge variant="warning" className="text-caption gap-1">
                      <AlertTriangle className="h-3 w-3" /> Esperando Aprobación
                    </Badge>
                  )}
                </div>

                <p className="mt-1.5 text-caption font-[510] text-fg-primary line-clamp-1">
                  {exec.workflowName}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-caption text-fg-secondary font-mono">
                  <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <AgentAvatar agentName={exec.responsibleAgentName || 'Coordinator'} size="xs" />
                    <span className="truncate">{exec.responsibleAgentName || 'Coordinator'}</span>
                  </div>
                  <span>{formatDuration(exec.durationMs || 0)}</span>
                  <span>{formatNumber(exec.totalTokens)} tok</span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center rounded-[12px] border border-dashed border-border-default text-caption text-fg-secondary">
              No se encontraron ejecuciones con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Detailed Timeline View & Event Trace */}
        {activeExecution ? (
          <div className="lg:col-span-7 space-y-5">
            {/* Execution Overview Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-subtitle font-mono text-fg-brand">
                        {activeExecution.id}
                      </CardTitle>
                      <Badge variant="outline">{activeExecution.status}</Badge>
                    </div>
                    <CardDescription className="mt-0.5">{activeExecution.workflowName}</CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeExecution.status === 'running' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-caption h-8"
                        onClick={() => cancelExecution(activeExecution.id)}
                      >
                        Cancelar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-caption h-8"
                        onClick={() => handleRetry(activeExecution.id)}
                        isLoading={isRetrying}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reintentar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-fg-muted hover:text-fg-primary"
                      onClick={() => setSelectedExecutionId(null)}
                      title="Cerrar panel lateral"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-[6px] bg-bg-card/70 border border-border-default text-caption">
                  <div>
                    <span className="text-fg-secondary text-caption block">Duración</span>
                    <span className="font-mono text-fg-primary font-[510]">
                      {formatDuration(activeExecution.durationMs || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-secondary text-caption block">Tokens Usados</span>
                    <span className="font-mono text-fg-brand font-[510]">
                      {formatNumber(activeExecution.totalTokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-secondary text-caption block">Costo Estimado</span>
                    <span className="font-mono text-fg-success font-[510]">
                      ${activeExecution.estimatedCostUsd.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-secondary text-caption block">Disparado Por</span>
                    <span className="text-fg-primary truncate block">{activeExecution.triggeredBy}</span>
                  </div>
                </div>

                {activeExecution.errorMessage && (
                  <div className="mt-3 p-3 rounded-[6px] bg-bg-error/40 border border-fg-error text-caption text-fg-error flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-fg-error mt-0.5" />
                    <div>
                      <strong className="block text-fg-error">Error durante la ejecución:</strong>
                      <p className="text-caption mt-0.5">{activeExecution.errorMessage}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2">
                  <Clock className="h-4 w-4 text-fg-brand" />
                  Línea Temporal de Eventos (Event Timeline)
                </CardTitle>
                <CardDescription>
                  Pasos secuenciales y transiciones de estado en la ejecución
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2 before:w-[2px] before:bg-[#161718]">
                  {activeExecution.steps.map((step, idx) => (
                    <div key={step.id || idx} className="relative">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-bg-card ${
                          step.status === 'completed'
                            ? 'border-fg-success'
                            : step.status === 'running'
                            ? 'border-fg-warning animate-ping'
                            : step.status === 'failed'
                            ? 'border-fg-error'
                            : 'border-border-hover'
                        }`}
                      />

                      <div className="p-3 rounded-[6px] bg-bg-card/60 border border-border-default space-y-1 text-caption">
                        <div className="flex items-center justify-between">
                          <span className="font-[510] text-fg-primary">{step.name}</span>
                          <Badge
                            variant={
                              step.status === 'completed'
                                ? 'success'
                                : step.status === 'running'
                                ? 'warning'
                                : step.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-caption"
                          >
                            {step.status}
                          </Badge>
                        </div>

                        {step.agentOrToolName && (
                          <div className="text-caption text-fg-brand font-mono flex items-center gap-1.5">
                            <AgentAvatar agentName={step.agentOrToolName} size="xs" />
                            <span>{step.agentOrToolName}</span>
                          </div>
                        )}

                        {step.outputSummary && (
                          <p className="text-caption text-fg-secondary font-sans mt-1">
                            {step.outputSummary}
                          </p>
                        )}

                        {step.error && (
                          <p className="text-caption text-fg-error font-mono mt-1">
                            {step.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Execution Raw Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-caption flex items-center gap-2 text-fg-secondary">
                  <Terminal className="h-3.5 w-3.5 text-fg-brand" />
                  Registro de Logs de la Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36 overflow-y-auto p-3 rounded-[6px] bg-black/90 border border-border-default font-mono text-caption space-y-1">
                  {activeExecution.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-fg-secondary">{formatDate(log.timestamp)}</span>
                      <span className="text-fg-brand">[{log.source}]</span>
                      <span
                        className={
                          log.level === 'warn'
                            ? 'text-fg-warning'
                            : log.level === 'error'
                            ? 'text-fg-error'
                            : 'text-fg-secondary'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-12 text-center rounded-[12px] border border-dashed border-border-default">
            <Activity className="h-10 w-10 text-fg-muted mb-2" />
            <p className="text-body font-medium text-fg-secondary">Selecciona una ejecución para ver el detalle</p>
          </div>
        )}
      </div>
    </div>
  );
};

