import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Agent, AgentRole } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useProvidersStore } from '@/stores/providers.store';
import { useMCPStore } from '@/stores/mcp.store';
import { useAgentsStore } from '@/stores/agents.store';

const agentSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  role: z.string().min(1, 'Selecciona un rol para el agente'),
  providerId: z.string().min(1, 'Selecciona un proveedor de IA'),
  modelId: z.string().min(1, 'Selecciona un modelo de inferencia'),
  systemPrompt: z.string().min(10, 'El prompt del sistema debe tener al menos 10 caracteres'),
  temperature: z.number().min(0).max(2),
  maxIterations: z.number().min(1).max(50),
  status: z.enum(['active', 'paused', 'idle', 'error']),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormModalProps {
  agent?: Agent | null;
  open: boolean;
  onClose: () => void;
}

export const AgentFormModal: React.FC<AgentFormModalProps> = ({ agent, open, onClose }) => {
  const { providers } = useProvidersStore();
  const { getAllTools } = useMCPStore();
  const { agents, addAgent, updateAgent } = useAgentsStore();

  const allTools = getAllTools();
  const otherAgents = agents.filter((a) => !agent || a.id !== agent.id);

  const [selectedTools, setSelectedTools] = React.useState<string[]>(
    agent?.allowedToolIds || []
  );
  const [selectedPeers, setSelectedPeers] = React.useState<string[]>(
    agent?.allowedAgentCommunicationIds || []
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      description: agent?.description || '',
      role: agent?.role || 'Developer',
      providerId: agent?.providerId || 'anthropic',
      modelId: agent?.modelId || 'claude-3-7-sonnet',
      systemPrompt: agent?.systemPrompt || '',
      temperature: agent?.temperature ?? 0.3,
      maxIterations: agent?.maxIterations ?? 15,
      status: (agent?.status as any) || 'active',
    },
  });

  const selectedProviderId = watch('providerId');
  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  React.useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description,
        role: agent.role,
        providerId: agent.providerId,
        modelId: agent.modelId,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxIterations: agent.maxIterations,
        status: (agent.status as any) || 'active',
      });
      setSelectedTools(agent.allowedToolIds || []);
      setSelectedPeers(agent.allowedAgentCommunicationIds || []);
    } else {
      reset({
        name: '',
        description: '',
        role: 'Developer',
        providerId: 'anthropic',
        modelId: 'claude-3-7-sonnet',
        systemPrompt: 'Eres un agente especializado en implementar código limpio y modular...',
        temperature: 0.3,
        maxIterations: 15,
        status: 'active',
      });
      setSelectedTools(['tool-fs-read', 'tool-fs-write']);
      setSelectedPeers(['agent-coordinator']);
    }
  }, [agent, reset]);

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const togglePeer = (peerId: string) => {
    setSelectedPeers((prev) =>
      prev.includes(peerId) ? prev.filter((id) => id !== peerId) : [...prev, peerId]
    );
  };

  const onSubmit = async (data: AgentFormData) => {
    if (agent) {
      updateAgent(agent.id, {
        ...data,
        allowedToolIds: selectedTools,
        allowedAgentCommunicationIds: selectedPeers,
      });
    } else {
      addAgent({
        ...data,
        allowedToolIds: selectedTools,
        allowedAgentCommunicationIds: selectedPeers,
        status: data.status,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {agent ? `Editar Agente: ${agent.name}` : 'Crear Nuevo Agente Autónomo'}
            </DialogTitle>
            <DialogDescription>
              Configura el rol, modelo de IA, prompts de ejecución, herramientas MCP y permisos de comunicación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Nombre del Agente
                </label>
                <Input
                  placeholder="ej. Performance Optimizer Agent"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Rol del Agente
                </label>
                <Select error={errors.role?.message} {...register('role')}>
                  <option value="Architect">Architect (Análisis y Diseño)</option>
                  <option value="Developer">Developer (Implementación y Tests)</option>
                  <option value="Reviewer">Reviewer (Auditoría y Seguridad)</option>
                  <option value="Research">Research (Investigación y Docs)</option>
                  <option value="Coordinator">Coordinator (Orquestación)</option>
                  <option value="Custom">Custom Role</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                Descripción del Propósito
              </label>
              <Input
                placeholder="Breve resumen de la responsabilidad en el equipo multiagente"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            {/* Provider and Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Proveedor de IA
                </label>
                <Select
                  {...register('providerId', {
                    onChange: (e) => {
                      const p = providers.find((pr) => pr.id === e.target.value);
                      if (p && p.models.length > 0) {
                        setValue('modelId', p.models[0].id);
                      }
                    },
                  })}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status === 'connected' ? 'Conectado' : 'Sin conectar'})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Modelo de Inferencia
                </label>
                <Select {...register('modelId')}>
                  {selectedProvider?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-caption font-medium text-fg-secondary">
                  System Prompt (Instrucciones de Personalidad y Metodología)
                </label>
                <span className="text-caption text-fg-secondary font-mono">Markdown soportado</span>
              </div>
              <Textarea
                rows={4}
                placeholder="Describe cómo debe razonar el agente, qué estándares seguir y qué límites respetar..."
                error={errors.systemPrompt?.message}
                {...register('systemPrompt')}
              />
            </div>

            {/* Hyperparameters: Temperature & Max Iterations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-3 rounded-lg bg-bg-card/60 border border-border-default">
              <div>
                <Controller
                  name="temperature"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <div className="flex justify-between items-center text-caption mb-2">
                        <span className="font-medium text-fg-secondary">Temperatura</span>
                        <span className="font-mono text-fg-brand font-semibold">{field.value.toFixed(2)}</span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <div className="flex justify-between text-caption text-fg-secondary mt-1">
                        <span>Preciso / Determinista</span>
                        <span>Creativo</span>
                      </div>
                    </div>
                  )}
                />
              </div>

              <div>
                <Controller
                  name="maxIterations"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <div className="flex justify-between items-center text-caption mb-2">
                        <span className="font-medium text-fg-secondary">Límite de Iteraciones (Loops)</span>
                        <span className="font-mono text-fg-brand font-semibold">{field.value} pasos</span>
                      </div>
                      <Slider
                        min={3}
                        max={30}
                        step={1}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <div className="flex justify-between text-caption text-fg-secondary mt-1">
                        <span>3 pasos</span>
                        <span>30 pasos max</span>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* MCP Tools Allowed */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-2">
                Herramientas MCP Permitidas ({selectedTools.length} seleccionadas)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allTools.map((tool) => {
                  const isChecked = selectedTools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-caption cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-border-brand/70 bg-bg-brand-subtle/25 text-fg-primary'
                          : 'border-border-default bg-bg-card/50 text-fg-secondary hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-border-hover text-fg-brand focus:ring-0"
                      />
                      <div className="overflow-hidden">
                        <p className="font-medium text-fg-primary truncate">{tool.name}</p>
                        <p className="text-caption text-fg-secondary truncate">{tool.serverName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allowed Agents Communication Network */}
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-2">
                Red de Colaboración (Agentes a los que puede delegar tareas)
              </label>
              <div className="flex flex-wrap gap-2">
                {otherAgents.map((other) => {
                  const isConnected = selectedPeers.includes(other.id);
                  return (
                    <Badge
                      key={other.id}
                      variant={isConnected ? 'default' : 'outline'}
                      onClick={() => togglePeer(other.id)}
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      {other.name} ({other.role})
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={isSubmitting}>
              {agent ? 'Guardar Cambios' : 'Crear Agente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

