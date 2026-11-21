import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { USERS } from './auth.routes.js';
import { AuthUser } from '../lib/jwt.js';
import { auditService } from '../services/audit.service.js';
import { randomBytes } from 'crypto';

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

// Invitaciones pendientes en memoria
export const INVITATIONS = new Map<string, TeamMember>();

export function getTeamMembers(): TeamMember[] {
  const activeMembers: TeamMember[] = Object.values(USERS).map((u, idx) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: 'active',
    joinedAt: idx === 0 ? '2026-01-15T10:00:00.000Z' : '2026-06-20T14:30:00.000Z',
  }));

  const pendingInvites = Array.from(INVITATIONS.values());
  return [...activeMembers, ...pendingInvites];
}

const inviteSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  role: z.enum(['admin', 'developer', 'viewer']).default('developer'),
  name: z.string().min(2).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'developer', 'viewer']),
});

export async function teamRoutes(fastify: FastifyInstance) {
  /**
   * GET /team/members
   * Retorna todos los miembros activos e invitaciones pendientes
   */
  fastify.get('/team/members', async (request: any, reply) => {
    const members = getTeamMembers();
    return reply.send({
      success: true,
      organization: {
        id: 'org_core_nexora',
        name: 'NEXORA Enterprise Core Team',
        plan: 'pro',
        totalMembers: members.length,
        maxSeats: 10,
      },
      members,
    });
  });

  /**
   * POST /team/invite
   * Invita a un nuevo colaborador por email con rol específico
   */
  fastify.post('/team/invite', async (request: any, reply) => {
    const user = request.user as AuthUser;

    // Solo admin u owner pueden invitar
    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'Solo administradores pueden invitar nuevos miembros al equipo.',
      });
    }

    const parsed = inviteSchema.parse(request.body);
    const emailNorm = parsed.email.toLowerCase().trim();

    // Validar si ya existe como usuario activo
    if (USERS[emailNorm]) {
      return reply.status(409).send({
        code: 'MEMBER_EXISTS',
        message: `El usuario "${emailNorm}" ya forma parte de la organización.`,
      });
    }

    // Validar si ya existe una invitación pendiente
    if (INVITATIONS.has(emailNorm)) {
      return reply.status(409).send({
        code: 'INVITE_PENDING',
        message: `Ya existe una invitación pendiente enviada a "${emailNorm}".`,
      });
    }

    const inviteToken = `inv_${randomBytes(16).toString('hex')}`;
    const newInvite: TeamMember = {
      id: `usr_inv_${Date.now()}`,
      email: emailNorm,
      name: parsed.name || emailNorm.split('@')[0],
      role: parsed.role,
      status: 'invited',
      joinedAt: new Date().toISOString(),
      inviteToken,
    };

    INVITATIONS.set(emailNorm, newInvite);

    await auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      action: 'team.invite',
      resource: `team:${emailNorm}`,
      status: 'success',
      details: { role: parsed.role, inviteToken },
    });

    return reply.status(201).send({
      success: true,
      message: `Invitación enviada con éxito a ${emailNorm}.`,
      member: newInvite,
      inviteUrl: `${request.headers.origin || 'http://localhost:5173'}/login?invite=${inviteToken}&email=${encodeURIComponent(emailNorm)}`,
    });
  });

  /**
   * PATCH /team/members/:id/role
   * Cambia el rol RBAC de un colaborador
   */
  fastify.patch('/team/members/:id/role', async (request: any, reply) => {
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };

    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'Solo administradores pueden modificar roles del equipo.',
      });
    }

    const parsed = updateRoleSchema.parse(request.body);

    // Buscar en usuarios activos
    const targetUser = Object.values(USERS).find((u) => u.id === id);
    if (targetUser) {
      if (targetUser.role === 'owner') {
        return reply.status(400).send({
          code: 'IMMUTABLE_ROLE',
          message: 'El rol de Owner de la organización no puede ser alterado.',
        });
      }
      targetUser.role = parsed.role;
      return reply.send({ success: true, member: targetUser });
    }

    // Buscar en invitaciones pendientes
    for (const [email, inv] of INVITATIONS.entries()) {
      if (inv.id === id) {
        inv.role = parsed.role;
        INVITATIONS.set(email, inv);
        return reply.send({ success: true, member: inv });
      }
    }

    return reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'Miembro de equipo no encontrado.',
    });
  });

  /**
   * DELETE /team/members/:id
   * Revoca una invitación o elimina a un miembro del equipo
   */
  fastify.delete('/team/members/:id', async (request: any, reply) => {
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };

    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'Solo administradores pueden remover miembros del equipo.',
      });
    }

    if (user && user.id === id) {
      return reply.status(400).send({
        code: 'CANNOT_REMOVE_SELF',
        message: 'No puedes remover tu propia cuenta de la organización.',
      });
    }

    // Revocar invitación pendiente
    for (const [email, inv] of INVITATIONS.entries()) {
      if (inv.id === id) {
        INVITATIONS.delete(email);
        return reply.send({
          success: true,
          message: `Invitación a "${email}" revocada.`,
        });
      }
    }

    // Eliminar usuario activo
    for (const [email, u] of Object.entries(USERS)) {
      if (u.id === id) {
        if (u.role === 'owner') {
          return reply.status(400).send({
            code: 'IMMUTABLE_ROLE',
            message: 'No es posible remover al propietario (Owner) de la organización.',
          });
        }
        delete USERS[email];
        return reply.send({
          success: true,
          message: `Miembro "${u.name}" (${email}) removido de la organización.`,
        });
      }
    }

    return reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'Miembro de equipo no encontrado.',
    });
  });
}
