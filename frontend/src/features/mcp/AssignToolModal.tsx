import React from 'react';
import { MCPTool } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/features/agents/hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { Wrench, Bot, Check, ShieldAlert } from 'lucide-react';

interface AssignToolModalProps {
  tool: MCPTool | null;
  open: boolean;
  onClose: () => void;
}

export const AssignToolModal: React.FC<AssignToolModalProps> = ({ tool, open, onClose }) => {
  const { data: agents = [] } = useAgents();
  const { assignToolToAgent, removeToolFromAgent } = useMCPStore();

  if (!tool) return null;

  const handleToggle = (agentId: string) => {
    if (tool.assignedAgentIds.includes(agentId)) {
      removeToolFromAgent(tool.id, agentId);
    } else {
      assignToolToAgent(tool.id, agentId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-fg-warning" />
            <DialogTitle>Asignar Herramienta: {tool.name}</DialogTitle>
          </div>
          <DialogDescription>
            Selecciona qué agentes tendrán autorización para invocar esta herramienta durante la resolución de tareas.
          </DialogDescription>
        </DialogHeader>

        {tool.isWriteOperation && (
          <div className="mb-3 p-2.5 rounded-[6px] bg-bg-warning/40 border border-fg-warning text-caption text-fg-warning flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-fg-warning" />
            <span>
              <strong>Herramienta de Escritura:</strong> Las llamadas generadas requerirán confirmación humana antes de ser ejecutadas.
            </span>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {agents.map((agent) => {
            const isAssigned = tool.assignedAgentIds.includes(agent.id);
            return (
              <div
                key={agent.id}
                onClick={() => handleToggle(agent.id)}
                className={`flex items-center justify-between p-2.5 rounded-[6px] border text-caption cursor-pointer transition-colors ${
                  isAssigned
                    ? 'border-border-brand/70 bg-bg-brand-subtle/25'
                    : 'border-border-default bg-bg-card/50 hover:border-[#23252a]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className={`h-4 w-4 ${isAssigned ? 'text-fg-brand' : 'text-fg-muted'}`} />
                  <div>
                    <span className="font-[510] text-fg-primary block">{agent.name}</span>
                    <span className="text-caption text-fg-secondary font-mono">{agent.role}</span>
                  </div>
                </div>

                <Badge variant={isAssigned ? 'default' : 'outline'}>
                  {isAssigned ? <Check className="h-3 w-3 mr-1" /> : null}
                  {isAssigned ? 'Asignado' : 'Sin acceso'}
                </Badge>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="default" size="sm" onClick={onClose}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

