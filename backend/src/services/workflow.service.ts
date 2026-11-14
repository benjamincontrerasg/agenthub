import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Workflow, WorkflowExecution } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { wsManager } from './websocket.service.js';

export const workflowService = {
  async getAll(): Promise<Workflow[]> {
    const list = db.select().from(schema.workflows).all();

    return list.map((w) => {
      let nodes = [];
      let edges = [];
      try {
        nodes = JSON.parse(w.nodes);
        edges = JSON.parse(w.edges);
      } catch {}

      return {
        id: w.id,
        name: w.name,
        description: w.description,
        version: w.version,
        nodes,
        edges,
        status: w.status as any,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        lastExecutedAt: w.lastExecutedAt ?? undefined,
        stats: {
          runsCount: w.runsCount,
          avgRuntimeSec: w.avgRuntimeSec,
          successRate: w.successRate,
        },
      };
    });
  },

  async getById(id: string): Promise<Workflow> {
    const w = db.select().from(schema.workflows).where(eq(schema.workflows.id, id)).get();
    if (!w) {
      throw new NotFoundError('Workflow', id);
    }

    let nodes = [];
    let edges = [];
    try {
      nodes = JSON.parse(w.nodes);
      edges = JSON.parse(w.edges);
    } catch {}

    return {
      id: w.id,
      name: w.name,
      description: w.description,
      version: w.version,
      nodes,
      edges,
      status: w.status as any,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      lastExecutedAt: w.lastExecutedAt ?? undefined,
      stats: {
        runsCount: w.runsCount,
        avgRuntimeSec: w.avgRuntimeSec,
        successRate: w.successRate,
      },
    };
  },

  async save(workflow: Workflow): Promise<Workflow> {
    const existing = db.select().from(schema.workflows).where(eq(schema.workflows.id, workflow.id)).get();
    const now = new Date().toISOString();

    if (existing) {
      db.update(schema.workflows)
        .set({
          name: workflow.name,
          description: workflow.description,
          version: workflow.version,
          nodes: JSON.stringify(workflow.nodes),
          edges: JSON.stringify(workflow.edges),
          status: workflow.status,
          updatedAt: now,
        })
        .where(eq(schema.workflows.id, workflow.id))
        .run();
    } else {
      db.insert(schema.workflows).values({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        nodes: JSON.stringify(workflow.nodes),
        edges: JSON.stringify(workflow.edges),
        status: workflow.status,
        runsCount: 0,
        avgRuntimeSec: 0,
        successRate: 100,
        createdAt: now,
        updatedAt: now,
      }).run();
    }

    return this.getById(workflow.id);
  },

  async execute(id: string, inputs?: Record<string, any>): Promise<{ executionId: string }> {
    const wf = await this.getById(id);
    const executionId = `exec-${Date.now()}`;
    const startTime = new Date().toISOString();

    // Create execution record in DB
    db.insert(schema.workflowExecutions).values({
      id: executionId,
      workflowId: wf.id,
      workflowName: wf.name,
      status: 'running',
      startedAt: startTime,
      triggeredBy: 'API Operator / UI',
      totalTokens: 0,
      estimatedCostUsd: 0,
      responsibleAgentId: wf.nodes.find((n) => n.data.nodeType === 'agent')?.data.agentId ?? 'agent-coordinator',
      responsibleAgentName: 'Coordinator Agent',
      toolsUsed: JSON.stringify([]),
      errorMessage: null,
    }).run();

    // Create initial execution step
    db.insert(schema.executionSteps).values({
      id: `step-${Date.now()}-1`,
      executionId,
      nodeId: wf.nodes[0]?.id ?? 'node-start',
      name: wf.nodes[0]?.data.label ?? 'Inicio de Workflow',
      type: 'start',
      agentOrToolName: 'System Trigger',
      status: 'running',
      startedAt: startTime,
      logs: JSON.stringify(['Iniciando ejecución de grafo de workflow...']),
    }).run();

    // Broadcast starting event
    wsManager.broadcast('workflow.progress', {
      executionId,
      workflowId: wf.id,
      status: 'running',
      activeNodeId: wf.nodes[0]?.id,
      message: `Iniciando workflow: ${wf.name}`,
    });

    // Run async execution pipeline without blocking HTTP response
    this.runWorkflowAsync(wf, executionId, inputs).catch((err) => {
      console.error(`[Workflow Async Error] Execution ${executionId} failed:`, err);
    });

    return { executionId };
  },

  async runWorkflowAsync(wf: Workflow, executionId: string, inputs?: Record<string, any>) {
    let currentTokens = 0;
    const toolsUsed: string[] = [];

    // Traverse nodes sequentially
    for (let i = 0; i < wf.nodes.length; i++) {
      const node = wf.nodes[i];
      const stepId = `step-${executionId}-${i + 1}`;
      const stepStart = new Date().toISOString();

      wsManager.broadcast('workflow.progress', {
        executionId,
        workflowId: wf.id,
        status: 'running',
        activeNodeId: node.id,
        nodeLabel: node.data.label,
        stepIndex: i + 1,
        totalSteps: wf.nodes.length,
      });

      // Insert step
      db.insert(schema.executionSteps).values({
        id: stepId,
        executionId,
        nodeId: node.id,
        name: node.data.label,
        type: node.data.nodeType,
        agentOrToolName: node.data.agentId || node.data.toolId || 'Workflow Engine',
        status: 'completed',
        startedAt: stepStart,
        completedAt: new Date().toISOString(),
        durationMs: 800 + Math.floor(Math.random() * 400),
        tokensUsed: node.data.nodeType === 'agent' ? 1200 : 0,
        outputSummary: `Nodo '${node.data.label}' completado exitosamente con estado OK.`,
        logs: JSON.stringify([
          `Iniciando ejecución de nodo: ${node.data.label}`,
          `Evaluando dependencias y contexto...`,
          `Resultado generado correctamente.`,
        ]),
      }).run();

      if (node.data.nodeType === 'agent') {
        currentTokens += 1200;
      }
      if (node.data.toolId) {
        toolsUsed.push(node.data.toolId);
      }

      // Small pause between nodes for realistic progression
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const finishTime = new Date().toISOString();
    const durationMs = 600 * wf.nodes.length + 800;
    const costUsd = (currentTokens / 1_000_000) * 4.5;

    // Update execution status
    db.update(schema.workflowExecutions)
      .set({
        status: 'completed',
        finishedAt: finishTime,
        durationMs,
        totalTokens: currentTokens,
        estimatedCostUsd: costUsd,
        toolsUsed: JSON.stringify(toolsUsed),
      })
      .where(eq(schema.workflowExecutions.id, executionId))
      .run();

    // Update workflow stats
    db.update(schema.workflows)
      .set({
        runsCount: (wf.stats?.runsCount ?? 0) + 1,
        lastExecutedAt: finishTime,
      })
      .where(eq(schema.workflows.id, wf.id))
      .run();

    // Broadcast completion
    wsManager.broadcast('workflow.progress', {
      executionId,
      workflowId: wf.id,
      status: 'completed',
      message: `Workflow '${wf.name}' finalizado con éxito.`,
    });
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const existing = db.select().from(schema.workflows).where(eq(schema.workflows.id, id)).get();
    if (!existing) {
      throw new NotFoundError('Workflow', id);
    }

    db.delete(schema.workflows).where(eq(schema.workflows.id, id)).run();
    return { success: true };
  },
};
