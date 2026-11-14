import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/features/agents/hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { X, Trash2, Settings, ShieldAlert } from 'lucide-react';

interface NodeConfigDrawerProps {
  selectedNode: any;
  onClose: () => void;
  onUpdate: (nodeId: string, updatedData: any) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  selectedNode,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { data: agents = [] } = useAgents();
  const { getAllTools } = useMCPStore();
  const allTools = getAllTools();

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const nodeType = data.nodeType || 'agent';

  const handleChange = (key: string, value: any) => {
    onUpdate(selectedNode.id, {
      ...data,
      [key]: value,
    });
  };

  return (
    <div className="absolute right-4 top-20 bottom-4 z-20 w-80 sm:w-96 rounded-2xl border border-border-default bg-bg-card/95 p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div className="space-y-4 overflow-y-auto pr-1">
        <div className="flex items-center justify-between pb-3 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-fg-brand" />
            <h3 className="text-body font-semibold text-fg-primary">Configurar Nodo</h3>
            <Badge variant="outline" className="text-caption font-mono capitalize">
              {nodeType}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-fg-secondary hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="block text-caption font-medium text-fg-secondary mb-1">
            Nombre / Etiqueta del Nodo
          </label>
          <Input
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-fg-secondary mb-1">
            Descripción
          </label>
          <Textarea
            rows={2}
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        {/* Dynamic configuration according to node type */}
        {nodeType === 'agent' && (
          <div>
            <label className="block text-caption font-medium text-fg-secondary mb-1">
              Agente Autónomo Responsable
            </label>
            <Select
              value={data.agentId || ''}
              onChange={(e) => handleChange('agentId', e.target.value)}
            >
              <option value="">Selecciona un agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </Select>
          </div>
        )}

        {nodeType === 'mcp_tool' && (
          <div>
            <label className="block text-caption font-medium text-fg-secondary mb-1">
              Herramienta MCP
            </label>
            <Select
              value={data.toolId || ''}
              onChange={(e) => handleChange('toolId', e.target.value)}
            >
              <option value="">Selecciona herramienta MCP...</option>
              {allTools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.serverName})
                </option>
              ))}
            </Select>
          </div>
        )}

        {nodeType === 'condition' && (
          <div>
            <label className="block text-caption font-medium text-fg-secondary mb-1">
              Expresión de Evaluación Lógica
            </label>
            <Input
              value={data.conditionExpr || ''}
              placeholder="ej. review.verdict === 'APPROVED'"
              onChange={(e) => handleChange('conditionExpr', e.target.value)}
            />
            <p className="mt-1 text-caption text-fg-secondary">
              Puerto True (arriba) si la expresión es verdadera, Puerto False (abajo) si es falsa.
            </p>
          </div>
        )}

        {nodeType === 'human_approval' && (
          <div className="p-3 rounded-lg bg-bg-warning/40 border border-fg-warning text-caption text-fg-warning space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-fg-warning">
              <ShieldAlert className="h-4 w-4" />
              Punto de Control Zero-Trust
            </div>
            <p className="text-caption text-fg-warning/80">
              La ejecución de este pipeline se pausará automáticamente al llegar a este nodo hasta que un operador humano otorgue autorización explícita.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border-default flex items-center justify-between">
        <Button
          variant="destructive"
          size="sm"
          className="text-caption"
          onClick={() => {
            onDelete(selectedNode.id);
            onClose();
          }}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar Nodo
        </Button>

        <Button variant="default" size="sm" className="text-caption" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
};

