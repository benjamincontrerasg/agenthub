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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Agentes Autónomos
            <Badge variant="secondary" className="font-mono text-xs">{agents.length} Totales</Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrar por nombre, rol o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === role
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
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
              className="flex flex-col justify-between border-slate-800 bg-slate-900/50 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all cursor-pointer group"
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-900/40 to-slate-800 border border-violet-800/40 text-violet-300 font-bold text-sm">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold group-hover:text-violet-300 transition-colors">
                          {agent.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {agent.role}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {provider?.name.split(' ')[0] || agent.providerId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={isActive ? 'success' : 'secondary'}
                      className="text-[10px]"
                    >
                      {isActive ? 'Activo' : 'Pausado'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Attributes Badges */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Modelo</span>
                      <span className="font-mono text-slate-200 truncate block">{agent.modelId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Herramientas MCP</span>
                      <span className="font-mono text-slate-200">{agent.allowedToolIds.length} asignadas</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ejecuciones</span>
                      <span className="font-mono text-slate-200">{agent.stats.totalRuns}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tokens</span>
                      <span className="font-mono text-violet-400">{formatNumber(agent.stats.totalTokens)}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-400 hover:text-white"
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
                        <Play className="mr-1 h-3 w-3 text-emerald-400" /> Activar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                    onClick={(e) => handleEdit(agent, e)}
                  >
                    <Settings className="mr-1 h-3 w-3" /> Editar
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-400"
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
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800">
          <Bot className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No se encontraron agentes con ese filtro</p>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }} className="mt-3 text-xs">
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

