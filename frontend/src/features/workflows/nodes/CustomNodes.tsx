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
  borderColor = 'border-border-hover',
  accentColor = 'text-fg-brand',
  providerId,
  isClaude,
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
  isClaude?: boolean;
}) => {
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-xl border bg-bg-card/95 p-3.5 shadow-xl backdrop-blur-md transition-all ${borderColor} ${
        selected ? 'ring-2 ring-violet-500 shadow-violet-500/20' : ''
      } ${isRunning ? 'ring-2 ring-amber-400 shadow-amber-500/30 animate-pulse' : ''} ${
        isCompleted ? 'border-fg-success/80' : ''
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default">
        <div className="flex items-center gap-2">
          {providerId ? (
            <ProviderLogo
              providerId={providerId}
              size={isClaude ? 'sm' : 'xs'}
              rounded="md"
              className={`shrink-0 transition-transform duration-200 ${selected && isClaude ? 'scale-110' : ''}`}
              active={isClaude ? selected : false}
            />
          ) : (
            <div className={`p-1.5 rounded-md bg-bg-surface/80 ${accentColor}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="text-caption font-semibold text-fg-primary tracking-tight truncate max-w-[120px]">
            {title}
          </span>
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="text-caption py-0 px-1 font-mono">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="text-caption text-fg-secondary">{children}</div>

      {status && (
        <div className="mt-2.5 pt-1.5 border-t border-border-default/60 flex items-center justify-between text-caption">
          <span className="text-fg-secondary">Estado:</span>
          {isRunning && (
            <span className="text-fg-warning flex items-center gap-1 font-mono font-medium">
              <Zap className="h-3 w-3 animate-spin" /> Procesando
            </span>
          )}
          {isCompleted && (
            <span className="text-fg-success flex items-center gap-1 font-mono font-medium">
              <CheckCircle2 className="h-3 w-3" /> Completado
            </span>
          )}
          {status === 'idle' && <span className="text-fg-muted font-mono">Listo</span>}
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
      borderColor="border-fg-success/50"
      accentColor="text-fg-success"
    >
      <p className="text-caption text-fg-secondary">{data?.description || 'Punto de entrada'}</p>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </NodeWrapper>
  );
});

export const AgentNode = memo((props: any) => {
  const { data, selected, dragging } = props;
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  // Listener global de mouseup para asegurar que al soltar el ratón en cualquier lugar se apague el estado
  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsPressed(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);
  
  const isExpanded = data?.isExpanded ?? internalExpanded;
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

  const isClaude = providerId === 'anthropic';
  const isOpenAI = providerId === 'openai';
  const isOllama = providerId === 'ollama';

  // Solo activo si se está manteniendo presionado el ratón o arrastrando
  const isCurrentlyDraggingOrPressed = Boolean(dragging || isPressed);

  // Estado Compacto para Ollama: logo con cuerpo/interior blanco y exterior transparente
  if (isOllama && !isExpanded) {
    return (
      <div
        className="relative group cursor-grab active:cursor-grabbing transition-transform duration-150 transform hover:scale-105 active:scale-95"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setInternalExpanded(true);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsPressed(true);
          }
        }}
        onMouseUp={() => setIsPressed(false)}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
        />

        <div
          className={`p-3 rounded-2xl border-2 bg-bg-card/95 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center gap-1.5 transition-all ${
            isCurrentlyDraggingOrPressed
              ? 'border-blue-500 shadow-blue-500/30 ring-2 ring-blue-500/20'
              : 'border-blue-500/40 hover:border-blue-500 hover:shadow-blue-500/20'
          }`}
        >
          {/* Logo Ollama con cuerpo relleno de blanco y fondo exterior transparente */}
          <div className="w-14 h-14 flex items-center justify-center p-0.5">
            <img
              src="/logos/ollama-filled.png"
              alt="Ollama"
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md transition-transform duration-150"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-blue-300 font-mono tracking-tight px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {data?.label || 'Ollama'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans tracking-wide">
            Doble clic para expandir
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
        />
      </div>
    );
  }

  // Estado Compacto para OpenAI: logo con huecos blancos y fondo exterior transparente
  if (isOpenAI && !isExpanded) {
    return (
      <div
        className="relative group cursor-grab active:cursor-grabbing transition-transform duration-150 transform hover:scale-105 active:scale-95"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setInternalExpanded(true);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsPressed(true);
          }
        }}
        onMouseUp={() => setIsPressed(false)}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900"
        />

        <div
          className={`p-3 rounded-2xl border-2 bg-bg-card/95 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center gap-1.5 transition-all ${
            isCurrentlyDraggingOrPressed
              ? 'border-emerald-500 shadow-emerald-500/30 ring-2 ring-emerald-500/20'
              : 'border-emerald-500/40 hover:border-emerald-500 hover:shadow-emerald-500/20'
          }`}
        >
          {/* Logo OpenAI con huecos rellenos de blanco y exterior transparente */}
          <div className="w-14 h-14 flex items-center justify-center p-1">
            <img
              src="/logos/openai-filled.png"
              alt="OpenAI"
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md transition-transform duration-150"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-emerald-300 font-mono tracking-tight px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {data?.label || 'OpenAI'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans tracking-wide">
            Doble clic para expandir
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900"
        />
      </div>
    );
  }

  // Estado Compacto: se muestra inicialmente o hasta que se hace doble clic
  if (isClaude && !isExpanded) {
    return (
      <div
        className="relative group cursor-grab active:cursor-grabbing transition-transform duration-150 transform hover:scale-105 active:scale-95"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setInternalExpanded(true);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsPressed(true);
          }
        }}
        onMouseUp={() => setIsPressed(false)}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-orange-500 !w-3 !h-3 !border-2 !border-slate-900"
        />

        <div
          className={`p-3 rounded-2xl border-2 bg-bg-card/95 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center gap-1.5 transition-all ${
            isCurrentlyDraggingOrPressed
              ? 'border-orange-500 shadow-orange-500/30 ring-2 ring-orange-500/20'
              : 'border-orange-500/40 hover:border-orange-500 hover:shadow-orange-500/20'
          }`}
        >
          {/* Muestra claude1 (> <) ÚNICAMENTE mientras se mantiene presionado el ratón o se arrastra. Al soltar vuelve inmediatamente a claude2 */}
          <img
            src={isCurrentlyDraggingOrPressed ? '/logos/claude-active.png' : '/logos/claude-base.png'}
            alt="Claude"
            className="w-14 h-14 object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-150"
          />
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-orange-300 font-mono tracking-tight px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
              {data?.label || 'Claude'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans tracking-wide">
            Doble clic para expandir
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!bg-orange-500 !w-3 !h-3 !border-2 !border-slate-900"
        />
      </div>
    );
  }

  // Estado Expandido (abierto al hacer doble clic o para otros agentes)
  return (
    <div
      className="animate-in fade-in zoom-in-95 duration-200"
      onDoubleClick={(e) => {
        if (isClaude) {
          e.stopPropagation();
          setInternalExpanded(false);
        }
      }}
    >
      <NodeWrapper
        selected={selected}
        status={data?.status}
        title={data?.label || 'AI Agent'}
        icon={Bot}
        providerId={providerId}
        isClaude={isClaude}
        badgeText={data?.agentId ? 'Autonomous' : 'Agent'}
        badgeVariant="default"
        borderColor={
          isClaude
            ? 'border-orange-500 ring-2 ring-orange-500/40 shadow-orange-500/30'
            : isOpenAI
            ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-500/30'
            : isOllama
            ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/30'
            : 'border-border-brand/50'
        }
        accentColor={isOpenAI ? 'text-fg-success' : isOllama ? 'text-blue-400' : 'text-fg-brand'}
      >
        <Handle
          type="target"
          position={Position.Left}
          className={`!w-2.5 !h-2.5 ${isOpenAI ? '!bg-emerald-500' : isOllama ? '!bg-blue-500' : '!bg-violet-500'}`}
        />
        <p className="text-caption text-fg-secondary line-clamp-2">{data?.description || 'Ejecuta inferencia con LLM'}</p>
        
        <div className="mt-2 pt-1.5 border-t border-border-default flex items-center justify-between text-caption">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
            isClaude
              ? 'bg-orange-500/15 border-orange-500/40'
              : isOpenAI
              ? 'bg-emerald-500/15 border-emerald-500/40'
              : isOllama
              ? 'bg-blue-500/15 border-blue-500/40'
              : 'bg-bg-card/70 border-border-default'
          }`}>
            <ProviderLogo
              providerId={providerId}
              size="sm"
              showBackground={false}
              active={isCurrentlyDraggingOrPressed}
            />
            <span className={`font-mono capitalize text-caption ${
              isClaude
                ? 'text-orange-400 font-bold'
                : isOpenAI
                ? 'text-emerald-400 font-bold'
                : isOllama
                ? 'text-blue-400 font-bold'
                : 'text-fg-secondary'
            }`}>
              {isClaude ? 'Claude' : isOpenAI ? 'OpenAI' : isOllama ? 'Ollama' : providerId}
            </span>
          </div>
          {data?.agentId && (
            <span className="font-mono text-fg-secondary truncate max-w-[90px]">
              {data.agentId}
            </span>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-2.5 !h-2.5 ${isOpenAI ? '!bg-emerald-500' : isOllama ? '!bg-blue-500' : '!bg-violet-500'}`}
        />
      </NodeWrapper>
    </div>
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
      borderColor="border-fg-warning/50"
      accentColor="text-fg-warning"
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-2.5 !h-2.5" />
      <p className="text-caption text-fg-secondary">{data?.description || 'Llama herramienta contextual'}</p>
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
      borderColor="border-border-brand/50"
      accentColor="text-fg-brand"
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2.5 !h-2.5" />
      <p className="text-caption font-mono text-fg-brand bg-bg-brand-subtle/40 p-1 rounded border border-border-brand/40 truncate">
        {data?.conditionExpr || 'condicion == true'}
      </p>
      <div className="relative mt-2 flex justify-between text-caption text-fg-secondary">
        <span className="text-fg-success font-semibold">True (Aprobado) →</span>
        <span className="text-fg-error font-semibold">False (Rechazado) →</span>
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
      <p className="text-caption text-fg-secondary">{data?.description || 'Dispara ramas simultáneas'}</p>
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
      borderColor="border-fg-warning/70"
      accentColor="text-fg-warning"
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-2.5 !h-2.5" />
      <p className="text-caption text-fg-warning/90 font-medium">{data?.description || 'Requiere confirmación del operador'}</p>
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
      accentColor="text-fg-brand"
    >
      <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-2.5 !h-2.5" />
      <p className="text-caption text-fg-secondary">{data?.description || 'Publicación del resultado'}</p>
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
      accentColor="text-fg-error"
    >
      <Handle type="target" position={Position.Left} className="!bg-rose-500 !w-2.5 !h-2.5" />
      <p className="text-caption text-fg-secondary">{data?.description || 'Fin de ejecución con éxito'}</p>
    </NodeWrapper>
  );
});
