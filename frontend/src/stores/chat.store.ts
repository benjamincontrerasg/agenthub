import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message, Approval, ToolExecution } from '@/types';
import { initialConversations } from '@/services/mock-data';
import { generateId } from '@/lib/utils';

// Helper to stream message tokens word by word with realistic pacing and pause/cancel awareness
async function streamMessageTokens(
  set: any,
  get: any,
  convId: string,
  baseMsg: Message,
  fullContent: string,
  typingAgentId: string
): Promise<boolean> {
  set({ activeAgentTypingId: typingAgentId });

  // 1. Initial message with empty content and 'streaming' status
  set((state: any) => ({
    conversations: state.conversations.map((c: any) =>
      c.id === convId
        ? {
            ...c,
            activeAgentId: typingAgentId,
            messages: [...c.messages, { ...baseMsg, content: '', status: 'streaming' }],
          }
        : c
    ),
  }));

  // 2. Stream tokens (words with spaces)
  const tokens = fullContent.match(/\S+|\s+/g) || [fullContent];
  let accumulated = '';

  for (const token of tokens) {
    if (!get().isSimulating) return false;

    // Check pause loop
    while (get().isPaused && get().isSimulating) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!get().isSimulating) return false;

    accumulated += token;
    set((state: any) => ({
      conversations: state.conversations.map((c: any) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m: any) =>
                m.id === baseMsg.id ? { ...m, content: accumulated } : m
              ),
            }
          : c
      ),
    }));

    // Realistic token streaming delay: ~18ms
    await new Promise((r) => setTimeout(r, 18));
  }

  // 3. Finalize message status
  set((state: any) => ({
    activeAgentTypingId: null,
    conversations: state.conversations.map((c: any) =>
      c.id === convId
        ? {
            ...c,
            messages: c.messages.map((m: any) =>
              m.id === baseMsg.id
                ? { ...m, content: fullContent, status: baseMsg.status || 'done' }
                : m
            ),
          }
        : c
    ),
  }));

  return true;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string;
  isSimulating: boolean;
  isPaused: boolean;
  activeAgentTypingId: string | null;
  setActiveConversationId: (id: string) => void;
  getActiveConversation: () => Conversation | undefined;
  createConversation: (title: string, participantAgentIds: string[]) => Conversation;
  sendMessage: (content: string) => Promise<void>;
  respondToApproval: (approvalId: string, approved: boolean) => Promise<void>;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  cancelSimulation: () => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: initialConversations,
      activeConversationId: 'conv-101',
      isSimulating: false,
      isPaused: false,
      activeAgentTypingId: null,

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) || conversations[0];
      },

      createConversation: (title, participantAgentIds) => {
        const newConv: Conversation = {
          id: generateId('conv'),
          title,
          participantAgentIds,
          activeAgentId: participantAgentIds[0] || 'agent-coordinator',
          status: 'idle',
          currentDelegationPath: ['Usuario', 'Coordinator Agent'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: generateId('msg'),
              conversationId: '',
              senderType: 'system',
              senderName: 'AgentHub Orchestrator',
              content: `Sesión de chat multiagente inicializada con ${participantAgentIds.length} agentes activos. Envía un requerimiento para comenzar la colaboración.`,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        newConv.messages[0].conversationId = newConv.id;

        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: newConv.id,
        }));

        return newConv;
      },

      sendMessage: async (content: string) => {
        const activeConv = get().getActiveConversation();
        if (!activeConv || get().isSimulating) return;

        const userMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'user',
          senderName: 'Tú (Arquitecto Líder)',
          content,
          timestamp: new Date().toISOString(),
        };

        // Append user message
        set((state) => ({
          isSimulating: true,
          isPaused: false,
          conversations: state.conversations.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  status: 'running',
                  messages: [...c.messages, userMsg],
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));

        // STEP 1: Coordinator Agent starts thinking and streams response
        set({ activeAgentTypingId: 'agent-coordinator' });
        await new Promise((r) => setTimeout(r, 600));
        if (!get().isSimulating) return;

        const coordMsgText = `Requerimiento analizado con éxito: "${content.substring(0, 70)}..."\n\nHe activado el protocolo de colaboración autónoma:\n- Delegando análisis arquitectónico y definición de interfaz a **Architect Agent**.\n- Los resultados se transferirán a **Developer Agent** para codificación y tests.`;

        const coordMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'agent',
          senderId: 'agent-coordinator',
          senderName: 'Coordinator Agent',
          senderRole: 'Coordinator',
          status: 'done',
          content: '',
          timestamp: new Date().toISOString(),
          thoughtTrace: 'Descompuse el requerimiento en especificación técnica, implementación y revisión de seguridad.',
          delegation: {
            targetAgentId: 'agent-architect',
            targetAgentName: 'Architect Agent',
            reason: 'Diseño arquitectónico y definición de contratos de datos',
          },
        };

        const coordOk = await streamMessageTokens(
          set,
          get,
          activeConv.id,
          coordMsg,
          coordMsgText,
          'agent-coordinator'
        );
        if (!coordOk) return;

        // Update delegation path
        set((state: any) => ({
          conversations: state.conversations.map((c: any) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  activeAgentId: 'agent-architect',
                  currentDelegationPath: ['Usuario', 'Coordinator Agent', 'Architect Agent'],
                }
              : c
          ),
        }));

        // STEP 2: Architect Agent works and streams response
        set({ activeAgentTypingId: 'agent-architect' });
        await new Promise((r) => setTimeout(r, 800));
        if (!get().isSimulating) return;

        const archMsgText = `Especificación técnica finalizada:\n\n\`\`\`typescript\ninterface TaskExecutionPayload {\n  taskId: string;\n  status: 'PENDING' | 'RUNNING' | 'COMPLETED';\n  metadata: Record<string, unknown>;\n  timestamp: number;\n}\n\`\`\`\n\nPatrón seleccionado: CQRS con eventos desacoplados. Delegando la implementación a **Developer Agent**.`;

        const archMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'agent',
          senderId: 'agent-architect',
          senderName: 'Architect Agent',
          senderRole: 'Architect',
          status: 'done',
          content: '',
          timestamp: new Date().toISOString(),
          thoughtTrace: 'Consultando esquema en MCP Filesystem para alinear firmas de tipos con la base de código.',
          toolExecutions: [
            {
              id: generateId('tex'),
              toolId: 'tool-fs-read',
              toolName: 'read_file',
              serverName: 'Filesystem Server',
              isWriteOperation: false,
              input: { path: 'src/types/schema.ts' },
              output: 'export type Status = "IDLE" | "ACTIVE";',
              status: 'completed',
              executionTimeMs: 52,
              requiresApproval: false,
            },
          ],
          delegation: {
            targetAgentId: 'agent-developer',
            targetAgentName: 'Developer Agent',
            reason: 'Implementación del módulo y generación de tests unitarios',
          },
        };

        const archOk = await streamMessageTokens(
          set,
          get,
          activeConv.id,
          archMsg,
          archMsgText,
          'agent-architect'
        );
        if (!archOk) return;

        // Update delegation path
        set((state: any) => ({
          conversations: state.conversations.map((c: any) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  activeAgentId: 'agent-developer',
                  currentDelegationPath: ['Usuario', 'Coordinator Agent', 'Architect Agent', 'Developer Agent'],
                }
              : c
          ),
        }));

        // STEP 3: Developer Agent responds with a write tool request needing human approval!
        set({ activeAgentTypingId: 'agent-developer' });
        await new Promise((r) => setTimeout(r, 800));
        if (!get().isSimulating) return;

        const devApprovalId = generateId('appr');
        const devMsgText = `He completado la implementación en memoria y los tests unitarios (98% de cobertura). De acuerdo con la política de seguridad Zero-Trust, requiero autorización humana para ejecutar la herramienta de escritura \`write_file\` y guardar los cambios en el proyecto.`;

        const devMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'agent',
          senderId: 'agent-developer',
          senderName: 'Developer Agent',
          senderRole: 'Developer',
          status: 'waiting_approval',
          content: '',
          timestamp: new Date().toISOString(),
          thoughtTrace: 'El agente no tiene permisos de auto-escritura en producción. Solicitando aprobación humana en la UI.',
          toolExecutions: [
            {
              id: generateId('tex'),
              toolId: 'tool-fs-write',
              toolName: 'write_file',
              serverName: 'Filesystem Server',
              isWriteOperation: true,
              input: {
                path: 'src/features/execution/handler.ts',
                content: '// Implementación generada por Developer Agent\nexport const executeTask = async () => { ... };',
              },
              status: 'pending',
              requiresApproval: true,
              approvalId: devApprovalId,
            },
          ],
          approvalRequest: {
            id: devApprovalId,
            conversationId: activeConv.id,
            toolId: 'tool-fs-write',
            toolName: 'write_file',
            agentId: 'agent-developer',
            agentName: 'Developer Agent',
            actionDescription: 'Escritura de código en src/features/execution/handler.ts',
            payload: {
              targetPath: 'src/features/execution/handler.ts',
              isWriteOperation: true,
              bytes: 1420,
            },
            status: 'pending',
            requestedAt: new Date().toISOString(),
          },
        };

        await streamMessageTokens(
          set,
          get,
          activeConv.id,
          devMsg,
          devMsgText,
          'agent-developer'
        );

        set((state: any) => ({
          isSimulating: false,
          activeAgentTypingId: null,
          conversations: state.conversations.map((c: any) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  status: 'waiting_approval',
                }
              : c
          ),
        }));
      },

      respondToApproval: async (approvalId, approved) => {
        const activeConv = get().getActiveConversation();
        if (!activeConv) return;

        // Update the approval state inside messages
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== activeConv.id) return c;
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.approvalRequest?.id === approvalId) {
                  return {
                    ...m,
                    status: approved ? 'done' : 'failed',
                    approvalRequest: {
                      ...m.approvalRequest,
                      status: approved ? 'approved' : 'rejected',
                      respondedAt: new Date().toISOString(),
                    },
                    toolExecutions: m.toolExecutions?.map((te) =>
                      te.approvalId === approvalId
                        ? { ...te, status: approved ? 'completed' : 'rejected' }
                        : te
                    ),
                  };
                }
                return m;
              }),
            };
          }),
        }));

        if (!approved) {
          // If rejected, coordinator reports abort
          const abortMsg: Message = {
            id: generateId('msg'),
            conversationId: activeConv.id,
            senderType: 'system',
            senderName: 'Seguridad / AgentHub',
            content: 'Operación de escritura rechazada por el operador humano. La ejecución se canceló de forma segura sin modificar archivos.',
            timestamp: new Date().toISOString(),
          };
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === activeConv.id ? { ...c, status: 'idle', messages: [...c.messages, abortMsg] } : c
            ),
          }));
          return;
        }

        // If approved, continue to Reviewer Agent -> Coordinator Agent completion with streaming
        set({ isSimulating: true, activeAgentTypingId: 'agent-reviewer' });
        await new Promise((r) => setTimeout(r, 600));

        const revMsgText = `Auditoría de código finalizada:\n- **Seguridad**: Sin inyecciones ni exposición de secretos detectados.\n- **Cobertura**: 12/12 tests pasando.\n- **Veredicto**: **APROBADO** (Clean Code). Transfiriendo reporte a Coordinator.`;

        const revMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'agent',
          senderId: 'agent-reviewer',
          senderName: 'Reviewer Agent',
          senderRole: 'Reviewer',
          status: 'done',
          content: '',
          timestamp: new Date().toISOString(),
          thoughtTrace: 'Verificación estática y linting pasados con 0 errores.',
          delegation: {
            targetAgentId: 'agent-coordinator',
            targetAgentName: 'Coordinator Agent',
            reason: 'Consolidación de entrega y cierre del ciclo de ejecución',
          },
        };

        const revOk = await streamMessageTokens(
          set,
          get,
          activeConv.id,
          revMsg,
          revMsgText,
          'agent-reviewer'
        );
        if (!revOk) return;

        // Final closing summary from Coordinator
        set({ activeAgentTypingId: 'agent-coordinator' });
        await new Promise((r) => setTimeout(r, 600));

        const finalCoordText = `Todas las etapas del ciclo multiagente se han completado con éxito:\n\n- Arquitectura definida y validada.\n- Código generado y persistido tras aprobación humana.\n- Auditoría de seguridad aprobada sin observaciones.\n\nEl sistema está listo para pruebas de integración.`;

        const finalCoordMsg: Message = {
          id: generateId('msg'),
          conversationId: activeConv.id,
          senderType: 'agent',
          senderId: 'agent-coordinator',
          senderName: 'Coordinator Agent',
          senderRole: 'Coordinator',
          status: 'done',
          content: '',
          timestamp: new Date().toISOString(),
          thoughtTrace: 'Ciclo completo terminado con éxito. Todos los agentes reportaron estado OK.',
        };

        await streamMessageTokens(
          set,
          get,
          activeConv.id,
          finalCoordMsg,
          finalCoordText,
          'agent-coordinator'
        );

        set((state: any) => ({
          isSimulating: false,
          activeAgentTypingId: null,
          conversations: state.conversations.map((c: any) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  status: 'completed',
                }
              : c
          ),
        }));
      },

      pauseSimulation: () => set({ isPaused: true }),
      resumeSimulation: () => set({ isPaused: false }),
      cancelSimulation: () => {
        const activeConv = get().getActiveConversation();
        set({ isSimulating: false, isPaused: false, activeAgentTypingId: null });
        if (activeConv) {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === activeConv.id ? { ...c, status: 'paused' } : c
            ),
          }));
        }
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? (state.conversations[0]?.id || '') : state.activeConversationId,
        }));
      },
    }),
    {
      name: 'agenthub-chat-storage',
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);

