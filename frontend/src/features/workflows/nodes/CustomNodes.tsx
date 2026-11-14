import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  Bot,
  Wrench,
  GitBranch,
  Split,
  ShieldCheck,
  Package,
  Flag,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProviderLogo } from '@/components/shared/ProviderLogo';

// Base wrapper for consistent SaaS styling
const NodeWrapper = ({
  children,
  selected,
  status,
  title,
  icon: Icon,
  badgeText,
  badgeVariant = 'outline',
  borderColor = 'border-slate-700',
  accentColor = 'text-violet-400',
  providerId,
}: {
  children: React.ReactNode;
  selected?: boolean;
  status?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeVariant?: any;
  borderColor?: string;
  accentColor?: string;
  providerId?: string;
}) => {
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all ${borderColor} ${
        selected ? 'ring-2 ring-violet-500 shadow-violet-500/20' : ''
      } ${isRunning ? 'ring-2 ring-amber-400 shadow-amber-500/30 animate-pulse' : ''} ${
        isCompleted ? 'border-emerald-500/80' : ''
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {providerId ? (
            <ProviderLogo providerId={providerId} size="xs" rounded="md" className="shrink-0" />
          ) : (
            <div className={`p-1.5 rounded-md bg-slate-800/80 ${accentColor}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[120px]">
            {title}
          </span>
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="text-[9px] py-0 px-1 font-mono">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="text-xs text-slate-300">{children}</div>

      {status && (
        <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Estado:</span>
          {isRunning && (
            <span className="text-amber-400 flex items-center gap-1 font-mono font-medium">
              <Zap className="h-3 w-3 animate-spin" /> Procesando
            </span>
          )}
          {isCompleted && (
            <span className="text-emerald-400 flex items-center gap-1 font-mono font-medium">
              <CheckCircle2 className="h-3 w-3" /> Completado
            </span>
          )}
          {status === 'idle' && <span className="text-slate-500 font-mono">Listo</span>}
        </div>
      )}
    </div>
  );
};

export const StartNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'Start'}
      icon={Play}
      badgeText="Trigger"
      badgeVariant="success"
      borderColor="border-emerald-600/50"
      accentColor="text-emerald-400"
    >
      <p className="text-[11px] text-slate-400">{data?.description || 'Punto de entrada'}</p>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const AgentNode = memo((props: any) => {
  const { data, selected } = props;
  const label = (data?.label || '').toLowerCase();
  const agentId = (data?.agentId || '').toLowerCase();

  const providerId =
    data?.providerId ||
    (label.includes('architect') || agentId.includes('architect')
      ? 'openai'
      : label.includes('developer') || agentId.includes('developer')
      ? 'anthropic'
      : label.includes('reviewer') || agentId.includes('reviewer')
      ? 'openai'
      : label.includes('research') || agentId.includes('research')
      ? 'gemini'
      : label.includes('coordinator') || agentId.includes('coordinator')
      ? 'anthropic'
      : label.includes('ollama') || agentId.includes('ollama')
      ? 'ollama'
      : 'anthropic');

  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'AI Agent'}
      icon={Bot}
      providerId={providerId}
      badgeText={data?.agentId ? 'Autonomous' : 'Agent'}
      badgeVariant="default"
      borderColor="border-violet-600/50"
      accentColor="text-violet-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-violet-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-slate-300 line-clamp-2">{data?.description || 'Ejecuta inferencia con LLM'}</p>
      
      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">
          <ProviderLogo providerId={providerId} size="xs" showBackground={false} />
          <span className="font-mono text-slate-300 capitalize">{providerId}</span>
        </div>
        {data?.agentId && (
          <span className="font-mono text-slate-400 truncate max-w-[90px]">
            {data.agentId}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-violet-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const MCPToolNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'MCP Tool'}
      icon={Wrench}
      badgeText="MCP"
      badgeVariant="warning"
      borderColor="border-amber-600/50"
      accentColor="text-amber-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-slate-400">{data?.description || 'Llama herramienta contextual'}</p>
      <Handle type="source" position={Position.Right} className="!bg-amber-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const ConditionNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'Condition'}
      icon={GitBranch}
      badgeText="Branch"
      badgeVariant="info"
      borderColor="border-blue-600/50"
      accentColor="text-blue-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] font-mono text-blue-300 bg-blue-950/40 p-1 rounded border border-blue-800/40 truncate">
        {data?.conditionExpr || 'condicion == true'}
      </p>
      <div className="relative mt-2 flex justify-between text-[9px] text-slate-400">
        <span className="text-emerald-400 font-semibold">True (Aprobado) →</span>
        <span className="text-rose-400 font-semibold">False (Rechazado) →</span>
      </div>
      <Handle id="true" type="source" position={Position.Right} style={{ top: '35%' }} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle id="false" type="source" position={Position.Right} style={{ top: '75%' }} className="!bg-rose-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const ParallelNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'Parallel Execution'}
      icon={Split}
      badgeText="Fork"
      borderColor="border-purple-600/50"
      accentColor="text-purple-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-slate-400">{data?.description || 'Dispara ramas simultáneas'}</p>
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const ApprovalNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'Human Approval'}
      icon={ShieldCheck}
      badgeText="Zero-Trust"
      badgeVariant="warning"
      borderColor="border-amber-500/70"
      accentColor="text-amber-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-amber-200/90 font-medium">{data?.description || 'Requiere confirmación del operador'}</p>
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const OutputNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'Output Artifact'}
      icon={Package}
      badgeText="Result"
      badgeVariant="info"
      borderColor="border-cyan-600/50"
      accentColor="text-cyan-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-slate-400">{data?.description || 'Publicación del resultado'}</p>
      <Handle type="source" position={Position.Right} className="!bg-cyan-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const EndNode = memo((props: any) => {
  const { data, selected } = props;
  return (
    <NodeWrapper
      selected={selected}
      status={data?.status}
      title={data?.label || 'End Pipeline'}
      icon={Flag}
      badgeText="Terminal"
      badgeVariant="destructive"
      borderColor="border-rose-600/50"
      accentColor="text-rose-400"
    >
      <Handle type="target" position={Position.Left} className="!bg-rose-500 !w-2.5 !h-2.5" />
      <p className="text-[11px] text-slate-400">{data?.description || 'Fin de ejecución con éxito'}</p>
    </NodeWrapper>
  );
});
