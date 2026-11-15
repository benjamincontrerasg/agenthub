import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { signJWT, AuthUser } from '../lib/jwt.js';
import { auditService } from '../services/audit.service.js';
import { createRateLimiter } from '../lib/rate-limiter.js';

const scryptAsync = promisify(scrypt);

const authRateLimiter = createRateLimiter({
  maxRequests: process.env.NODE_ENV === 'test' ? 1000 : 10,
  windowMs: 60_000,
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// role NO se acepta en el schema de registro: el servidor siempre asigna el rol de menor privilegio ('viewer')
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, keyBuffer.length)) as Buffer;
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Hash dummy constante para mitigar timing attacks cuando el usuario no existe
const DUMMY_HASH =
  'a368f8323cb1b8e8e30b52a7557c9716:bf6c934e58be447422314da8d30f97201a3aba81540263f5a1ea9ca29d7f89b5040b324d3a8b02a64c490bec483274ae3d3946c71260166194881643c17ec434';

// Cuentas de demostración con contraseñas cifradas vía scrypt (solo en desarrollo o test)
export function getDemoUsers(): Record<string, AuthUser & { passwordHash: string }> {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }
  return {
    'admin@nexora.dev': {
      id: 'user-admin-01',
      email: 'admin@nexora.dev',
      name: 'Administrador NEXORA',
      role: 'admin',
      passwordHash:
        'a368f8323cb1b8e8e30b52a7557c9716:bf6c934e58be447422314da8d30f97201a3aba81540263f5a1ea9ca29d7f89b5040b324d3a8b02a64c490bec483274ae3d3946c71260166194881643c17ec434',
      organizationId: 'org-default',
    },
    'dev@nexora.dev': {
      id: 'user-dev-01',
      email: 'dev@nexora.dev',
      name: 'Developer NEXORA',
      role: 'developer',
      passwordHash:
        '86daf06a31d36499eb42e659cc90783d:628ea72dcca7a28ca2741444d9aa3daf4093ca92bc06c30b418a95d3298764661754bfe68dbdc0b57392a972c1a0d526f9ce2b40c3d6dc58c5566711b4d77084',
      organizationId: 'org-default',
    },
  };
}

export const USERS: Record<string, AuthUser & { passwordHash: string }> = { ...getDemoUsers() };

export function resetUsers() {
  for (const k of Object.keys(USERS)) {
    delete USERS[k];
  }
  Object.assign(USERS, getDemoUsers());
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', { preHandler: [authRateLimiter] }, async (req, reply) => {
    const parsed = loginSchema.parse(req.body);
    const emailNorm = parsed.email.toLowerCase().trim();
    const existing = USERS[emailNorm];

    // Mitigación de enumeración de usuarios y timing attacks:
    // Siempre se ejecuta un scrypt y se devuelve exactamente el mismo mensaje de error.
    if (!existing) {
      await verifyPassword(parsed.password, DUMMY_HASH);
      await auditService.log({
        userEmail: emailNorm,
        action: 'auth.login',
        resource: 'system:auth',
        ip: req.ip,
        status: 'failure',
        details: { reason: 'Credenciales inválidas' },
      });

      return reply.status(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      });
    }

    const isMatch = await verifyPassword(parsed.password, existing.passwordHash);
    if (!isMatch) {
      await auditService.log({
        userEmail: emailNorm,
        action: 'auth.login',
        resource: 'system:auth',
        ip: req.ip,
        status: 'failure',
        details: { reason: 'Credenciales inválidas' },
      });

      return reply.status(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      });
    }

    const { passwordHash, ...user } = existing;
    const token = signJWT(user);

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'auth.login',
      resource: 'system:auth',
      ip: req.ip,
      status: 'success',
      details: { role: user.role },
    });

    return {
      success: true,
      token,
      user,
    };
  });

  fastify.post('/auth/register', { preHandler: [authRateLimiter] }, async (req, reply) => {
    const parsed = registerSchema.parse(req.body);
    const emailNorm = parsed.email.toLowerCase().trim();

    if (USERS[emailNorm]) {
      return reply.status(409).send({
        code: 'USER_EXISTS',
        message: 'El usuario ya se encuentra registrado.',
      });
    }

    const passwordHash = await hashPassword(parsed.password);

    // Asignación estricta de menor privilegio: 'viewer' (ignora cualquier role enviado por el cliente)
    const newUser: AuthUser & { passwordHash: string } = {
      id: `user-${Date.now()}`,
      email: emailNorm,
      name: parsed.name,
      role: 'viewer',
      passwordHash,
      organizationId: 'org-default',
    };

    USERS[emailNorm] = newUser;
    const { passwordHash: _, ...user } = newUser;
    const token = signJWT(user);

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'auth.register',
      resource: 'system:auth',
      ip: req.ip,
      status: 'success',
      details: { role: user.role },
    });

    return {
      success: true,
      token,
      user,
    };
  });

  fastify.get('/auth/me', async (req, reply) => {
    const user = req.user;
    if (!user) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'No autenticado.',
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  });
}
