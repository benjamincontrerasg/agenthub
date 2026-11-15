import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Conversation, Message, Approval, ToolExecution } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { wsManager } from './websocket.service.js';
import { aiEngine } from './ai-engine.js';
import { agentService } from './agent.service.js';
import { memoryService } from './memory.service.js';
import { auditService } from './audit.service.js';
import { toolPolicyService } from './tool-policy.service.js';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const convs = db.select().from(schema.conversations).all();
    const result: Conversation[] = [];

    for (const c of convs) {
      const messages = await this.getMessagesForConversation(c.id);
      let participantAgentIds: string[] = [];
      let currentDelegationPath: string[] | undefined;

      try {
        participantAgentIds = JSON.parse(c.participantAgentIds);
        if (c.currentDelegationPath) {
          currentDelegationPath = JSON.parse(c.currentDelegationPath);
        }
      } catch {}

      result.push({
        id: c.id,
        title: c.title,
        participantAgentIds,
        activeAgentId: c.activeAgentId ?? undefined,
        status: c.status as any,
        currentDelegationPath,
        messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return result;
  },

  async getById(id: string): Promise<Conversation> {
    const c = db.select().from(schema.conversations).where(eq(schema.conversations.id, id)).get();
    if (!c) {
      throw new NotFoundError('Conversación', id);
    }

    const messages = await this.getMessagesForConversation(id);
    let participantAgentIds: string[] = [];
    let currentDelegationPath: string[] | undefined;

    try {
      participantAgentIds = JSON.parse(c.participantAgentIds);
      if (c.currentDelegationPath) {
        currentDelegationPath = JSON.parse(c.currentDelegationPath);
      }
    } catch {}

    return {
      id: c.id,
      title: c.title,
      participantAgentIds,
      activeAgentId: c.activeAgentId ?? undefined,
      status: c.status as any,
      currentDelegationPath,
      messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    const rawMessages = db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .all();

    const result: Message[] = [];

    for (const m of rawMessages) {
      let delegation: any = undefined;
      try {
        if (m.delegation) delegation = JSON.parse(m.delegation);
      } catch {}

      // Fetch approvals if any
      let approvalRequest: Approval | undefined = undefined;
      if (m.approvalRequestId) {
        const app = db.select().from(schema.approvals).where(eq(schema.approvals.id, m.approvalRequestId)).get();
        if (app) {
          let payload = {};
          try {
            payload = JSON.parse(app.payload);
          } catch {}
          approvalRequest = {
            id: app.id,
            conversationId: app.conversationId ?? undefined,
            executionId: app.executionId ?? undefined,
            toolId: app.toolId,
            toolName: app.toolName,
            agentId: app.agentId,
            agentName: app.agentName,
            actionDescription: app.actionDescription,
            payload,
            status: app.status as any,
            requestedAt: app.requestedAt,
            respondedAt: app.respondedAt ?? undefined,
          };
        }
      }

      // Fetch tool executions
      const tools = db.select().from(schema.toolExecutions).where(eq(schema.toolExecutions.messageId, m.id)).all();
      const toolExecutions: ToolExecution[] = tools.map((t) => {
        let input = {};
        let output = undefined;
        try {
          input = JSON.parse(t.input);
          if (t.output) output = JSON.parse(t.output);
        } catch {}

        return {
          id: t.id,
          toolId: t.toolId,
          toolName: t.toolName,
          serverName: t.serverName,
          isWriteOperation: t.isWriteOperation,
          input,
          output,
          status: t.status as any,
          executionTimeMs: t.executionTimeMs ?? undefined,
          requiresApproval: t.requiresApproval,
          approvalId: t.approvalId ?? undefined,
          error: t.error ?? undefined,
        };
      });

      result.push({
        id: m.id,
        conversationId: m.conversationId,
        senderType: m.senderType as any,
        senderId: m.senderId ?? undefined,
        senderName: m.senderName,
        senderRole: m.senderRole ?? undefined,
        content: m.content,
        timestamp: m.timestamp,
        status: m.status as any,
        thoughtTrace: m.thoughtTrace ?? undefined,
        toolExecutions: toolExecutions.length > 0 ? toolExecutions : undefined,
        delegation,
        approvalRequest,
      });
    }

    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const conv = await this.getById(conversationId);
    const now = new Date().toISOString();
    const userMsgId = `msg-user-${Date.now()}`;

    // 1. Insert User Message
    db.insert(schema.messages).values({
      id: userMsgId,
      conversationId,
      senderType: 'user',
      senderName: 'Operador',
      content,
      timestamp: now,
    }).run();

    const userMessage: Message = {
      id: userMsgId,
      conversationId,
      senderType: 'user',
      senderName: 'Operador',
      content,
      timestamp: now,
    };

    // Broadcast user message
    wsManager.broadcast('agent.message', userMessage);

    // 2. Trigger asynchronous multi-agent coordination
    this.orchestrateAgentsResponse(conversationId, content).catch((err) => {
      console.error('[Chat Orchestration Error]', err);
    });

    return userMessage;
  },

  async respondApproval(approvalId: string, approved: boolean, rememberForSession?: boolean): Promise<{ success: boolean }> {
    const app = db.select().from(schema.approvals).where(eq(schema.approvals.id, approvalId)).get();
    if (!app) {
      throw new NotFoundError('Aprobación requerida', approvalId);
    }

    const now = new Date().toISOString();
    const newStatus = approved ? 'approved' : 'rejected';

    db.update(schema.approvals)
      .set({
        status: newStatus,
        respondedAt: now,
      })
      .where(eq(schema.approvals.id, approvalId))
      .run();

    // Si el usuario marcó recordar en sesión y la herramienta no es destructiva, guardar en memoria
    if (approved && rememberForSession && app.conversationId) {
      const risk = toolPolicyService.determineRiskLevel(app.toolName);
      if (risk === 'write') {
        toolPolicyService.rememberToolForSession(app.conversationId, app.toolName);
      }
    }

    // Update corresponding tool execution
    db.update(schema.toolExecutions)
      .set({
        status: approved ? 'completed' : 'rejected',
        output: approved ? JSON.stringify({ result: 'Operación ejecutada con éxito tras aprobación humana.' }) : JSON.stringify({ error: 'Operación rechazada por el operador humano.' }),
      })
      .where(eq(schema.toolExecutions.approvalId, approvalId))
      .run();

    // Broadcast update
    wsManager.broadcast('agent.message', {
      id: `sys-${Date.now()}`,
      conversationId: app.conversationId,
      senderType: 'system',
      senderName: 'Security Gate',
      content: approved
        ? `Operación aprobada por el operador humano para la herramienta '${app.toolName}'. Continuando flujo...`
        : `Operación rechazada por el operador humano para la herramienta '${app.toolName}'.`,
      timestamp: now,
    });

    // Log Zero-Trust audit entry
    await auditService.log({
      action: approved ? 'security_gate.approved' : 'security_gate.rejected',
      resource: `mcp:tool:${app.toolName}`,
      status: approved ? 'success' : 'failure',
      details: {
        approvalId,
        toolName: app.toolName,
        agentId: app.agentId,
        agentName: app.agentName,
      },
    });

    return { success: true };
  },

  async orchestrateAgentsResponse(conversationId: string, userPrompt: string) {
    const conv = await this.getById(conversationId);
    const agents = db.select().from(schema.agents).all();
    const coordinator = agents.find((a) => a.role === 'Coordinator') || agents[0];

    if (!coordinator) return;

    // Agent starts thinking
    wsManager.broadcast('agent.started', {
      conversationId,
      agentId: coordinator.id,
      agentName: coordinator.name,
      role: coordinator.role,
    });

    await new Promise((r) => setTimeout(r, 800));

    // Determine delegation target based on prompt
    const p = userPrompt.toLowerCase();
    const isCode = p.includes('código') || p.includes('script') || p.includes('implement') || p.includes('typescript') || p.includes('función') || p.includes('funcion') || p.includes('escribe') || p.includes('crea') || p.includes('desarroll');
    const isArch = p.includes('arquitectura') || p.includes('diseñ') || p.includes('sistema') || p.includes('esquema') || p.includes('db');

    const targetAgent = isCode
      ? agents.find((a) => a.role === 'Developer') || coordinator
      : isArch
      ? agents.find((a) => a.role === 'Architect') || coordinator
      : agents.find((a) => a.role === 'Developer') || coordinator;

    const coordMsgId = `msg-coord-${Date.now()}`;
    const coordNow = new Date().toISOString();

    const delegation = targetAgent.id !== coordinator.id ? {
      targetAgentId: targetAgent.id,
      targetAgentName: targetAgent.name,
      reason: `Delegación de tarea técnica especializada a ${targetAgent.name} (${targetAgent.role})`,
    } : undefined;

    db.insert(schema.messages).values({
      id: coordMsgId,
      conversationId,
      senderType: 'agent',
      senderId: coordinator.id,
      senderName: coordinator.name,
      senderRole: coordinator.role,
      content: `Analizando requerimiento: "${userPrompt.slice(0, 80)}...". Coordinando ejecución y asignando recursos especializados.`,
      timestamp: coordNow,
      status: 'done',
      thoughtTrace: `Descomponiendo requerimiento. Estrategia: delegación autónoma a ${targetAgent.name}.`,
      delegation: delegation ? JSON.stringify(delegation) : null,
    }).run();

    wsManager.broadcast('agent.message', {
      id: coordMsgId,
      conversationId,
      senderType: 'agent',
      senderId: coordinator.id,
      senderName: coordinator.name,
      senderRole: coordinator.role,
      content: `Analizando requerimiento: "${userPrompt.slice(0, 80)}...". Coordinando ejecución y asignando recursos especializados.`,
      timestamp: coordNow,
      status: 'done',
      thoughtTrace: `Descomponiendo requerimiento. Estrategia: delegación autónoma a ${targetAgent.name}.`,
      delegation,
    });

    if (targetAgent.id !== coordinator.id) {
      // 3. Delegate to specialized agent & call real AI engine with streaming chunks
      const fullAgent = await agentService.getById(targetAgent.id);
      const targetMsgId = `msg-agent-${Date.now()}`;
      const targetNow = new Date().toISOString();

      // Inyección de memoria semántica relevante (RAG)
      let enrichedPrompt = userPrompt;
      try {
        const memories = await memoryService.searchMemories(targetAgent.id, userPrompt, 3);
        if (memories.length > 0) {
          const contextBlocks = memories
            .map((m, idx) => `[Memoria ${idx + 1}]: ${m.content}`)
            .join('\n');
          enrichedPrompt = `Contexto Relevante de Memoria RAG:\n${contextBlocks}\n\nInstrucción:\n${userPrompt}`;
        }
      } catch (err) {
        console.warn('[RAG Memory Warning] No se pudo recuperar memoria:', err);
      }

      wsManager.broadcast('chat.stream_start', {
        conversationId,
        messageId: targetMsgId,
        agentId: targetAgent.id,
        agentName: targetAgent.name,
        senderRole: targetAgent.role,
      });

      const aiResult = await aiEngine.generateAgentResponse(
        fullAgent,
        conv.messages,
        enrichedPrompt,
        (chunk: string) => {
          wsManager.broadcast('chat.token', {
            conversationId,
            messageId: targetMsgId,
            agentId: targetAgent.id,
            chunk,
          });
        }
      );

      db.insert(schema.messages).values({
        id: targetMsgId,
        conversationId,
        senderType: 'agent',
        senderId: targetAgent.id,
        senderName: targetAgent.name,
        senderRole: targetAgent.role,
        content: aiResult.content,
        timestamp: targetNow,
        status: 'done',
        thoughtTrace: aiResult.thoughtTrace,
      }).run();

      // Record real token usage
      if (aiResult.tokensUsed > 0) {
        db.insert(schema.tokenUsage).values({
          id: `usage-${Date.now()}`,
          providerId: targetAgent.providerId,
          agentId: targetAgent.id,
          tokens: aiResult.tokensUsed,
          costUsd: aiResult.costUsd,
          timestamp: targetNow,
        }).run();

        // Increment agent stats
        db.update(schema.agents)
          .set({
            totalRuns: (fullAgent.stats.totalRuns || 0) + 1,
            totalTokens: (fullAgent.stats.totalTokens || 0) + aiResult.tokensUsed,
          })
          .where(eq(schema.agents.id, targetAgent.id))
          .run();
      }

      wsManager.broadcast('agent.message', {
        id: targetMsgId,
        conversationId,
        senderType: 'agent',
        senderId: targetAgent.id,
        senderName: targetAgent.name,
        senderRole: targetAgent.role,
        content: aiResult.content,
        timestamp: targetNow,
        status: 'done',
        thoughtTrace: aiResult.thoughtTrace,
      });
    }

    wsManager.broadcast('agent.completed', {
      conversationId,
      agentId: targetAgent.id,
      status: 'success',
    });
  },
};
