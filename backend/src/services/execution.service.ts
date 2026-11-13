import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { WorkflowExecution, ExecutionStep, ExecutionLog } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { wsManager } from './websocket.service.js';

export const executionService = {
  async getAll(): Promise<WorkflowExecution[]> {
    const list = db.select().from(schema.workflowExecutions).all();
    const allSteps = db.select().from(schema.executionSteps).all();
    const allLogs = db.select().from(schema.executionLogs).all();

    return list.map((e) => {
      let toolsUsed: string[] = [];
      try {
        toolsUsed = JSON.parse(e.toolsUsed);
      } catch {}

      const steps: ExecutionStep[] = allSteps
        .filter((s) => s.executionId === e.id)
        .map((s) => {
          let logs: string[] | undefined;
          try {
            if (s.logs) logs = JSON.parse(s.logs);
          } catch {}

          return {
            id: s.id,
            nodeId: s.nodeId ?? undefined,
            name: s.name,
            type: s.type,
            agentOrToolName: s.agentOrToolName ?? undefined,
            status: s.status as any,
            startedAt: s.startedAt,
            completedAt: s.completedAt ?? undefined,
            durationMs: s.durationMs ?? undefined,
            tokensUsed: s.tokensUsed ?? undefined,
            outputSummary: s.outputSummary ?? undefined,
            logs,
            error: s.error ?? undefined,
          };
        })
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

      const logs: ExecutionLog[] = allLogs
        .filter((l) => l.executionId === e.id)
        .map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          level: l.level as any,
          source: l.source,
          message: l.message,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowName,
        status: e.status as any,
        startedAt: e.startedAt,
        finishedAt: e.finishedAt ?? undefined,
        durationMs: e.durationMs ?? undefined,
        triggeredBy: e.triggeredBy,
        totalTokens: e.totalTokens,
        estimatedCostUsd: e.estimatedCostUsd,
        responsibleAgentId: e.responsibleAgentId ?? undefined,
        responsibleAgentName: e.responsibleAgentName ?? undefined,
        toolsUsed,
        steps,
        logs,
        errorMessage: e.errorMessage ?? undefined,
      };
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  async getById(id: string): Promise<WorkflowExecution> {
    const e = db.select().from(schema.workflowExecutions).where(eq(schema.workflowExecutions.id, id)).get();
    if (!e) {
      throw new NotFoundError('Ejecución', id);
    }

    const stepsRaw = db.select().from(schema.executionSteps).where(eq(schema.executionSteps.executionId, id)).all();
    const logsRaw = db.select().from(schema.executionLogs).where(eq(schema.executionLogs.executionId, id)).all();

    let toolsUsed: string[] = [];
    try {
      toolsUsed = JSON.parse(e.toolsUsed);
    } catch {}

    const steps: ExecutionStep[] = stepsRaw.map((s) => {
      let stepLogs: string[] | undefined;
      try {
        if (s.logs) stepLogs = JSON.parse(s.logs);
      } catch {}

      return {
        id: s.id,
        nodeId: s.nodeId ?? undefined,
        name: s.name,
        type: s.type,
        agentOrToolName: s.agentOrToolName ?? undefined,
        status: s.status as any,
        startedAt: s.startedAt,
        completedAt: s.completedAt ?? undefined,
        durationMs: s.durationMs ?? undefined,
        tokensUsed: s.tokensUsed ?? undefined,
        outputSummary: s.outputSummary ?? undefined,
        logs: stepLogs,
        error: s.error ?? undefined,
      };
    });

    const logs: ExecutionLog[] = logsRaw.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      level: l.level as any,
      source: l.source,
      message: l.message,
    }));

    return {
      id: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      status: e.status as any,
      startedAt: e.startedAt,
      finishedAt: e.finishedAt ?? undefined,
      durationMs: e.durationMs ?? undefined,
      triggeredBy: e.triggeredBy,
      totalTokens: e.totalTokens,
      estimatedCostUsd: e.estimatedCostUsd,
      responsibleAgentId: e.responsibleAgentId ?? undefined,
      responsibleAgentName: e.responsibleAgentName ?? undefined,
      toolsUsed,
      steps,
      logs,
      errorMessage: e.errorMessage ?? undefined,
    };
  },

  async cancel(id: string): Promise<{ success: boolean }> {
    const e = db.select().from(schema.workflowExecutions).where(eq(schema.workflowExecutions.id, id)).get();
    if (!e) {
      throw new NotFoundError('Ejecución', id);
    }

    const now = new Date().toISOString();

    db.update(schema.workflowExecutions)
      .set({
        status: 'failed',
        finishedAt: now,
        errorMessage: 'Ejecución cancelada por el usuario.',
      })
      .where(eq(schema.workflowExecutions.id, id))
      .run();

    wsManager.broadcast('workflow.progress', {
      executionId: id,
      workflowId: e.workflowId,
      status: 'failed',
      message: 'Ejecución cancelada manualmente.',
    });

    return { success: true };
  },
};
