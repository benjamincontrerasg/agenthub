import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, value: string) => {
    memoryStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },
  get length() {
    return Object.keys(memoryStore).length;
  },
  key: (i: number) => Object.keys(memoryStore)[i] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}

import { useWorkflowsStore } from '../workflows.store';

describe('Workflows Store - Dynamic Simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ejecuta la simulación dinámica recorriendo los nodos según la topología de bordes', async () => {
    const customWf = useWorkflowsStore.getState().createWorkflow('Test Dynamic Wf', 'Testing dynamic traversal');
    
    // Create custom nodes and edges
    const nodes = [
      { id: 'start-1', type: 'startNode', position: { x: 0, y: 0 }, data: { label: 'Start', nodeType: 'start' as const } },
      { id: 'node-a', type: 'agentNode', position: { x: 100, y: 0 }, data: { label: 'Agent A', nodeType: 'agent' as const } },
      { id: 'end-1', type: 'endNode', position: { x: 200, y: 0 }, data: { label: 'End', nodeType: 'end' as const } },
    ];
    const edges = [
      { id: 'e1', source: 'start-1', target: 'node-a' },
      { id: 'e2', source: 'node-a', target: 'end-1' },
    ];

    useWorkflowsStore.getState().saveWorkflow(customWf.id, nodes, edges);

    const executedNodes: string[] = [];
    const simPromise = useWorkflowsStore.getState().startSimulation(customWf.id, (nodeId, status) => {
      if (status === 'running') {
        executedNodes.push(nodeId);
      }
    });

    // Advance timers for start-1 (600ms)
    await vi.advanceTimersByTimeAsync(700);
    expect(executedNodes).toContain('start-1');

    // Advance timers for node-a (1200ms)
    await vi.advanceTimersByTimeAsync(1300);
    expect(executedNodes).toContain('node-a');

    // Advance timers for end-1 (600ms)
    await vi.advanceTimersByTimeAsync(700);
    expect(executedNodes).toContain('end-1');

    await simPromise;

    expect(executedNodes).toEqual(['start-1', 'node-a', 'end-1']);
    expect(useWorkflowsStore.getState().isSimulating).toBe(false);
  });

  it('permite detener la simulación en cualquier momento', async () => {
    const customWf = useWorkflowsStore.getState().createWorkflow('Test Stop Wf', 'Testing stop simulation');
    const simPromise = useWorkflowsStore.getState().startSimulation(customWf.id);

    expect(useWorkflowsStore.getState().isSimulating).toBe(true);
    useWorkflowsStore.getState().stopSimulation();

    expect(useWorkflowsStore.getState().isSimulating).toBe(false);
    expect(useWorkflowsStore.getState().activeExecutionNodeId).toBeNull();

    // Advance any pending timer so the loop promise can exit
    await vi.advanceTimersByTimeAsync(1500);
    await simPromise;
  });
});
