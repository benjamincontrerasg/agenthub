import { db } from './connection.js';
import * as schema from './schema.js';
import {
  initialProviders,
  initialAgents,
  initialMCPServers,
  initialWorkflows,
  initialExecutions,
  initialConversations,
  initialSettings,
} from './seed-data.js';
import { eq } from 'drizzle-orm';
import { sqlite } from './connection.js';

export async function seedDatabase() {
  console.log('[Seed] Checking database state...');

  // Ensure agent_memories table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_memories (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      metadata TEXT,
      embedding TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      ip TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // 1. Providers and Models
  const existingProviders = db.select().from(schema.providers).all();
  if (existingProviders.length === 0) {
    console.log('[Seed] Seeding providers and models...');
    for (const p of initialProviders) {
      db.insert(schema.providers).values({
        id: p.id,
        name: p.name,
        description: p.description,
        logo: p.logo,
        badge: p.badge,
        status: p.status,
        defaultModelId: p.defaultModelId,
        hasApiKey: p.hasApiKey,
        latencyMs: p.latencyMs ?? null,
        lastTested: p.lastTested ?? null,
        rateLimitRequestsPerMin: p.rateLimits?.requestsPerMin ?? null,
        rateLimitTokensPerMin: p.rateLimits?.tokensPerMin ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      for (const m of p.models) {
        db.insert(schema.models).values({
          id: m.id,
          providerId: p.id,
          name: m.name,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          inputPricePerMillion: m.inputPricePerMillion,
          outputPricePerMillion: m.outputPricePerMillion,
          supportsStreaming: m.supportsStreaming,
          supportsToolCalling: m.supportsToolCalling,
          isDefault: m.isDefault ?? false,
        }).run();

        db.insert(schema.providerModels).values({
          providerId: p.id,
          modelId: m.id,
          contextWindow: m.contextWindow,
          inputCostPer1M: m.inputPricePerMillion,
          outputCostPer1M: m.outputPricePerMillion,
          supportsTools: m.supportsToolCalling ?? true,
        }).run();
      }
    }
  }

  const existingProviderModels = db.select().from(schema.providerModels).all();
  if (existingProviderModels.length === 0) {
    const allModels = db.select().from(schema.models).all();
    for (const m of allModels) {
      try {
        db.insert(schema.providerModels).values({
          providerId: m.providerId,
          modelId: m.id,
          contextWindow: m.contextWindow,
          inputCostPer1M: m.inputPricePerMillion,
          outputCostPer1M: m.outputPricePerMillion,
          supportsTools: m.supportsToolCalling ?? true,
        }).run();
      } catch {}
    }
  }

  // 2. Agents
  const existingAgents = db.select().from(schema.agents).all();
  if (existingAgents.length === 0) {
    console.log('[Seed] Seeding agents...');
    for (const a of initialAgents) {
      db.insert(schema.agents).values({
        id: a.id,
        name: a.name,
        description: a.description,
        role: a.role,
        providerId: a.providerId,
        modelId: a.modelId,
        systemPrompt: a.systemPrompt,
        temperature: a.temperature,
        maxIterations: a.maxIterations,
        status: a.status,
        avatarUrl: a.avatarUrl ?? null,
        totalRuns: a.stats.totalRuns,
        avgDurationSec: a.stats.avgDurationSec,
        totalTokens: a.stats.totalTokens,
        successRate: a.stats.successRate,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }).run();
    }

    for (const a of initialAgents) {
      for (const toolId of a.allowedToolIds) {
        db.insert(schema.agentAllowedTools).values({
          agentId: a.id,
          toolId,
        }).run();
      }

      for (const targetAgentId of a.allowedAgentCommunicationIds) {
        db.insert(schema.agentCommunications).values({
          agentId: a.id,
          targetAgentId,
        }).run();
      }
    }
  }

  // 3. MCP Servers, Tools, and Logs
  const existingMcp = db.select().from(schema.mcpServers).all();
  if (existingMcp.length === 0) {
    console.log('[Seed] Seeding MCP servers, tools, and logs...');
    for (const s of initialMCPServers) {
      db.insert(schema.mcpServers).values({
        id: s.id,
        name: s.name,
        description: s.description,
        transport: s.transport,
        commandOrEndpoint: s.commandOrEndpoint,
        args: s.args ? JSON.stringify(s.args) : null,
        env: s.env ? JSON.stringify(s.env) : null,
        allowedDirectories: s.allowedDirectories ? JSON.stringify(s.allowedDirectories) : null,
        status: s.status,
        isActivated: s.isActivated,
        error: s.error ?? null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }).run();

      for (const t of s.tools) {
        db.insert(schema.mcpTools).values({
          id: t.id,
          serverId: s.id,
          name: t.name,
          description: t.description,
          inputSchema: JSON.stringify(t.inputSchema),
          isWriteOperation: t.isWriteOperation,
          requiresApproval: t.requiresApproval,
        }).run();

        for (const agentId of t.assignedAgentIds) {
          db.insert(schema.mcpToolAssignments).values({
            toolId: t.id,
            agentId,
          }).run();
        }
      }

      for (const l of s.logs) {
        db.insert(schema.mcpLogs).values({
          id: l.id,
          serverId: s.id,
          timestamp: l.timestamp,
          level: l.level,
          message: l.message,
        }).run();
      }
    }
  }

  // 4. Workflows
  const existingWf = db.select().from(schema.workflows).all();
  if (existingWf.length === 0) {
    console.log('[Seed] Seeding workflows...');
    for (const w of initialWorkflows) {
      db.insert(schema.workflows).values({
        id: w.id,
        name: w.name,
        description: w.description,
        version: w.version,
        nodes: JSON.stringify(w.nodes),
        edges: JSON.stringify(w.edges),
        status: w.status,
        runsCount: w.stats?.runsCount ?? 0,
        avgRuntimeSec: w.stats?.avgRuntimeSec ?? 0,
        successRate: w.stats?.successRate ?? 100,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        lastExecutedAt: w.lastExecutedAt ?? null,
      }).run();
    }
  }

  // 5. Executions & Steps
  const existingExec = db.select().from(schema.workflowExecutions).all();
  if (existingExec.length === 0) {
    console.log('[Seed] Seeding executions...');
    for (const e of initialExecutions) {
      db.insert(schema.workflowExecutions).values({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowName,
        status: e.status,
        startedAt: e.startedAt,
        finishedAt: e.finishedAt ?? null,
        durationMs: e.durationMs ?? null,
        triggeredBy: e.triggeredBy,
        totalTokens: e.totalTokens,
        estimatedCostUsd: e.estimatedCostUsd,
        responsibleAgentId: e.responsibleAgentId ?? null,
        responsibleAgentName: e.responsibleAgentName ?? null,
        toolsUsed: JSON.stringify(e.toolsUsed),
        errorMessage: e.errorMessage ?? null,
      }).run();

      for (const s of e.steps) {
        db.insert(schema.executionSteps).values({
          id: s.id,
          executionId: e.id,
          nodeId: s.nodeId ?? null,
          name: s.name,
          type: s.type,
          agentOrToolName: s.agentOrToolName ?? null,
          status: s.status,
          startedAt: s.startedAt,
          completedAt: s.completedAt ?? null,
          durationMs: s.durationMs ?? null,
          tokensUsed: s.tokensUsed ?? null,
          outputSummary: s.outputSummary ?? null,
          logs: s.logs ? JSON.stringify(s.logs) : null,
          error: s.error ?? null,
        }).run();
      }

      for (const l of e.logs) {
        db.insert(schema.executionLogs).values({
          id: l.id,
          executionId: e.id,
          timestamp: l.timestamp,
          level: l.level,
          source: l.source,
          message: l.message,
        }).run();
      }
    }
  }

  // 6. Conversations & Messages
  const existingConv = db.select().from(schema.conversations).all();
  if (existingConv.length === 0) {
    console.log('[Seed] Seeding conversations...');
    for (const c of initialConversations) {
      db.insert(schema.conversations).values({
        id: c.id,
        title: c.title,
        participantAgentIds: JSON.stringify(c.participantAgentIds),
        activeAgentId: c.activeAgentId ?? null,
        status: c.status,
        currentDelegationPath: c.currentDelegationPath ? JSON.stringify(c.currentDelegationPath) : null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }).run();

      for (const m of c.messages) {
        db.insert(schema.messages).values({
          id: m.id,
          conversationId: c.id,
          senderType: m.senderType,
          senderId: m.senderId ?? null,
          senderName: m.senderName,
          senderRole: m.senderRole ?? null,
          content: m.content,
          timestamp: m.timestamp,
          status: m.status ?? null,
          thoughtTrace: m.thoughtTrace ?? null,
          delegation: m.delegation ? JSON.stringify(m.delegation) : null,
          approvalRequestId: m.approvalRequest?.id ?? null,
        }).run();

        if (m.approvalRequest) {
          const app = m.approvalRequest;
          db.insert(schema.approvals).values({
            id: app.id,
            conversationId: c.id,
            executionId: app.executionId ?? null,
            toolId: app.toolId,
            toolName: app.toolName,
            agentId: app.agentId,
            agentName: app.agentName,
            actionDescription: app.actionDescription,
            payload: JSON.stringify(app.payload),
            status: app.status,
            requestedAt: app.requestedAt,
            respondedAt: app.respondedAt ?? null,
          }).run();
        }

        if (m.toolExecutions) {
          for (const te of m.toolExecutions) {
            db.insert(schema.toolExecutions).values({
              id: te.id,
              messageId: m.id,
              toolId: te.toolId,
              toolName: te.toolName,
              serverName: te.serverName,
              isWriteOperation: te.isWriteOperation,
              input: JSON.stringify(te.input),
              output: te.output ? JSON.stringify(te.output) : null,
              status: te.status,
              executionTimeMs: te.executionTimeMs ?? null,
              requiresApproval: te.requiresApproval,
              approvalId: te.approvalId ?? null,
              error: te.error ?? null,
            }).run();
          }
        }
      }
    }
  }

  // 7. Settings
  const existingSettings = db.select().from(schema.settings).where(eq(schema.settings.id, 'default')).all();
  if (existingSettings.length === 0) {
    console.log('[Seed] Seeding settings...');
    db.insert(schema.settings).values({
      id: 'default',
      data: JSON.stringify(initialSettings),
      updatedAt: new Date().toISOString(),
    }).run();
  }

  console.log('[Seed] Database initialization completed successfully.');
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
