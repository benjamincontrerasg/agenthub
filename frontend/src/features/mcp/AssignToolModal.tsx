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
import { useAgentsStore } from '@/stores/agents.store';
import { useMCPStore } from '@/stores/mcp.store';
import { Wrench, Bot, Check, ShieldAlert } from 'lucide-react';

interface AssignToolModalProps {
  tool: MCPTool | null;
  open: boolean;
  onClose: () => void;
}

export const AssignToolModal: React.FC<AssignToolModalProps> = ({ tool, open, onClose }) => {
  const { agents } = useAgentsStore();
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
            <Wrench className="h-4 w-4 text-amber-400" />
            <DialogTitle>Asignar Herramienta: {tool.name}</DialogTitle>
          </div>
          <DialogDescription>
            Selecciona qué agentes tendrán autorización para invocar esta herramienta durante la resolución de tareas.
          </DialogDescription>
        </DialogHeader>

        {tool.isWriteOperation && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
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
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isAssigned
                    ? 'border-violet-600/70 bg-violet-950/25'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className={`h-4 w-4 ${isAssigned ? 'text-violet-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-semibold text-slate-200 block">{agent.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{agent.role}</span>
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
