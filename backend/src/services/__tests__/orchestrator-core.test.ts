import { describe, it, expect, beforeEach } from 'vitest';
import { executionService } from '../execution.service.js';
import { analyticsService } from '../analytics.service.js';
import { workflowService } from '../workflow.service.js';
import { wsManager } from '../websocket.service.js';
import { seedDatabase } from '../../db/seed.js';

describe('Core Orchestrator Services Unit & Integration Tests', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('Workflow Service', () => {
    it('retrieves all workflows correctly', async () => {
      const workflows = await workflowService.getAll();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0]).toHaveProperty('id');
      expect(workflows[0]).toHaveProperty('name');
      expect(workflows[0]).toHaveProperty('nodes');
      expect(workflows[0]).toHaveProperty('edges');
    });

    it('retrieves a workflow by id', async () => {
      const workflows = await workflowService.getAll();
      const target = workflows[0];
      const wf = await workflowService.getById(target.id);
      expect(wf).not.toBeNull();
      expect(wf.id).toBe(target.id);
      expect(wf.name).toBe(target.name);
    });
  });

  describe('Execution Service', () => {
    it('retrieves recent executions correctly', async () => {
      const executions = await executionService.getAll();
      expect(Array.isArray(executions)).toBe(true);
      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0]).toHaveProperty('id');
      expect(executions[0]).toHaveProperty('status');
      expect(executions[0]).toHaveProperty('workflowId');
    });

    it('retrieves execution by id with steps and logs', async () => {
      const executions = await executionService.getAll();
      const target = executions.find((e) => e.id === 'exec-8941') || executions[0];
      const execution = await executionService.getById(target.id);

      expect(execution).not.toBeNull();
      expect(execution?.id).toBe(target.id);
      expect(Array.isArray(execution?.steps)).toBe(true);
      expect(Array.isArray(execution?.logs)).toBe(true);
    });
  });

  describe('Analytics Service', () => {
    it('calculates global KPIs and aggregations accurately', async () => {
      const summary = await analyticsService.getSummary();
      expect(summary).toHaveProperty('totalTokens');
      expect(summary).toHaveProperty('estimatedCostUsd');
      expect(summary).toHaveProperty('activeAgents');
      expect(summary).toHaveProperty('connectedProviders');
      expect(typeof summary.totalTokens).toBe('number');
      expect(typeof summary.estimatedCostUsd).toBe('number');
    });

    it('generates activity timeline and distribution data', async () => {
      const summary = await analyticsService.getSummary();
      const timeline = summary.activityTimeline;
      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0]).toHaveProperty('date');
      expect(timeline[0]).toHaveProperty('tokens');
      expect(timeline[0]).toHaveProperty('cost');
    });
  });

  describe('WebSocket Service (Real-time Bus)', () => {
    it('registers and removes client sockets gracefully without memory leaks', () => {
      const mockSocket: any = {
        readyState: 1, // WebSocket.OPEN
        send: () => {},
        on: () => {},
      };

      wsManager.registerClient(mockSocket);
      expect(wsManager.getClientCount()).toBeGreaterThan(0);

      wsManager.removeClient(mockSocket);
      expect(wsManager.getClientCount()).toBe(0);
    });

    it('broadcasts real-time events to connected clients', () => {
      let sentMessage: string | null = null;
      const mockSocket: any = {
        readyState: 1,
        send: (data: string) => {
          sentMessage = data;
        },
        on: () => {},
      };

      wsManager.registerClient(mockSocket);
      wsManager.broadcast('workflow.progress', { executionId: 'test-exec-1', step: 'compile' });

      expect(sentMessage).not.toBeNull();
      const parsed = JSON.parse(sentMessage!);
      expect(parsed.type).toBe('workflow.progress');
      expect(parsed.payload.executionId).toBe('test-exec-1');

      wsManager.removeClient(mockSocket);
    });
  });
});
