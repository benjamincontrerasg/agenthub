import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  uuid,
  jsonb,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Custom pgvector type for OpenAI text-embedding-3-small (1536 dims) or large (3072 dims)
 */
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ORGANIZACIONES Y MULTI-TENANCY
// ═══════════════════════════════════════════════════════════════════════════════

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan', { enum: ['starter', 'pro', 'enterprise'] }).notNull().default('starter'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'developer', 'viewer'] }).notNull().default('developer'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROVEEDORES Y MODELOS (MULTI-TENANT)
// ═══════════════════════════════════════════════════════════════════════════════

export const providers = pgTable('providers', {
  id: text('id').primaryKey(), // 'anthropic', 'openai', 'gemini', 'ollama'
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  logo: text('logo').notNull(),
  badge: text('badge').notNull(),
  status: text('status', { enum: ['connected', 'disconnected', 'error', 'testing'] }).notNull().default('disconnected'),
  defaultModelId: text('default_model_id').notNull(),
  hasApiKey: boolean('has_api_key').notNull().default(false),
  encryptedApiKey: text('encrypted_api_key'),
  apiEndpoint: text('api_endpoint'),
  latencyMs: integer('latency_ms'),
  lastTested: timestamp('last_tested', { withTimezone: true }),
  rateLimitRequestsPerMin: integer('rate_limit_requests_per_min'),
  rateLimitTokensPerMin: integer('rate_limit_tokens_per_min'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contextWindow: integer('context_window').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  inputPricePerMillion: doublePrecision('input_price_per_million').notNull(),
  outputPricePerMillion: doublePrecision('output_price_per_million').notNull(),
  supportsStreaming: boolean('supports_streaming').notNull().default(true),
  supportsToolCalling: boolean('supports_tool_calling').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. AGENTES AUTÓNOMOS Y MEMORIA VECTORIAL (PGVECTOR)
// ═══════════════════════════════════════════════════════════════════════════════

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  role: text('role').notNull(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  modelId: text('model_id').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: doublePrecision('temperature').notNull().default(0.7),
  maxIterations: integer('max_iterations').notNull().default(10),
  status: text('status', { enum: ['idle', 'running', 'paused', 'active', 'error'] }).notNull().default('idle'),
  avatarUrl: text('avatar_url'),
  totalRuns: integer('total_runs').notNull().default(0),
  avgDurationSec: doublePrecision('avg_duration_sec').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  successRate: doublePrecision('success_rate').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabla de memoria semántica vectorial de agentes (RAG / Memoria a largo plazo)
 */
export const agentMemories = pgTable('agent_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  embedding: vector('embedding'), // 1536 dimensiones para pgvector
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SERVIDORES Y HERRAMIENTAS MCP (MODEL CONTEXT PROTOCOL)
// ═══════════════════════════════════════════════════════════════════════════════

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  transport: text('transport', { enum: ['stdio', 'streamable-http'] }).notNull(),
  commandOrEndpoint: text('command_or_endpoint').notNull(),
  args: text('args').array(),
  env: jsonb('env'),
  allowedDirectories: text('allowed_directories').array(),
  status: text('status', { enum: ['connected', 'disconnected', 'pending_validation', 'error'] }).notNull().default('pending_validation'),
  isActivated: boolean('is_activated').notNull().default(false),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mcpTools = pgTable('mcp_tools', {
  id: text('id').primaryKey(),
  serverId: uuid('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  inputSchema: jsonb('input_schema').notNull(),
  isWriteOperation: boolean('is_write_operation').notNull().default(false),
  requiresApproval: boolean('requires_approval').notNull().default(false),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. WORKFLOWS Y GRAFOS VISUALES
// ═══════════════════════════════════════════════════════════════════════════════

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  version: text('version').notNull().default('1.0.0'),
  nodes: jsonb('nodes').notNull(),
  edges: jsonb('edges').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
