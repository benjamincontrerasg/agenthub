import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Zap,
  CheckCircle2,
  XCircle,
  Plus,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chat.store';
import { useAgentsStore } from '@/stores/agents.store';
import { formatDate } from '@/lib/utils';
import { Message, Approval } from '@/types';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';

export const ChatPage: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    getActiveConversation,
    createConversation,
    sendMessage,
    respondToApproval,
    pauseSimulation,
    resumeSimulation,
    cancelSimulation,
    isSimulating,
    isPaused,
    activeAgentTypingId,
  } = useChatStore();

  const { agents } = useAgentsStore();
  const activeConv = getActiveConversation();

  const [inputContent, setInputContent] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([
    'agent-coordinator',
    'agent-architect',
    'agent-developer',
    'agent-reviewer',
  ]);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages.length, activeAgentTypingId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || isSimulating) return;
    const text = inputContent;
    setInputContent('');
    await sendMessage(text);
  };

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;
    createConversation(newChatTitle, selectedAgents);
    setNewChatTitle('');
    setNewChatModalOpen(false);
  };

  const activeTypingAgent = agents.find((a) => a.id === activeAgentTypingId);
  const activePendingApproval = activeConv?.messages.find(
    (m) => m.approvalRequest && m.approvalRequest.status === 'pending'
  )?.approvalRequest;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto overflow-hidden">
      {/* Left Column: Conversations and Participants (4 columns) */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
        {/* Sessions list */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border-default">
            <div>
              <CardTitle className="text-body font-semibold text-fg-primary">Sesiones de Chat</CardTitle>
              <CardDescription className="text-caption">Salas multiagente</CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-caption px-2"
              onClick={() => setNewChatModalOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" /> Nuevo
            </Button>
          </CardHeader>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={`p-2.5 rounded-lg text-caption cursor-pointer transition-colors ${
                  activeConversationId === c.id
                    ? 'bg-bg-brand-subtle/40 border border-border-brand/60 text-fg-primary'
                    : 'text-fg-secondary hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate max-w-[170px]">{c.title}</span>
                  <span className="text-caption text-fg-secondary font-mono">
                    {c.participantAgentIds.length} ags
                  </span>
                </div>
                <p className="text-caption text-fg-secondary mt-0.5 truncate">
                  {c.messages[c.messages.length - 1]?.content || 'Sin mensajes'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Participating Agents in Active Session */}
        {activeConv && (
          <Card className="h-64 shrink-0 flex flex-col overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-border-default">
              <CardTitle className="text-caption font-semibold text-fg-secondary flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-fg-brand" />
                Agentes Participantes ({activeConv.participantAgentIds.length})
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-caption">
              {activeConv.participantAgentIds.map((agId) => {
                const ag = agents.find((a) => a.id === agId);
                const isCurrentActive = activeConv.activeAgentId === agId;
                const isTyping = activeAgentTypingId === agId;

                return (
                  <div
                    key={agId}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isTyping
                        ? 'bg-bg-warning/30 border-fg-warning/60 text-fg-warning animate-pulse'
                        : isCurrentActive
                        ? 'bg-bg-card border-border-brand/60 text-fg-primary'
                        : 'bg-bg-card/40 border-border-default/60 text-fg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AgentAvatar
                        agentName={ag?.name}
                        role={ag?.role}
                        providerId={ag?.providerId}
                        size="xs"
                        status={isTyping ? 'running' : isCurrentActive ? 'active' : 'idle'}
                      />
                      <div className="truncate">
                        <p className="font-medium truncate text-caption">{ag?.name || agId}</p>
                        <p className="text-caption text-fg-secondary font-mono">{ag?.role || 'Agent'}</p>
                      </div>
                    </div>

                    {isTyping ? (
                      <span className="text-caption font-mono text-fg-warning flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 animate-spin" /> Pensando
                      </span>
                    ) : (
                      <span className="text-caption font-mono text-fg-secondary">Listo</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Chat Room & Simulation Stream */}
      <div className="flex-1 flex flex-col rounded-2xl border border-border-default bg-bg-card overflow-hidden shadow-2xl">
        {/* Chat Room Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-default bg-bg-card/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-fg-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-body font-bold text-fg-primary flex items-center gap-2">
                {activeConv?.title || 'Sala de Chat'}
                <Badge variant="outline" className="text-caption">
                  {activeConv?.status || 'idle'}
                </Badge>
              </h3>
              <p className="text-caption text-fg-secondary">
                Orquestador multiagente colaborativo con trazabilidad de delegaciones
              </p>
            </div>
          </div>

          {/* Simulation Controls: Pause, Resume, Cancel */}
          <div className="flex items-center space-x-2">
            {isSimulating && (
              <>
                {!isPaused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-caption h-7"
                    onClick={pauseSimulation}
                  >
                    <Pause className="mr-1 h-3 w-3" /> Pausar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-caption h-7 text-fg-success"
                    onClick={resumeSimulation}
                  >
                    <Play className="mr-1 h-3 w-3" /> Continuar
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="text-caption h-7"
                  onClick={cancelSimulation}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Delegation Breadcrumb Banner */}
        {activeConv?.currentDelegationPath && (
          <div className="px-5 py-2 bg-bg-card/40 border-b border-border-default/80 flex items-center gap-1.5 overflow-x-auto text-caption text-fg-secondary">
            <span className="font-semibold text-fg-secondary shrink-0">Cadena de Delegación:</span>
            {activeConv.currentDelegationPath.map((agentName, idx) => (
              <React.Fragment key={idx}>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-caption shrink-0 ${
                    idx === activeConv.currentDelegationPath!.length - 1
                      ? 'bg-bg-brand-subtle text-fg-brand font-semibold border border-border-brand'
                      : 'bg-bg-card text-fg-secondary border border-border-default'
                  }`}
                >
                  <ProviderLogo providerId={agentName} size="xs" showBackground={false} />
                  <span>{agentName}</span>
                </span>
                {idx < activeConv.currentDelegationPath!.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-fg-muted shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Zero-Trust Active Approval Spotlight Banner */}
        {activePendingApproval && (
          <div className="mx-4 mt-3 p-3.5 rounded-xl border-2 border-fg-warning bg-bg-warning/20 shadow-md shadow-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-fg-warning/20 text-fg-warning shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-caption font-bold text-fg-warning uppercase tracking-wider">
                    Acción en Espera de Autorización Humana
                  </span>
                  <Badge variant="warning" className="text-caption font-mono py-0">
                    {activePendingApproval.id}
                  </Badge>
                </div>
                <p className="text-body font-semibold text-fg-primary mt-0.5">
                  {activePendingApproval.actionDescription}
                </p>
                <p className="text-caption text-fg-secondary font-mono mt-0.5">
                  Agente: <strong className="text-fg-primary">{activePendingApproval.agentName}</strong> · Herramienta: <strong className="text-fg-brand">{activePendingApproval.toolName}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                className="bg-fg-success hover:bg-emerald-500 text-slate-950 font-bold px-3.5 h-8 shadow-sm"
                onClick={() => respondToApproval(activePendingApproval.id, true)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Aprobar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3.5"
                onClick={() => respondToApproval(activePendingApproval.id, false)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Rechazar
              </Button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeConv?.messages.map((msg) => {
            const isUser = msg.senderType === 'user';
            const isSystem = msg.senderType === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="rounded-lg bg-bg-card/80 px-3 py-1.5 border border-border-default text-caption text-fg-secondary flex items-center gap-1.5 max-w-lg text-center">
                    <Sparkles className="h-3.5 w-3.5 text-fg-brand shrink-0" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-2 text-caption">
                  {!isUser ? (
                    <AgentAvatar
                      agentName={msg.senderName}
                      role={msg.senderRole}
                      size="xs"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-brand text-caption font-bold text-fg-primary shadow">
                      TÚ
                    </div>
                  )}
                  <span className="font-semibold text-fg-primary">{msg.senderName}</span>
                  {msg.senderRole && (
                    <Badge variant="outline" className="text-caption font-mono py-0">
                      {msg.senderRole}
                    </Badge>
                  )}
                  <span className="text-caption text-fg-secondary">{formatDate(msg.timestamp)}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-body leading-relaxed max-w-2xl shadow-md ${
                    isUser
                      ? 'bg-bg-brand text-fg-primary rounded-tr-none'
                      : 'bg-bg-card/90 border border-border-default text-fg-primary rounded-tl-none'
                  }`}
                >
                  {/* Thought Trace Inspector */}
                  {msg.thoughtTrace && (
                    <div className="mb-2.5 rounded-lg bg-bg-card/70 p-2.5 border border-border-default/90 text-caption text-fg-secondary space-y-1">
                      <div className="flex items-center gap-1 text-caption font-semibold text-fg-brand uppercase tracking-wider">
                        <Terminal className="h-3 w-3" />
                        Cadena de Razonamiento Interno (Thought Trace)
                      </div>
                      <p className="font-mono text-caption text-fg-secondary">{msg.thoughtTrace}</p>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Tool Executions Badge Box */}
                  {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-border-default">
                      <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary block">
                        Herramientas MCP Invocadas
                      </span>
                      {msg.toolExecutions.map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-bg-card/60 border border-border-default text-caption font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-fg-brand font-semibold">{tool.toolName}</span>
                            <span className="text-caption text-fg-secondary">({tool.serverName})</span>
                          </div>
                          <Badge
                            variant={
                              tool.status === 'completed'
                                ? 'success'
                                : tool.status === 'rejected'
                                ? 'destructive'
                                : 'warning'
                            }
                            className="text-caption"
                          >
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Human Approval Request Banner (Zero-Trust) */}
                  {msg.approvalRequest && msg.approvalRequest.status === 'pending' && (
                    <div className="mt-4 rounded-xl border-2 border-fg-warning bg-bg-warning/25 p-4 space-y-3 shadow-lg shadow-amber-950/30 animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-body font-bold text-fg-warning">
                          <ShieldAlert className="h-5 w-5 animate-pulse" />
                          <span>Aprobación Humana Requerida (Zero-Trust)</span>
                        </div>
                        <Badge variant="warning" className="text-caption font-mono uppercase">
                          {msg.approvalRequest.id}
                        </Badge>
                      </div>

                      <div className="rounded-lg bg-bg-card/70 border border-border-default p-3">
                        <p className="text-body font-semibold text-fg-primary leading-relaxed">
                          {msg.approvalRequest.actionDescription}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-fg-secondary font-mono">
                          <span>Herramienta: <strong className="text-fg-brand">{msg.approvalRequest.toolName}</strong></span>
                          <span>·</span>
                          <span>Agente solicitante: <strong className="text-fg-primary">{msg.approvalRequest.agentName}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-body h-9 px-4 bg-fg-success hover:bg-emerald-500 text-slate-950 font-bold shadow-md"
                          onClick={() => respondToApproval(msg.approvalRequest!.id, true)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprobar Ejecución
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-body h-9 px-4 font-semibold"
                          onClick={() => respondToApproval(msg.approvalRequest!.id, false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar Operación
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Delegation notice */}
                  {msg.delegation && (
                    <div className="mt-2.5 pt-2 border-t border-border-default text-caption text-fg-secondary flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-fg-brand" />
                      <span>
                        Delegado a <strong className="text-fg-brand">{msg.delegation.targetAgentName}</strong>: {msg.delegation.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Typing Indicator */}
          {activeTypingAgent && (
            <div className="flex items-center space-x-2 text-caption text-fg-secondary py-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-surface text-fg-brand">
                <Bot className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <span className="font-semibold text-fg-secondary">{activeTypingAgent.name}</span>
              <span className="text-caption text-fg-warning animate-pulse">está pensando y generando respuesta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-border-default bg-bg-card/90 flex items-center gap-2">
          <Input
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Escribe un requerimiento para el equipo multiagente (ej. Diseñar microservicio con Stripe)..."
            disabled={isSimulating}
            className="flex-1 text-caption"
          />
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isSimulating || !inputContent.trim()}
            className="h-9 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-bg-card p-5 shadow-2xl">
            <h3 className="text-subtitle font-bold text-fg-primary mb-1">Nueva Sesión Multiagente</h3>
            <p className="text-caption text-fg-secondary mb-4">
              Crea una sala de conversación y selecciona qué agentes colaborarán en la tarea.
            </p>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Título de la Sesión
                </label>
                <Input
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="ej. Auditoría de Seguridad y Refactorización"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-2">
                  Agentes Participantes
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {agents.map((ag) => {
                    const isSelected = selectedAgents.includes(ag.id);
                    return (
                      <div
                        key={ag.id}
                        onClick={() =>
                          setSelectedAgents((prev) =>
                            prev.includes(ag.id)
                              ? prev.filter((id) => id !== ag.id)
                              : [...prev, ag.id]
                          )
                        }
                        className={`p-2 rounded-lg border text-caption cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-bg-brand-subtle/40 border-border-brand text-fg-primary'
                            : 'bg-bg-card/40 border-border-default text-fg-secondary'
                        }`}
                      >
                        <span className="font-medium">{ag.name}</span>
                        <Badge variant="outline" className="text-caption font-mono">
                          {ag.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewChatModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Iniciar Sesión
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

