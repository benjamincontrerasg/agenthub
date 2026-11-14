import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Pause,
  Play,
  Settings,
  MoreVertical,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAgentsStore } from '@/stores/agents.store';
import { useProvidersStore } from '@/stores/providers.store';
import { AgentFormModal } from './AgentFormModal';
import { Agent } from '@/types';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { formatNumber } from '@/lib/utils';

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    agents,
    searchQuery,
    roleFilter,
    setSearchQuery,
    setRoleFilter,
    toggleAgentStatus,
    deleteAgent,
  } = useAgentsStore();
  const { providers } = useProvidersStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const roles = ['ALL', 'Architect', 'Developer', 'Reviewer', 'Research', 'Coordinator'];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || agent.role.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const handleCreate = () => {
    setEditingAgent(null);
    setModalOpen(true);
  };

  const handleEdit = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgent(agent);
    setModalOpen(true);
  };

  const handleDelete = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar al agente "${agent.name}"?`)) {
      deleteAgent(agent.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & New Agent Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary flex items-center gap-2">
            Agentes Autónomos
            <Badge variant="secondary" className="font-mono text-caption">{agents.length} Totales</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Crea, configura y orquesta agentes especializados con prompts personalizados, herramientas MCP y redes de delegación.
          </p>
        </div>

        <Button variant="default" size="sm" onClick={handleCreate} className="shadow-md shadow-violet-600/20">
          <Plus className="mr-1.5 h-4 w-4" />
          Crear Agente
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-fg-secondary" />
          <Input
            placeholder="Filtrar por nombre, rol o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-caption"
          />
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-caption font-medium transition-colors cursor-pointer ${roleFilter === role
                  ? 'bg-bg-brand text-fg-primary shadow-sm'
                  : 'bg-bg-card/80 text-fg-secondary hover:bg-slate-800 hover:text-slate-200 border border-border-default'
                }`}
            >
              {role === 'ALL' ? 'Todos' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => {
          const provider = providers.find((p) => p.id === agent.providerId);
          const isActive = agent.status === 'active';

          return (
            <Card
              key={agent.id}
              onClick={() => navigate(`/agents/${agent.id}`)}
              className="flex flex-col justify-between border-border-default bg-bg-card/50 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all cursor-pointer group"
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <AgentAvatar
                        agentName={agent.name}
                        role={agent.role}
                        providerId={agent.providerId}
                        size="md"
                        status={isActive ? 'active' : 'paused'}
                      />
                      <div>
                        <CardTitle className="text-subtitle font-semibold group-hover:text-violet-300 transition-colors">
                          {agent.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-caption font-mono">
                            {agent.role}
                          </Badge>
                          <div className="flex items-center gap-1 text-caption text-fg-secondary">
                            <ProviderLogo providerId={agent.providerId} size="xs" showBackground={false} />
                            <span>{provider?.name.split(' ')[0] || agent.providerId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={isActive ? 'success' : 'secondary'}
                      className="text-caption"
                    >
                      {isActive ? 'Activo' : 'Pausado'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-caption text-fg-secondary line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Attributes Badges */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-bg-card/60 border border-border-default/80 text-caption">
                    <div>
                      <span className="text-fg-secondary block text-caption">Modelo</span>
                      <span className="font-mono text-fg-primary truncate block">{agent.modelId}</span>
                    </div>
                    <div>
                      <span className="text-fg-secondary block text-caption">Herramientas MCP</span>
                      <span className="font-mono text-fg-primary">{agent.allowedToolIds.length} asignadas</span>
                    </div>
                    <div>
                      <span className="text-fg-secondary block text-caption">Ejecuciones</span>
                      <span className="font-mono text-fg-primary">{agent.stats.totalRuns}</span>
                    </div>
                    <div>
                      <span className="text-fg-secondary block text-caption">Tokens</span>
                      <span className="font-mono text-fg-brand">{formatNumber(agent.stats.totalTokens)}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-3 border-t border-border-default/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-caption text-fg-secondary hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAgentStatus(agent.id);
                    }}
                  >
                    {isActive ? (
                      <>
                        <Pause className="mr-1 h-3 w-3" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-3 w-3 text-fg-success" /> Activar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-caption text-fg-secondary hover:text-white"
                    onClick={(e) => handleEdit(agent, e)}
                  >
                    <Settings className="mr-1 h-3 w-3" /> Editar
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-fg-muted hover:text-red-400"
                  onClick={(e) => handleDelete(agent, e)}
                  title="Eliminar Agente"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="p-12 text-center rounded-xl border border-dashed border-border-default">
          <Bot className="h-10 w-10 text-fg-muted mx-auto mb-3" />
          <p className="text-body font-medium text-fg-secondary">No se encontraron agentes con ese filtro</p>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }} className="mt-3 text-caption">
            Restablecer Filtros
          </Button>
        </div>
      )}

      {/* Agent Create / Edit Modal */}
      <AgentFormModal
        agent={editingAgent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

