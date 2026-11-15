import { z } from 'zod';

export const connectProviderSchema = z.object({
  apiKey: z.string().min(1, 'API key es requerida'),
  defaultModelId: z.string().optional(),
  baseUrl: z.string().url('URL inválida').optional(),
  kind: z.string().optional(),
});

export const updateProviderSchema = z.object({
  defaultModelId: z.string().min(1, 'defaultModelId es requerido').optional(),
  baseUrl: z.string().url('URL inválida').optional(),
  kind: z.string().optional(),
});

export const createCredentialSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  providerId: z.string().min(1, 'Proveedor es requerido'),
  apiKey: z.string().min(1, 'API key es requerida'),
});

export const updateCredentialSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
});

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  description: z.string().max(500).default(''),
  role: z.string().min(1, 'Rol es requerido').max(100),
  providerId: z.string().min(1, 'Proveedor es requerido'),
  credentialId: z.string().nullable().optional(),
  modelId: z.string().min(1, 'Modelo es requerido'),
  systemPrompt: z.string().default(''),
  temperature: z.number().min(0).max(2).default(0.7),
  maxIterations: z.number().int().min(1).max(100).default(10),
  allowedToolIds: z.array(z.string()).default([]),
  allowedAgentCommunicationIds: z.array(z.string()).default([]),
  status: z.enum(['idle', 'running', 'paused', 'active', 'error']).default('idle'),
  avatarUrl: z.string().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  role: z.string().min(1).max(100).optional(),
  providerId: z.string().optional(),
  credentialId: z.string().nullable().optional(),
  modelId: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxIterations: z.number().int().min(1).max(100).optional(),
  allowedToolIds: z.array(z.string()).optional(),
  allowedAgentCommunicationIds: z.array(z.string()).optional(),
  status: z.enum(['idle', 'running', 'paused', 'active', 'error']).optional(),
  avatarUrl: z.string().optional(),
});

export const registerMCPServerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  description: z.string().max(500).default(''),
  transport: z.enum(['stdio', 'streamable-http']),
  commandOrEndpoint: z.string().min(1, 'Comando o endpoint es requerido'),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  allowedDirectories: z.array(z.string()).optional(),
});

export const toggleMCPActivationSchema = z.object({
  active: z.boolean(),
});

export const saveWorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nombre es requerido').max(100),
  description: z.string().default(''),
  version: z.string().default('1.0.0'),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  stats: z.object({
    runsCount: z.number().optional(),
    avgRuntimeSec: z.number().optional(),
    successRate: z.number().optional(),
  }).optional(),
});

export const executeWorkflowSchema = z.object({
  inputs: z.record(z.any()).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export const respondApprovalSchema = z.object({
  approved: z.boolean(),
  rememberForSession: z.boolean().optional(),
});

export const respondToolApprovalSchema = z.object({
  approved: z.boolean(),
  rememberForSession: z.boolean().optional(),
  sessionId: z.string().optional(),
});
