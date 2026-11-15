import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Workflow, WorkflowExecution } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { wsManager } from './websocket.service.js';

function evaluateCondition(expr: string | undefined, context: Record<string, any>): boolean {
  if (!expr || expr.trim() === '') return true;
  const clean = expr.trim();

  try {
    if (clean.includes('===')) {
      const [left, right] = clean.split('===').map((s) => s.trim().replace(/['"]/g, ''));
      const val = context[left] !== undefined ? context[left] : left;
      return String(val) === right;
    }
    if (clean.includes('==')) {
      const [left, right] = clean.split('==').map((s) => s.trim().replace(/['"]/g, ''));
      const val = context[left] !== undefined ? context[left] : left;
      return String(val) === right;
    }
    if (clean.includes('!==')) {
      const [left, right] = clean.split('!==').map((s) => s.trim().replace(/['"]/g, ''));
      const val = context[left] !== undefined ? context[left] : left;
      return String(val) !== right;
    }
    if (clean.includes('>')) {
      const [left, right] = clean.split('>').map((s) => s.trim());
      const val = Number(context[left] !== undefined ? context[left] : left);
      return val > Number(right);
    }
    if (clean.includes('<')) {
      const [left, right] = clean.split('<').map((s) => s.trim());
      const val = Number(context[left] !== undefined ? context[left] : left);
      return val < Number(right);
    }
    if (clean.toLowerCase() === 'false') return false;
    if (clean.toLowerCase() === 'true') return true;
    return Boolean(context[clean]);
  } catch {
    return true;
  }
}

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
    const context: Record<string, any> = { ...(inputs || {}) };
    const skippedNodeIds = new Set<string>();

    // Traverse nodes sequentially with conditional branching support
    for (let i = 0; i < wf.nodes.length; i++) {
      const node = wf.nodes[i];
      const stepId = `step-${executionId}-${i + 1}`;
      const stepStart = new Date().toISOString();

      const isSkipped = skippedNodeIds.has(node.id);
      const isCondition = node.data?.nodeType === 'condition' || node.type === 'condition';
      const isAgentNode = node.data?.nodeType === 'agent' || node.type === 'agent';

      if (isSkipped) {
        db.insert(schema.executionSteps).values({
          id: stepId,
          executionId,
          nodeId: node.id,
          name: node.data.label,
          type: node.data?.nodeType || (node.type as string) || 'task',
          agentOrToolName: node.data.agentId || node.data.toolId || 'Workflow Engine',
          status: 'skipped',
          startedAt: stepStart,
          completedAt: stepStart,
          durationMs: 0,
          tokensUsed: 0,
          outputSummary: `Nodo omitido por evaluación de bifurcación condicional.`,
          logs: JSON.stringify([`Nodo '${node.data.label}' omitido por no cumplir la condición de ejecución previa.`]),
        }).run();

        // Propagar estado omitido a dependientes directos
        for (const edge of wf.edges) {
          if (edge.source === node.id) {
            skippedNodeIds.add(edge.target);
          }
        }
        continue;
      }

      wsManager.broadcast('workflow.progress', {
        executionId,
        workflowId: wf.id,
        status: 'running',
        activeNodeId: node.id,
        nodeLabel: node.data.label,
        stepIndex: i + 1,
        totalSteps: wf.nodes.length,
      });

      let conditionResult = true;
      let outputSummary = `Nodo '${node.data.label}' completado exitosamente con estado OK.`;
      const stepLogs = [
        `Iniciando ejecución de nodo: ${node.data.label}`,
        `Evaluando dependencias y contexto...`,
      ];

      if (isCondition) {
        conditionResult = evaluateCondition(node.data?.conditionExpr, context);
        context[node.id] = { result: conditionResult };
        outputSummary = `Bifurcación condicional evaluada como ${conditionResult ? 'TRUE (Verdadero)' : 'FALSE (Falso)'}.`;
        stepLogs.push(`Expresión: "${node.data?.conditionExpr || 'default'}" -> Resultado: ${conditionResult}`);
        stepLogs.push(`Dirigiendo flujo a rama correspondiente.`);

        // Ajustar ramas omitidas según condición
        for (const edge of wf.edges) {
          if (edge.source === node.id) {
            const handle = (edge.sourceHandle || (edge as any).label || '').toLowerCase();
            if (handle.includes('false') || handle.includes('no')) {
              if (conditionResult) skippedNodeIds.add(edge.target);
            } else if (handle.includes('true') || handle.includes('si') || handle.includes('yes')) {
              if (!conditionResult) skippedNodeIds.add(edge.target);
            }
          }
        }
      } else {
        context[node.id] = { status: 'completed' };
        stepLogs.push(`Resultado generado correctamente.`);
      }

      // Insert step
      db.insert(schema.executionSteps).values({
        id: stepId,
        executionId,
        nodeId: node.id,
        name: node.data.label,
        type: node.data?.nodeType || (node.type as string) || 'task',
        agentOrToolName: node.data.agentId || node.data.toolId || 'Workflow Engine',
        status: 'completed',
        startedAt: stepStart,
        completedAt: new Date().toISOString(),
        durationMs: 800 + Math.floor(Math.random() * 400),
        tokensUsed: isAgentNode ? 1200 : 0,
        outputSummary,
        logs: JSON.stringify(stepLogs),
      }).run();

      if (isAgentNode) {
        currentTokens += 1200;
      }
      if (node.data.toolId) {
        toolsUsed.push(node.data.toolId);
      }

      // Pausa breve entre nodos
      await new Promise((resolve) => setTimeout(resolve, 300));
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

    // Cascade delete any executions and steps for this workflow
    const execs = db.select().from(schema.workflowExecutions).where(eq(schema.workflowExecutions.workflowId, id)).all();
    for (const exec of execs) {
      db.delete(schema.executionSteps).where(eq(schema.executionSteps.executionId, exec.id)).run();
    }
    db.delete(schema.workflowExecutions).where(eq(schema.workflowExecutions.workflowId, id)).run();

    db.delete(schema.workflows).where(eq(schema.workflows.id, id)).run();
    return { success: true };
  },
};
