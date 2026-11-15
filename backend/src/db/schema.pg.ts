import { pgTable, text, integer, real, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- AI Providers & Models (PostgreSQL Blueprint) ---

export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  logo: text('logo').notNull(),
  badge: text('badge').notNull(),
  kind: text('kind').notNull().default('openai-compatible'),
  baseUrl: text('base_url'),
  status: text('status').notNull().default('disconnected'),
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
  inputPricePerMillion: real('input_price_per_million').notNull(),
  outputPricePerMillion: real('output_price_per_million').notNull(),
  supportsStreaming: boolean('supports_streaming').notNull().default(true),
  supportsToolCalling: boolean('supports_tool_calling').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
});

export const providerModels = pgTable('provider_models', {
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  contextWindow: integer('context_window').default(128000),
  inputCostPer1M: real('input_cost_per_1m'),
  outputCostPer1M: real('output_cost_per_1m'),
  supportsTools: boolean('supports_tools').notNull().default(true),
}, (table) => [
  primaryKey({ columns: [table.providerId, table.modelId] })
]);

export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  role: text('role').notNull(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  modelId: text('model_id').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').notNull().default(0.7),
  maxIterations: integer('max_iterations').notNull().default(10),
  status: text('status').notNull().default('idle'),
  avatarUrl: text('avatar_url'),
  totalRuns: integer('total_runs').notNull().default(0),
  avgDurationSec: real('avg_duration_sec').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  successRate: real('success_rate').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- MCP Servers & Tools ---

export const mcpServers = pgTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  transport: text('transport').notNull(),
  commandOrEndpoint: text('command_or_endpoint').notNull(),
  args: text('args'),
  env: text('env'),
  allowedDirectories: text('allowed_directories'),
  status: text('status').notNull().default('pending_validation'),
  isActivated: boolean('is_activated').notNull().default(false),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mcpTools = pgTable('mcp_tools', {
  id: text('id').primaryKey(),
  serverId: text('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  inputSchema: text('input_schema').notNull(),
  isWriteOperation: boolean('is_write_operation').notNull().default(false),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  toolRiskLevel: text('tool_risk_level').notNull().default('read'),
});

// --- Approvals ---

export const approvals = pgTable('approvals', {
  id: text('id').primaryKey(),
  executionId: text('execution_id'),
  conversationId: text('conversation_id'),
  toolId: text('tool_id').notNull(),
  toolName: text('tool_name').notNull(),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  actionDescription: text('action_description').notNull(),
  payload: text('payload').notNull(),
  status: text('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
});

export const toolApprovals = pgTable('tool_approvals', {
  id: text('id').primaryKey(),
  toolName: text('tool_name').notNull(),
  toolArgs: text('tool_args').notNull(),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  riskLevel: text('risk_level').notNull(),
  status: text('status').notNull().default('pending'),
  affectedPath: text('affected_path'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
});
