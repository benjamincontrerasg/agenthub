import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { signJWT, verifyJWT, AuthUser } from '../lib/jwt.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['owner', 'admin', 'developer', 'viewer']).default('developer'),
});

// Demo accounts in memory / seed
const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@agenthub.dev': {
    id: 'user-admin-01',
    email: 'admin@agenthub.dev',
    name: 'Administrador AgentHub',
    role: 'admin',
    password: 'admin123',
    organizationId: 'org-default',
  },
  'dev@agenthub.dev': {
    id: 'user-dev-01',
    email: 'dev@agenthub.dev',
    name: 'Developer AgentHub',
    role: 'developer',
    password: 'dev123',
    organizationId: 'org-default',
  },
};

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', async (req, reply) => {
    const parsed = loginSchema.parse(req.body);
    const existing = DEMO_USERS[parsed.email.toLowerCase()];

    if (!existing || existing.password !== parsed.password) {
      return reply.status(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas. Usa admin@agenthub.dev / admin123 para desarrollo.',
      });
    }

    const { password, ...user } = existing;
    const token = signJWT(user);

    return {
      success: true,
      token,
      user,
    };
  });

  fastify.post('/auth/register', async (req, reply) => {
    const parsed = registerSchema.parse(req.body);
    const emailNorm = parsed.email.toLowerCase();

    if (DEMO_USERS[emailNorm]) {
      return reply.status(409).send({
        code: 'USER_EXISTS',
        message: 'El usuario ya se encuentra registrado.',
      });
    }

    const newUser: AuthUser & { password: string } = {
      id: `user-${Date.now()}`,
      email: emailNorm,
      name: parsed.name,
      role: parsed.role,
      password: parsed.password,
      organizationId: 'org-default',
    };

    DEMO_USERS[emailNorm] = newUser;
    const { password, ...user } = newUser;
    const token = signJWT(user);

    return {
      success: true,
      token,
      user,
    };
  });

  fastify.get('/auth/me', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: 'Cabecera Authorization Bearer requerida.',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyJWT(token);

    if (!payload) {
      return reply.status(401).send({
        code: 'INVALID_TOKEN',
        message: 'Token JWT inválido o expirado.',
      });
    }

    return {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        organizationId: payload.organizationId,
      },
    };
  });
}
