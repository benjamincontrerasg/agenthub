import { describe, it, expect, beforeEach } from 'vitest';
import {
  workflowsService,
  setMockMode,
  resetMockWorkflows,
} from '../workflows.service';

describe('Workflows Service (Mock Mode & Operations)', () => {
  beforeEach(() => {
    setMockMode(true);
    resetMockWorkflows();
  });

  it('retrieves all mock workflows', async () => {
    const list = await workflowsService.getWorkflows();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const first = list[0];
    expect(first.id).toBeDefined();
    expect(first.nodes.length).toBeGreaterThan(0);
  });

  it('saves and updates a workflow', async () => {
    const list = await workflowsService.getWorkflows();
    const first = list[0];

    const updated = await workflowsService.saveWorkflow({
      ...first,
      name: 'Flujo CI/CD Optimizado',
    });

    expect(updated.name).toBe('Flujo CI/CD Optimizado');

    const fetched = await workflowsService.getWorkflowById(first.id);
    expect(fetched.name).toBe('Flujo CI/CD Optimizado');
  });

  it('executes a workflow returning executionId', async () => {
    const list = await workflowsService.getWorkflows();
    const first = list[0];

    const res = await workflowsService.executeWorkflow(first.id);
    expect(res.executionId).toBeDefined();
  });

  it('deletes a workflow', async () => {
    const listBefore = await workflowsService.getWorkflows();
    const toDelete = listBefore[0];

    const res = await workflowsService.deleteWorkflow(toDelete.id);
    expect(res.success).toBe(true);

    const listAfter = await workflowsService.getWorkflows();
    expect(listAfter.some((w) => w.id === toDelete.id)).toBe(false);
  });
});
