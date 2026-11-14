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
});
