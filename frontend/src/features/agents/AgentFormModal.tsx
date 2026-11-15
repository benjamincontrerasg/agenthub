import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Agent, AgentRole } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  Sliders,
} from 'lucide-react';
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
import { CustomSelect } from '@/components/ui/custom-select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useProviders } from '@/features/providers/hooks';
import { useCredentials } from '@/features/credentials/hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { useAgents, useCreateAgent, useUpdateAgent } from './hooks';

const agentSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  role: z.string().min(1, 'Selecciona un rol para el agente'),
  providerId: z.string().min(1, 'Selecciona un proveedor de IA'),
  credentialId: z.string().optional(),
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
  const { data: providers = [] } = useProviders();
  const { data: credentials = [] } = useCredentials();
  const { getAllTools } = useMCPStore();
  const { data: agents = [] } = useAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();

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
      credentialId: agent?.credentialId || '',
      modelId: agent?.modelId || 'claude-3-7-sonnet',
      systemPrompt: agent?.systemPrompt || '',
      temperature: agent?.temperature ?? 0.3,
      maxIterations: agent?.maxIterations ?? 15,
      status: (agent?.status as any) || 'active',
    },
  });

  const selectedProviderId = watch('providerId');
  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];
  const [showAdvanced, setShowAdvanced] = useState(false);

  React.useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description,
        role: agent.role,
        providerId: agent.providerId,
        credentialId: agent.credentialId || '',
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
        credentialId: '',
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
    const credentialId = data.credentialId ? data.credentialId : undefined;
    if (agent) {
      await updateAgentMutation.mutateAsync({
        id: agent.id,
        updates: {
          ...data,
          credentialId,
          allowedToolIds: selectedTools,
          allowedAgentCommunicationIds: selectedPeers,
        },
      });
    } else {
      await createAgentMutation.mutateAsync({
        ...data,
        credentialId,
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
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.role?.message}
                      options={[
                        { value: 'Architect', label: 'Architect (Análisis y Diseño)', description: 'Diseño técnico, estructura de sistemas y APIs' },
                        { value: 'Developer', label: 'Developer (Implementación y Tests)', description: 'Codificación, tests unitarios y refactorización' },
                        { value: 'Reviewer', label: 'Reviewer (Auditoría y Seguridad)', description: 'Revisión estricta de código y cumplimiento Zero-Trust' },
                        { value: 'Research', label: 'Research (Investigación y Docs)', description: 'Búsqueda web, extracción y síntesis documental' },
                        { value: 'Coordinator', label: 'Coordinator (Orquestación)', description: 'Desglose y delegación de tareas multi-agente' },
                        { value: 'Custom', label: 'Custom Role', description: 'Rol personalizado con instrucciones a medida' },
                      ]}
                    />
                  )}
                />
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
                <Controller
                  name="providerId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        const p = providers.find((pr) => pr.id === val);
                        if (p && p.models.length > 0) {
                          setValue('modelId', p.models[0].id);
                        }
                      }}
                      options={providers.map((p) => ({
                        value: p.id,
                        label: p.name,
                        description: p.status === 'connected' ? '🟢 Conectado' : '⚪ Sin conectar',
                      }))}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Modelo de Inferencia
                </label>
                <Controller
                  name="modelId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={(selectedProvider?.models || []).map((m) => ({
                        value: m.id,
                        label: m.name,
                        description: `${m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}k ctx` : ''} · $${m.inputPricePerMillion}/1M in · ${m.supportsToolCalling ? '✓ Tools' : '✗ Sin Tools'}`,
                      }))}
                    />
                  )}
                />
                {selectedTools.length > 0 && selectedProvider?.models.find((m) => m.id === watch('modelId'))?.supportsToolCalling === false && (
                  <div className="mt-2 p-2 rounded-[6px] bg-status-warning/15 border border-status-warning/30 text-caption text-status-warning flex items-start gap-1.5">
                    <span className="font-bold">⚠️ Advertencia:</span>
                    <span>
                      Este agente tiene {selectedTools.length} herramienta(s) asignadas, pero el modelo seleccionado no soporta Tool Calling.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Credencial / API Key Nombrada */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-caption font-medium text-fg-secondary">
                  API Key Asignada (Credencial por Nombre)
                </label>
                <span className="text-xs text-fg-secondary">Bóveda Cifrada</span>
              </div>
              <Controller
                name="credentialId"
                control={control}
                render={({ field }) => {
                  const matchingCredentials = credentials.filter(
                    (c) => !c.providerId || c.providerId === selectedProviderId
                  );

                  return (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={(val) => field.onChange(val)}
                      options={[
                        {
                          value: '',
                          label: `(Predeterminada) Clave general de ${selectedProvider?.name || 'proveedor'}`,
                          description: selectedProvider?.hasApiKey
                            ? 'Usa la clave global configurada en la sección de Proveedores'
                            : 'Sin clave global guardada en el proveedor',
                        },
                        ...matchingCredentials.map((c) => ({
                          value: c.id,
                          label: `🔑 ${c.name}`,
                          description: `${c.maskedKey} · Bóveda`,
                        })),
                      ]}
                    />
                  );
                }}
              />
              <p className="mt-1 text-xs text-fg-secondary">
                Al seleccionar una credencial por su nombre, el agente utilizará esa clave sin revelar la API key completa ni tener que escribirla de nuevo.
              </p>
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

            {/* Collapsible Hyperparameters (Avanzado) */}
            <div className="rounded-[6px] border border-border-default bg-bg-card/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 text-caption font-[510] text-fg-secondary hover:text-fg-primary hover:bg-bg-surface/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-fg-brand" />
                  Hiperparámetros del Modelo (Avanzado)
                </span>
                <span className="flex items-center gap-1.5 text-caption font-mono text-fg-muted">
                  <span>{showAdvanced ? 'Ocultar' : 'Configurar'}</span>
                  {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border-t border-border-default/60 bg-bg-card/70 animate-in slide-in-from-top-1">
                  <div>
                    <Controller
                      name="temperature"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <div className="flex justify-between items-center text-caption mb-2">
                            <span className="font-medium text-fg-secondary">Temperatura</span>
                            <span className="font-mono text-fg-brand font-[510]">{field.value.toFixed(2)}</span>
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
                            <span className="font-mono text-fg-brand font-[510]">{field.value} pasos</span>
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
              )}
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
                      className={`group relative flex items-center justify-between p-2.5 rounded-[6px] border text-caption cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#e4f222] bg-[#e4f222]/[0.06] shadow-[0_0_12px_rgba(228,242,34,0.06)]'
                          : 'border-border-default bg-bg-surface hover:border-border-hover hover:bg-bg-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Custom styled checkbox */}
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-all ${
                            isChecked
                              ? 'border-[#e4f222] bg-[#e4f222] text-[#08090a]'
                              : 'border-[#383b3f] bg-transparent group-hover:border-[#62666d]'
                          }`}
                        >
                          {isChecked && (
                            <svg className="h-3 w-3 fill-current stroke-current" viewBox="0 0 12 12">
                              <path d="M3.5 6.5L5 8l3.5-4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <div className="overflow-hidden">
                          <p className={`font-mono text-[12px] font-[510] truncate ${isChecked ? 'text-[#ffffff]' : 'text-[#d0d6e0]'}`}>
                            {tool.name}
                          </p>
                          <p className="text-[11px] text-[#8a8f98] truncate">{tool.serverName}</p>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-[#e4f222]/15 text-[#e4f222] border border-[#e4f222]/30">
                          ON
                        </span>
                      )}
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

