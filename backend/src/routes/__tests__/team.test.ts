import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../index';
import { signJWT } from '../../lib/jwt';

describe('SaaS Team & Organization Multi-Tenant API (/v1/team)', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    adminToken = signJWT({
      id: 'usr_admin_org',
      email: 'admin@nexora.dev',
      name: 'Admin Team',
      role: 'admin',
    });
    viewerToken = signJWT({
      id: 'usr_viewer_org',
      email: 'viewer@nexora.dev',
      name: 'Viewer Guest',
      role: 'viewer',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/team/members exige autenticación JWT (401 sin token)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/team/members',
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/team/members retorna lista de miembros y datos de la organización', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/team/members',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.organization.name).toBeDefined();
    expect(Array.isArray(body.members)).toBe(true);
    expect(body.members.length).toBeGreaterThan(0);
  });

  it('POST /v1/team/invite es rechazado con 403 Forbidden si el solicitante no es Admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/team/invite',
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: {
        email: 'newcolleague@nexora.dev',
        role: 'developer',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('FORBIDDEN');
  });

  it('POST /v1/team/invite permite a un Admin invitar a un nuevo colaborador', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/team/invite',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        email: 'collaborator@nexora.dev',
        name: 'Carlos Dev',
        role: 'developer',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.member.email).toBe('collaborator@nexora.dev');
    expect(body.member.status).toBe('invited');
    expect(body.inviteUrl).toContain('/login?invite=');
  });

  it('PATCH /v1/team/members/:id/role permite a un Admin actualizar el rol de un miembro', async () => {
    // Primero listamos para obtener el ID de la invitación creada
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/team/members',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const members = JSON.parse(listRes.body).members;
    const target = members.find((m: any) => m.email === 'collaborator@nexora.dev');

    expect(target).toBeDefined();

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/v1/team/members/${target.id}/role`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { role: 'admin' },
    });

    expect(patchRes.statusCode).toBe(200);
    const body = JSON.parse(patchRes.body);
    expect(body.success).toBe(true);
    expect(body.member.role).toBe('admin');
  });

  it('DELETE /v1/team/members/:id revoca la invitación o elimina al miembro', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/team/members',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const members = JSON.parse(listRes.body).members;
    const target = members.find((m: any) => m.email === 'collaborator@nexora.dev');

    const delRes = await app.inject({
      method: 'DELETE',
      url: `/v1/team/members/${target.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(delRes.statusCode).toBe(200);
    const body = JSON.parse(delRes.body);
    expect(body.success).toBe(true);
  });
});
