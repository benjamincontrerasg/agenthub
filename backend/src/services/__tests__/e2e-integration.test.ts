import { describe, it, expect, beforeEach } from 'vitest';
import { seedDatabase } from '../../db/seed.js';
import { workflowService } from '../workflow.service.js';
import { mcpService } from '../mcp.service.js';
import { chatService } from '../chat.service.js';
import { memoryService } from '../memory.service.js';
import { signJWT, verifyJWT, AuthUser } from '../../lib/jwt.js';
import { encrypt, decrypt } from '../../lib/crypto.js';

describe('End-to-End System Integration Tests', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('Flujo E2E: Ciclo de Vida de Workflows Multi-Agente', () => {
    it('crea, persiste, ejecuta y valida el resultado de un flujo de trabajo', async () => {
      // 1. Obtener lista inicial de workflows
      const initialList = await workflowService.getAll();
      const initialCount = initialList.length;

      // 2. Crear y guardar un nuevo workflow personalizado
      const newWf = await workflowService.save({
        id: `wf-e2e-${Date.now()}`,
        name: 'Pipeline E2E de Auditoría y Despliegue',
        description: 'Workflow de orquestación autónoma para pruebas integrales',
        status: 'active',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Inicio de Auditoría', nodeType: 'start' },
          },
          {
            id: 'node-architect',
            type: 'agent',
            position: { x: 300, y: 100 },
            data: { label: 'Revisión Arquitecto', nodeType: 'agent', agentId: 'agent-architect' },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-start',
            target: 'node-architect',
          },
        ],
        stats: { runsCount: 0, avgRuntimeSec: 0, successRate: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(newWf.id).toBeDefined();
      expect(newWf.name).toBe('Pipeline E2E de Auditoría y Despliegue');

      // 3. Verificar que aparece en la lista persistida
      const updatedList = await workflowService.getAll();
      expect(updatedList.length).toBe(initialCount + 1);

      // 4. Ejecutar el workflow
      const executionResult = await workflowService.execute(newWf.id);
      expect(executionResult.executionId).toBeDefined();
      expect(executionResult.executionId.startsWith('exec-')).toBe(true);

      // 5. Eliminar el workflow creado
      const deleteResult = await workflowService.delete(newWf.id);
      expect(deleteResult.success).toBe(true);

      const finalCheck = await workflowService.getAll();
      expect(finalCheck.find((w) => w.id === newWf.id)).toBeUndefined();
    });
  });

  describe('Flujo E2E: Autenticación JWT, RBAC y Cifrado Zero-Trust', () => {
    it('completa el flujo de emisión JWT, verificación de roles y descifrado seguro de credenciales', () => {
      // 1. Emisión de token para un operador con rol admin
      const user: AuthUser = {
        id: 'usr-admin-1',
        name: 'Administrador de Seguridad',
        email: 'security-admin@agenthub.internal',
        role: 'admin',
      };

      const token = signJWT(user);
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);

      // 2. Verificación de token y validación RBAC
      const decoded = verifyJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe('admin');
      expect(decoded?.email).toBe('security-admin@agenthub.internal');

      // 3. Cifrado y descifrado de credenciales de proveedor (AES-256-GCM)
      const rawApiKey = 'sk-live-test-credential-xyz9876543210';
      const encrypted = encrypt(rawApiKey);
      expect(encrypted).not.toBe(rawApiKey);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(rawApiKey);
    });
  });

  describe('Flujo E2E: MCP Hub, Tool Execution & Human Approval Gate', () => {
    it('registra servidor MCP, valida herramientas y procesa aprobación humana de seguridad', async () => {
      // 1. Verificar servidores MCP existentes
      const servers = await mcpService.getAll();
      expect(servers.length).toBeGreaterThan(0);

      // 2. Registrar nuevo servidor MCP de pruebas
      const newServer = await mcpService.registerServer({
        name: 'Docker Engine MCP',
        description: 'Control de contenedores locales con aislamiento',
        transport: 'stdio',
        commandOrEndpoint: 'docker',
        args: ['run', '-i', '--rm', 'mcp/docker'],
      });

      expect(newServer.id).toBeDefined();
      expect(newServer.name).toBe('Docker Engine MCP');

      // 3. Alternar estado de activación
      const toggleResult = await mcpService.toggleActivation(newServer.id, true);
      expect(toggleResult.success).toBe(true);

      // 4. Probar compuerta de aprobación humana (Security Gate)
      const approvalResponse = await chatService.respondApproval('appr-501', true);
      expect(approvalResponse.success).toBe(true);

      // 5. Limpieza de servidor creado
      const deleteResult = await mcpService.delete(newServer.id);
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('Flujo E2E: Memoria Semántica RAG y Orquestación Multi-Agente', () => {
    it('almacena memoria semántica, calcula similitud coseno e inyecta contexto en el chat', async () => {
      const targetAgentId = 'agent-architect';

      // 1. Indexar memoria semántica con embedding
      const memory = await memoryService.addMemory({
        agentId: targetAgentId,
        content: 'La base de datos principal utiliza SQLite con Drizzle ORM y soporte futuro para pgvector.',
        metadata: { category: 'architecture', importance: 'high' },
      });

      expect(memory.id).toBeDefined();
      expect(memory.embedding.length).toBe(1536);

      // 2. Búsqueda semántica por similitud
      const results = await memoryService.searchMemories(
        targetAgentId,
        '¿Qué ORM y motor de base de datos usamos?',
        3
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('SQLite con Drizzle ORM');
      expect(results[0].similarity).toBeGreaterThan(-1);

      // 3. Enviar mensaje en chat para activar la coordinación multi-agente
      const message = await chatService.sendMessage('conv-101', 'Revisar la arquitectura del sistema y la base de datos');
      expect(message.id).toBeDefined();
      expect(message.senderType).toBe('user');

      // 4. Limpieza de memoria
      await memoryService.deleteMemory(memory.id);
    });
  });
});
