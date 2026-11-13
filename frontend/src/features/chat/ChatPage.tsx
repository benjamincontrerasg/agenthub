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

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto overflow-hidden">
      {/* Left Column: Conversations and Participants (4 columns) */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
        {/* Sessions list */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-800">
            <div>
              <CardTitle className="text-sm font-semibold text-white">Sesiones de Chat</CardTitle>
              <CardDescription className="text-[11px]">Salas multiagente</CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs px-2"
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
                className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeConversationId === c.id
                    ? 'bg-violet-950/40 border border-violet-700/60 text-white'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate max-w-[170px]">{c.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {c.participantAgentIds.length} ags
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {c.messages[c.messages.length - 1]?.content || 'Sin mensajes'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Participating Agents in Active Session */}
        {activeConv && (
          <Card className="h-64 shrink-0 flex flex-col overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-slate-800">
              <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-violet-400" />
                Agentes Participantes ({activeConv.participantAgentIds.length})
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
              {activeConv.participantAgentIds.map((agId) => {
                const ag = agents.find((a) => a.id === agId);
                const isCurrentActive = activeConv.activeAgentId === agId;
                const isTyping = activeAgentTypingId === agId;

                return (
                  <div
                    key={agId}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isTyping
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-300 animate-pulse'
                        : isCurrentActive
                        ? 'bg-slate-900 border-violet-800/60 text-white'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-violet-300">
                        {ag ? ag.name.substring(0, 2).toUpperCase() : 'AG'}
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate text-xs">{ag?.name || agId}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{ag?.role || 'Agent'}</p>
                      </div>
                    </div>

                    {isTyping ? (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 animate-spin" /> Pensando
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">Listo</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Chat Room & Simulation Stream */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Chat Room Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeConv?.title || 'Sala de Chat'}
                <Badge variant="outline" className="text-[10px]">
                  {activeConv?.status || 'idle'}
                </Badge>
              </h3>
              <p className="text-[11px] text-slate-400">
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
                    className="text-xs h-7"
                    onClick={pauseSimulation}
                  >
                    <Pause className="mr-1 h-3 w-3" /> Pausar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 text-emerald-400"
                    onClick={resumeSimulation}
                  >
                    <Play className="mr-1 h-3 w-3" /> Continuar
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-7"
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
          <div className="px-5 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 shrink-0">Cadena de Delegación:</span>
            {activeConv.currentDelegationPath.map((agentName, idx) => (
              <React.Fragment key={idx}>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] shrink-0 ${
                    idx === activeConv.currentDelegationPath!.length - 1
                      ? 'bg-violet-950 text-violet-300 font-semibold border border-violet-800'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {agentName}
                </span>
                {idx < activeConv.currentDelegationPath!.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
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
                  <div className="rounded-lg bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 max-w-lg text-center">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
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
                <div className="flex items-center gap-2 text-xs">
                  {!isUser && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-[10px] font-bold text-white">
                      {msg.senderName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-slate-200">{msg.senderName}</span>
                  {msg.senderRole && (
                    <Badge variant="outline" className="text-[9px] font-mono py-0">
                      {msg.senderRole}
                    </Badge>
                  )}
                  <span className="text-[10px] text-slate-400">{formatDate(msg.timestamp)}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-2xl shadow-md ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Thought Trace Inspector */}
                  {msg.thoughtTrace && (
                    <div className="mb-2.5 rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/90 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                        <Terminal className="h-3 w-3" />
                        Cadena de Razonamiento Interno (Thought Trace)
                      </div>
                      <p className="font-mono text-[11px] text-slate-400">{msg.thoughtTrace}</p>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Tool Executions Badge Box */}
                  {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Herramientas MCP Invocadas
                      </span>
                      {msg.toolExecutions.map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-violet-400 font-semibold">{tool.toolName}</span>
                            <span className="text-[10px] text-slate-400">({tool.serverName})</span>
                          </div>
                          <Badge
                            variant={
                              tool.status === 'completed'
                                ? 'success'
                                : tool.status === 'rejected'
                                ? 'destructive'
                                : 'warning'
                            }
                            className="text-[9px]"
                          >
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Human Approval Request Banner */}
                  {msg.approvalRequest && msg.approvalRequest.status === 'pending' && (
                    <div className="mt-3 rounded-xl border border-amber-600/70 bg-amber-950/50 p-3.5 space-y-2.5 text-amber-200 animate-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Confirmación de Seguridad Requerida (Zero-Trust)</span>
                      </div>
                      <p className="text-xs text-amber-100/90 leading-normal">
                        {msg.approvalRequest.actionDescription}
                      </p>

                      <div className="flex items-center gap-2.5 pt-1">
                        <Button
                          variant="success"
                          size="sm"
                          className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => respondToApproval(msg.approvalRequest!.id, true)}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Aprobar Ejecución
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 px-3"
                          onClick={() => respondToApproval(msg.approvalRequest!.id, false)}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Delegation notice */}
                  {msg.delegation && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-violet-400" />
                      <span>
                        Delegado a <strong className="text-violet-300">{msg.delegation.targetAgentName}</strong>: {msg.delegation.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Typing Indicator */}
          {activeTypingAgent && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-violet-400">
                <Bot className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <span className="font-semibold text-slate-300">{activeTypingAgent.name}</span>
              <span className="text-[11px] text-amber-400 animate-pulse">está pensando y generando respuesta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
          <Input
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Escribe un requerimiento para el equipo multiagente (ej. Diseñar microservicio con Stripe)..."
            disabled={isSimulating}
            className="flex-1 text-xs"
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
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Nueva Sesión Multiagente</h3>
            <p className="text-xs text-slate-400 mb-4">
              Crea una sala de conversación y selecciona qué agentes colaborarán en la tarea.
            </p>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título de la Sesión
                </label>
                <Input
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="ej. Auditoría de Seguridad y Refactorización"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
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
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-violet-950/40 border-violet-700 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-medium">{ag.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {ag.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
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
