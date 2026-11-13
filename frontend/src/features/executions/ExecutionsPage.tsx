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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useExecutionsStore } from '@/stores/executions.store';
import { formatNumber, formatDuration, formatDate } from '@/lib/utils';
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

  const activeExecution =
    executions.find((e) => e.id === selectedExecutionId) || filtered[0] || executions[0];

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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Execution Center & Telemetría
            <Badge variant="secondary" className="font-mono text-xs">{executions.length} Ejecuciones</Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitorea el ciclo de vida, logs detallados, llamadas a herramientas MCP y consumo de tokens en cada ejecución.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por ID, workflow o agente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {filterOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
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

      {/* Two Column Layout: List (5 cols) + Detailed Timeline View (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executions List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.map((exec) => {
            const isSelected = activeExecution?.id === exec.id;

            return (
              <div
                key={exec.id}
                onClick={() => setSelectedExecutionId(exec.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-violet-600/80 bg-slate-900 shadow-lg shadow-violet-950/20'
                    : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-violet-400">{exec.id}</span>
                  {exec.status === 'completed' && (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Completado
                    </Badge>
                  )}
                  {exec.status === 'running' && (
                    <Badge variant="default" className="text-[10px] gap-1 animate-pulse">
                      <Zap className="h-3 w-3" /> Ejecutando
                    </Badge>
                  )}
                  {exec.status === 'failed' && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <XCircle className="h-3 w-3" /> Fallido
                    </Badge>
                  )}
                  {exec.status === 'waiting_approval' && (
                    <Badge variant="warning" className="text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> Esperando Aprobación
                    </Badge>
                  )}
                </div>

                <p className="mt-1.5 text-xs font-semibold text-white line-clamp-1">
                  {exec.workflowName}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{exec.responsibleAgentName || 'Coordinator'}</span>
                  <span>{formatDuration(exec.durationMs || 0)}</span>
                  <span>{formatNumber(exec.totalTokens)} tok</span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
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
                      <CardTitle className="text-base font-mono text-violet-300">
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
                        className="text-xs h-8"
                        onClick={() => cancelExecution(activeExecution.id)}
                      >
                        Cancelar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleRetry(activeExecution.id)}
                        isLoading={isRetrying}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reintentar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Duración</span>
                    <span className="font-mono text-white font-semibold">
                      {formatDuration(activeExecution.durationMs || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tokens Usados</span>
                    <span className="font-mono text-violet-400 font-semibold">
                      {formatNumber(activeExecution.totalTokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Costo Estimado</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      ${activeExecution.estimatedCostUsd.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Disparado Por</span>
                    <span className="text-slate-200 truncate block">{activeExecution.triggeredBy}</span>
                  </div>
                </div>

                {activeExecution.errorMessage && (
                  <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <strong className="block text-red-300">Error durante la ejecución:</strong>
                      <p className="text-[11px] mt-0.5">{activeExecution.errorMessage}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-400" />
                  Línea Temporal de Eventos (Event Timeline)
                </CardTitle>
                <CardDescription>
                  Pasos secuenciales y transiciones de estado en la ejecución
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2 before:w-[2px] before:bg-slate-800">
                  {activeExecution.steps.map((step, idx) => (
                    <div key={step.id || idx} className="relative">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-slate-950 ${
                          step.status === 'completed'
                            ? 'border-emerald-500'
                            : step.status === 'running'
                            ? 'border-amber-400 animate-ping'
                            : step.status === 'failed'
                            ? 'border-red-500'
                            : 'border-slate-700'
                        }`}
                      />

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{step.name}</span>
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
                            className="text-[9px]"
                          >
                            {step.status}
                          </Badge>
                        </div>

                        {step.agentOrToolName && (
                          <div className="text-[11px] text-violet-400 font-mono">
                            {step.agentOrToolName}
                          </div>
                        )}

                        {step.outputSummary && (
                          <p className="text-[11px] text-slate-300 font-sans mt-1">
                            {step.outputSummary}
                          </p>
                        )}

                        {step.error && (
                          <p className="text-[11px] text-red-400 font-mono mt-1">
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
                <CardTitle className="text-xs flex items-center gap-2 text-slate-300">
                  <Terminal className="h-3.5 w-3.5 text-violet-400" />
                  Registro de Logs de la Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36 overflow-y-auto p-3 rounded-lg bg-black/90 border border-slate-800 font-mono text-[11px] space-y-1">
                  {activeExecution.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-400">{formatDate(log.timestamp)}</span>
                      <span className="text-violet-400">[{log.source}]</span>
                      <span
                        className={
                          log.level === 'warn'
                            ? 'text-amber-400'
                            : log.level === 'error'
                            ? 'text-red-400'
                            : 'text-slate-300'
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
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-800">
            <Activity className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Selecciona una ejecución para ver el detalle</p>
          </div>
        )}
      </div>
    </div>
  );
};
