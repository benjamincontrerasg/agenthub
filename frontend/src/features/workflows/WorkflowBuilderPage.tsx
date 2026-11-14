import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  StartNode,
  AgentNode,
  MCPToolNode,
  ConditionNode,
  ParallelNode,
  ApprovalNode,
  OutputNode,
  EndNode,
} from './nodes/CustomNodes';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useWorkflowsStore } from '@/stores/workflows.store';
import { useSaveWorkflow } from './hooks';
import { WorkflowNodeType } from '@/types';
import { generateId } from '@/lib/utils';
import {
  Play,
  Square,
  Save,
  Plus,
  Copy,
  Trash2,
  Bot,
  Wrench,
  GitBranch,
  Split,
  ShieldCheck,
  Package,
  Flag,
  Sparkles,
  Layers,
  Download,
} from 'lucide-react';
import { toast } from '@/stores/toast.store';

const nodeTypes = {
  startNode: StartNode,
  agentNode: AgentNode,
  mcpToolNode: MCPToolNode,
  conditionNode: ConditionNode,
  parallelNode: ParallelNode,
  approvalNode: ApprovalNode,
  outputNode: OutputNode,
  endNode: EndNode,
};

export const WorkflowBuilderPage: React.FC = () => {
  const {
    workflows,
    activeWorkflowId,
    setActiveWorkflowId,
    getActiveWorkflow,
    saveWorkflow,
    createWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    startSimulation,
    stopSimulation,
    isSimulating,
  } = useWorkflowsStore();
  const saveWorkflowMutation = useSaveWorkflow();

  const currentWorkflow = getActiveWorkflow();

  const [nodes, setNodes] = useState<Node[]>(currentWorkflow?.nodes as any || []);
  const [edges, setEdges] = useState<Edge[]>(currentWorkflow?.edges as any || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync state if active workflow changes
  React.useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes as any);
      setEdges(currentWorkflow.edges as any);
      setSelectedNode(null);
    }
  }, [currentWorkflow?.id]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds)
      ),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleAddNode = (type: WorkflowNodeType, label: string) => {
    const typeMapping: Record<WorkflowNodeType, string> = {
      start: 'startNode',
      agent: 'agentNode',
      mcp_tool: 'mcpToolNode',
      condition: 'conditionNode',
      parallel: 'parallelNode',
      human_approval: 'approvalNode',
      output: 'outputNode',
      end: 'endNode',
    };

    const newNode: Node = {
      id: generateId('node'),
      type: typeMapping[type] || 'agentNode',
      position: { x: 350 + Math.random() * 80, y: 220 + Math.random() * 80 },
      data: {
        label,
        nodeType: type,
        status: 'idle',
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  const handleUpdateNodeData = (nodeId: string, updatedData: any) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: updatedData } : n))
    );
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: updatedData } : prev));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const handleSave = () => {
    if (currentWorkflow) {
      saveWorkflow(currentWorkflow.id, nodes as any, edges as any);
      saveWorkflowMutation.mutate({
        ...currentWorkflow,
        nodes: nodes as any,
        edges: edges as any,
      });
      setSaveFeedback('✓ Guardado exitoso');
      setTimeout(() => setSaveFeedback(null), 2500);
    }
  };

  const handleDuplicate = () => {
    if (currentWorkflow) {
      const dup = duplicateWorkflow(currentWorkflow.id);
      if (dup) {
        toast.success('Workflow duplicado', `Copia creada: "${dup.name}"`);
      }
    }
  };

  const handleExportJson = () => {
    if (!currentWorkflow) return;
    const jsonStr = JSON.stringify({ ...currentWorkflow, nodes, edges }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkflow.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow exportado', 'Archivo JSON generado y descargado exitosamente.');
  };

  const handleNewWorkflow = () => {
    const name = prompt('Nombre del nuevo pipeline:', 'Nuevo Pipeline Multiagente');
    if (name) {
      createWorkflow(name, 'Pipeline autónomo diseñado con React Flow');
    }
  };

  // Run Visual Simulation
  const handleRunSimulation = async () => {
    if (!currentWorkflow || isSimulating) return;

    // Reset nodes status
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle' },
      }))
    );

    await startSimulation(currentWorkflow.id, (nodeId, status) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status } } : n))
      );
    });
  };

  return (
    <div className="relative h-[calc(100vh-8.5rem)] w-full rounded-2xl border border-border-default bg-bg-card overflow-hidden shadow-2xl flex flex-col">
      {/* Top Toolbar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border-default/90 bg-bg-card/90 px-4 py-2.5 backdrop-blur-md">
        {/* Workflow Switcher & Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 font-bold text-body text-fg-primary">
            <Layers className="h-4 w-4 text-fg-brand" />
            <span className="hidden sm:inline">Pipeline:</span>
          </div>

          <div className="w-56 sm:w-80">
            <Select
              value={activeWorkflowId}
              onChange={(e) => setActiveWorkflowId(e.target.value)}
              className="text-caption h-8"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.version})
                </option>
              ))}
            </Select>
          </div>

          <Badge variant="outline" className="text-caption hidden md:inline-flex">
            v{currentWorkflow?.version || '1.0.0'}
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {saveFeedback && (
            <span className="text-caption font-mono text-fg-success font-semibold animate-in fade-in">
              {saveFeedback}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-caption h-8"
            onClick={handleSave}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Guardar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-caption h-8"
            onClick={handleDuplicate}
            title="Duplicar Workflow"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-caption h-8"
            onClick={handleExportJson}
            title="Exportar Workflow como JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-caption h-8 text-fg-brand"
            onClick={handleNewWorkflow}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Nuevo
          </Button>

          {/* Simulation Toggle */}
          {!isSimulating ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleRunSimulation}
              className="bg-fg-success hover:bg-emerald-500 text-caption h-8 shadow-md shadow-emerald-700/20"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
              Simular Ejecución
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopSimulation}
              className="text-caption h-8 animate-pulse"
            >
              <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
              Detener
            </Button>
          )}
        </div>
      </div>

      {/* Floating Node Palette */}
      <div className="absolute left-4 top-16 z-20 hidden md:flex flex-col gap-1.5 p-2 rounded-xl border border-border-default bg-bg-card/90 shadow-xl backdrop-blur-md">
        <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary px-2 py-0.5">
          Agregar Nodos
        </span>

        <button
          onClick={() => handleAddNode('agent', 'AI Agent')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Bot className="h-3.5 w-3.5 text-fg-brand" />
          <span>AI Agent</span>
        </button>

        <button
          onClick={() => handleAddNode('mcp_tool', 'MCP Tool')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Wrench className="h-3.5 w-3.5 text-fg-warning" />
          <span>MCP Tool</span>
        </button>

        <button
          onClick={() => handleAddNode('condition', 'Condición')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <GitBranch className="h-3.5 w-3.5 text-fg-brand" />
          <span>Condition</span>
        </button>

        <button
          onClick={() => handleAddNode('parallel', 'Paralelo')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Split className="h-3.5 w-3.5 text-purple-400" />
          <span>Parallel</span>
        </button>

        <button
          onClick={() => handleAddNode('human_approval', 'Human Approval')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-fg-warning" />
          <span>Human Approval</span>
        </button>

        <button
          onClick={() => handleAddNode('output', 'Output')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Package className="h-3.5 w-3.5 text-fg-brand" />
          <span>Output</span>
        </button>

        <button
          onClick={() => handleAddNode('end', 'End Pipeline')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-medium text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Flag className="h-3.5 w-3.5 text-fg-error" />
          <span>End</span>
        </button>
      </div>

      {/* Main React Flow Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes as any}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#1e293b" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-white fill-white" />
          <MiniMap
            nodeStrokeColor="#64748b"
            nodeColor="#334155"
            className="!bg-slate-950/80 !border-slate-800 rounded-lg overflow-hidden"
          />
        </ReactFlow>
      </div>

      {/* Node Config Drawer (when a node is clicked) */}
      {selectedNode && (
        <NodeConfigDrawer
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdateNodeData}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  );
};
