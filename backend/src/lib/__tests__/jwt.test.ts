import { describe, it, expect } from 'vitest';
import { signJWT, verifyJWT, AuthUser } from '../jwt.js';

describe('JWT Service (HS256)', () => {
  const sampleUser: AuthUser = {
    id: 'user-admin-1',
    email: 'admin@NEXORA.dev',
    name: 'Admin User',
    role: 'admin',
    organizationId: 'org-main-1',
  };

  it('signs and verifies a valid JWT token', () => {
    const token = signJWT(sampleUser, 3600);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const payload = verifyJWT(token);
    expect(payload).toBeDefined();
    expect(payload?.id).toBe(sampleUser.id);
    expect(payload?.email).toBe(sampleUser.email);
    expect(payload?.role).toBe(sampleUser.role);
  });

  it('rejects tampered tokens', () => {
    const token = signJWT(sampleUser, 3600);
    const tampered = token.slice(0, -5) + 'AAAAA';

    expect(verifyJWT(tampered)).toBeNull();
  });

  it('rejects expired tokens', () => {
    // Expire immediately (negative duration)
    const token = signJWT(sampleUser, -10);
    expect(verifyJWT(token)).toBeNull();
  });
});
