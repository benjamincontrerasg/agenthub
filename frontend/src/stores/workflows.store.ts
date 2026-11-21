import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workflow, WorkflowNode, WorkflowEdge } from '@/types';
import { initialWorkflows } from '@/services/mock-data';
import { generateId } from '@/lib/utils';

interface WorkflowsState {
  workflows: Workflow[];
  activeWorkflowId: string;
  isSimulating: boolean;
  activeExecutionNodeId: string | null;
  setActiveWorkflowId: (id: string) => void;
  getActiveWorkflow: () => Workflow | undefined;
  saveWorkflow: (id: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  createWorkflow: (name: string, description: string) => Workflow;
  duplicateWorkflow: (id: string) => Workflow | undefined;
  deleteWorkflow: (id: string) => void;
  startSimulation: (workflowId: string, onProgress?: (nodeId: string, status: string) => void) => Promise<void>;
  stopSimulation: () => void;
}

export const useWorkflowsStore = create<WorkflowsState>()(
  persist(
    (set, get) => ({
      workflows: initialWorkflows,
      activeWorkflowId: 'wf-cicd-dev-review',
      isSimulating: false,
      activeExecutionNodeId: null,

      setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

      getActiveWorkflow: () => {
        const { workflows, activeWorkflowId } = get();
        return workflows.find((w) => w.id === activeWorkflowId) || workflows[0];
      },

      saveWorkflow: (id, nodes, edges) => {
        set((state) => ({
          workflows: state.workflows.map((wf) =>
            wf.id === id
              ? {
                  ...wf,
                  nodes,
                  edges,
                  updatedAt: new Date().toISOString(),
                }
              : wf
          ),
        }));
      },

      createWorkflow: (name, description) => {
        const newWf: Workflow = {
          id: generateId('wf'),
          name,
          description,
          version: '1.0.0',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [
            {
              id: 'node-start',
              type: 'startNode',
              position: { x: 100, y: 200 },
              data: { label: 'Start', nodeType: 'start' },
            },
            {
              id: 'node-end',
              type: 'endNode',
              position: { x: 600, y: 200 },
              data: { label: 'End', nodeType: 'end' },
            },
          ],
          edges: [
            { id: 'e-1', source: 'node-start', target: 'node-end', animated: true },
          ],
        };

        set((state) => ({
          workflows: [...state.workflows, newWf],
          activeWorkflowId: newWf.id,
        }));

        return newWf;
      },

      duplicateWorkflow: (id) => {
        const target = get().workflows.find((w) => w.id === id);
        if (!target) return undefined;

        const duplicated: Workflow = {
          ...target,
          id: generateId('wf'),
          name: `${target.name} (Copia)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        };

        set((state) => ({
          workflows: [...state.workflows, duplicated],
          activeWorkflowId: duplicated.id,
        }));

        return duplicated;
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          activeWorkflowId: state.activeWorkflowId === id ? (state.workflows[0]?.id || '') : state.activeWorkflowId,
        }));
      },

      startSimulation: async (workflowId, onProgress) => {
        const target = get().workflows.find((w) => w.id === workflowId);
        if (!target) return;

        set({ isSimulating: true });

        // ── Dynamic graph traversal ──
        // Build adjacency map from edges
        const adjacency: Record<string, string[]> = {};
        for (const edge of target.edges) {
          if (!adjacency[edge.source]) adjacency[edge.source] = [];
          adjacency[edge.source].push(edge.target);
        }

        // Find start node(s): nodes with nodeType 'start', or nodes with no incoming edges
        const incomingNodes = new Set(target.edges.map((e) => e.target));
        let startNodeIds = target.nodes
          .filter((n) => n.data.nodeType === 'start')
          .map((n) => n.id);

        if (startNodeIds.length === 0) {
          // Fallback: nodes that have no incoming edges
          startNodeIds = target.nodes
            .filter((n) => !incomingNodes.has(n.id))
            .map((n) => n.id);
        }

        if (startNodeIds.length === 0 && target.nodes.length > 0) {
          startNodeIds = [target.nodes[0].id];
        }

        // BFS-based traversal to respect topological order
        const visited = new Set<string>();
        const queue: string[] = [...startNodeIds];

        while (queue.length > 0 && get().isSimulating) {
          const nodeId = queue.shift()!;
          if (visited.has(nodeId)) continue;
          visited.add(nodeId);

          // Verify node exists in the workflow
          const nodeExists = target.nodes.some((n) => n.id === nodeId);
          if (!nodeExists) continue;

          set({ activeExecutionNodeId: nodeId });
          onProgress?.(nodeId, 'running');

          // Simulate step duration (variable based on node type)
          const nodeData = target.nodes.find((n) => n.id === nodeId)?.data;
          const delay = nodeData?.nodeType === 'start' || nodeData?.nodeType === 'end'
            ? 600
            : nodeData?.nodeType === 'condition'
              ? 800
              : 1200;
          await new Promise((r) => setTimeout(r, delay));

          onProgress?.(nodeId, 'completed');

          // Enqueue successors
          const successors = adjacency[nodeId] || [];
          for (const succ of successors) {
            if (!visited.has(succ)) {
              queue.push(succ);
            }
          }
        }

        set({ isSimulating: false, activeExecutionNodeId: null });
      },

      stopSimulation: () => {
        set({ isSimulating: false, activeExecutionNodeId: null });
      },
    }),
    {
      name: 'NEXORA-workflows-storage',
      partialize: (state) => ({ workflows: state.workflows }),
    }
  )
);

