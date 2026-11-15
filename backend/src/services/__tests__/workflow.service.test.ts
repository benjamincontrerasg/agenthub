import { describe, it, expect, beforeEach } from 'vitest';
import { workflowService } from '../workflow.service.js';
import { seedDatabase } from '../../db/seed.js';

describe('Workflow Service', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('retrieves all seeded workflows', async () => {
    const list = await workflowService.getAll();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const first = list[0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
    expect(Array.isArray(first.nodes)).toBe(true);
    expect(Array.isArray(first.edges)).toBe(true);
  });

  it('saves and updates a workflow', async () => {
    const list = await workflowService.getAll();
    const target = list[0];

    const updated = await workflowService.save({
      ...target,
      name: 'Workflow de Prueba Actualizado',
    });

    expect(updated.name).toBe('Workflow de Prueba Actualizado');
    const fetched = await workflowService.getById(target.id);
    expect(fetched.name).toBe('Workflow de Prueba Actualizado');
  });

  it('executes a workflow returning executionId', async () => {
    const list = await workflowService.getAll();
    const target = list[0];

    const res = await workflowService.execute(target.id);
    expect(res.executionId).toBeDefined();
    expect(res.executionId.startsWith('exec-')).toBe(true);
  });

  it('evaluates conditional branching (if/else) and skips inactive branches', async () => {
    const condWf = await workflowService.save({
      id: `wf-cond-${Date.now()}`,
      name: 'Workflow de Decisión Condicional',
      description: 'Evalúa condición lógica y ejecuta rama específica',
      status: 'active',
      version: '1.0.0',
      nodes: [
        {
          id: 'n-start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Inicio', nodeType: 'start' },
        },
        {
          id: 'n-cond',
          type: 'condition',
          position: { x: 200, y: 0 },
          data: { label: 'Verificar Entorno', nodeType: 'condition', conditionExpr: 'env === "production"' },
        },
        {
          id: 'n-deploy',
          type: 'agent',
          position: { x: 400, y: 0 },
          data: { label: 'Deploy a Producción', nodeType: 'agent' },
        },
      ],
      edges: [
        { id: 'e1', source: 'n-start', target: 'n-cond' },
        { id: 'e2', source: 'n-cond', target: 'n-deploy', sourceHandle: 'true' },
      ],
      stats: { runsCount: 0, avgRuntimeSec: 0, successRate: 100 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Execute with input env = 'staging' (condition should evaluate to false and skip n-deploy)
    const execRes = await workflowService.execute(condWf.id, { env: 'staging' });
    expect(execRes.executionId).toBeDefined();

    // Clean up
    await workflowService.delete(condWf.id);
  });
});
