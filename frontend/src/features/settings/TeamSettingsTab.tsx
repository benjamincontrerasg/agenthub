import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Copy,
  Check,
  Trash2,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/ui/custom-select';
import { apiClient } from '@/services/api';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  status: 'active' | 'invited';
  avatar?: string;
  joinedAt: string;
  inviteToken?: string;
}

interface OrgData {
  id: string;
  name: string;
  plan: string;
  totalMembers: number;
  maxSeats: number;
}

export const TeamSettingsTab: React.FC = () => {
  const { user } = useAuthStore();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [org, setOrg] = useState<OrgData>({
    id: 'org_core_nexora',
    name: 'NEXORA Enterprise Core Team',
    plan: 'pro',
    totalMembers: 2,
    maxSeats: 10,
  });
  const [loading, setLoading] = useState(true);

  // Formulario de invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; organization: OrgData; members: TeamMember[] }>('/team/members');
      if (res?.members) setMembers(res.members);
      if (res?.organization) setOrg(res.organization);
    } catch (err) {
      console.warn('Usando miembros por defecto:', err);
      setMembers([
        {
          id: 'user-admin-01',
          name: 'Administrador NEXORA',
          email: 'admin@nexora.dev',
          role: 'owner',
          status: 'active',
          joinedAt: '2026-01-15T10:00:00.000Z',
        },
        {
          id: 'user-dev-01',
          name: 'Developer Principal',
          email: 'dev@nexora.dev',
          role: 'developer',
          status: 'active',
          joinedAt: '2026-06-20T14:30:00.000Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient<{ success: boolean; member: TeamMember; inviteUrl: string }>('/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      });

      if (res?.member) {
        setMembers((prev) => [...prev, res.member]);
        setInviteEmail('');
        setInviteName('');
        toast.success('Invitación Creada', `Se envió la invitación a ${res.member.email}.`);
      }
    } catch (err: any) {
      toast.error('Error al invitar', err.message || 'No se pudo enviar la invitación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: 'admin' | 'developer' | 'viewer') => {
    try {
      await apiClient(`/team/members/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
      toast.success('Rol Actualizado', 'El nivel de acceso fue modificado con éxito.');
    } catch (err: any) {
      toast.error('Error', err.message || 'No se pudo actualizar el rol.');
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de revocar el acceso a "${name}"?`)) return;

    try {
      await apiClient(`/team/members/${id}`, {
        method: 'DELETE',
      });
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success('Miembro Removido', 'Acceso revocado de la organización.');
    } catch (err: any) {
      toast.error('Error', err.message || 'No se pudo remover al colaborador.');
    }
  };

  const handleCopyLink = (token: string, email: string) => {
    const url = `${window.location.origin}/login?invite=${token}&email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success('Enlace Copiado', 'Enlace de invitación copiado al portapapeles.');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Organization Header Card */}
      <Card className="border-border-default bg-bg-card/70 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-600/10 to-transparent blur-3xl pointer-events-none" />

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-600/30 flex items-center justify-center text-violet-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-fg-primary flex items-center gap-2">
                  <span>{org.name}</span>
                  <Badge variant="outline" className="font-mono text-caption uppercase text-violet-400 border-violet-600/30">
                    Multi-Tenant RBAC
                  </Badge>
                </CardTitle>
                <CardDescription className="text-caption text-fg-secondary mt-0.5">
                  Gestiona las cuentas de tu equipo, asignación de roles y permisos de acceso Zero-Trust.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-caption">
                {members.length} / {org.maxSeats} Asientos Ocupados
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Invite Member Section (Only visible to Admin / Owner) */}
      {isAdminOrOwner && (
        <Card className="border-border-default bg-bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-body font-semibold text-fg-primary flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-fg-brand" />
              Invitar Colaborador al Equipo
            </CardTitle>
            <CardDescription className="text-caption">
              El colaborador recibirá un enlace de acceso para unirse a la organización con su rol preconfigurado.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  placeholder="ej. ingenieria@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Nombre (Opcional)
                </label>
                <Input
                  placeholder="ej. Ana Gómez"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Rol Asignado
                </label>
                <CustomSelect
                  value={inviteRole}
                  onChange={(val: any) => setInviteRole(val)}
                  options={[
                    { value: 'admin', label: 'Admin (Control total)' },
                    { value: 'developer', label: 'Developer (Creación)' },
                    { value: 'viewer', label: 'Viewer (Solo lectura)' },
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isSubmitting}
                  className="w-full text-caption bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b] font-semibold"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Invitar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card className="border-border-default bg-bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-body font-semibold text-fg-primary flex items-center gap-2">
            <Users className="h-4 w-4 text-fg-brand" />
            Colaboradores de la Organización ({members.length})
          </CardTitle>
          <CardDescription className="text-caption">
            Miembros con credenciales activas o invitaciones pendientes de aceptación.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead>
                <tr className="border-b border-border-default text-fg-secondary font-mono">
                  <th className="pb-2">Usuario</th>
                  <th className="pb-2">Rol RBAC</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2">Fecha de Ingreso</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {members.map((member) => {
                  const isOwner = member.role === 'owner';
                  return (
                    <tr key={member.id} className="hover:bg-bg-surface/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-fg-primary flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isOwner && (
                                <span title="Propietario de la Organización">
                                  <Crown className="h-3 w-3 text-amber-400" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-fg-secondary">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        {isOwner ? (
                          <Badge variant="warning" className="text-[10px] font-mono">
                            Owner (Propietario)
                          </Badge>
                        ) : isAdminOrOwner ? (
                          <div className="w-36">
                            <CustomSelect
                              value={member.role}
                              onChange={(val: any) => handleUpdateRole(member.id, val)}
                              options={[
                                { value: 'admin', label: 'Admin' },
                                { value: 'developer', label: 'Developer' },
                                { value: 'viewer', label: 'Viewer' },
                              ]}
                            />
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-mono capitalize">
                            {member.role}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3">
                        {member.status === 'active' ? (
                          <Badge variant="success" className="text-[10px] font-mono">
                            🟢 Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-mono text-amber-300 border-amber-500/30">
                            ⏳ Invitado
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 font-mono text-fg-secondary">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status === 'invited' && member.inviteToken && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-caption text-fg-secondary hover:text-fg-primary"
                              onClick={() => handleCopyLink(member.inviteToken!, member.email)}
                              title="Copiar enlace de invitación"
                            >
                              {copiedToken === member.inviteToken ? (
                                <>
                                  <Check className="mr-1 h-3 w-3 text-emerald-400" /> Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-3 w-3" /> Enlace
                                </>
                              )}
                            </Button>
                          )}

                          {isAdminOrOwner && !isOwner && member.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-fg-muted hover:text-red-400"
                              onClick={() => handleRemove(member.id, member.name)}
                              title="Remover del equipo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
