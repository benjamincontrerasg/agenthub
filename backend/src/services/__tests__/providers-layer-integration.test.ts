import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSafeUrl } from '../../lib/ssrf.js';
import { ValidationError } from '../../lib/errors.js';
import { analyticsService } from '../analytics.service.js';
import { providerService } from '../provider.service.js';
import { seedDatabase } from '../../db/seed.js';

describe('Backend Provider Integration & Security Tests (Phase 2)', () => {
  beforeEach(async () => {
    delete process.env.ALLOWED_PRIVATE_HOSTS;
    await seedDatabase();
  });

  describe('SSRF Protection Guard', () => {
    it('blocks cloud metadata endpoint 169.254.169.254', async () => {
      await expect(validateSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
        /SSRF Protection/i
      );
    });

    it('blocks private IPv4 ranges (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)', async () => {
      await expect(validateSafeUrl('http://10.0.0.1:8080/v1')).rejects.toThrow(/SSRF Protection/i);
      await expect(validateSafeUrl('http://192.168.1.50/api')).rejects.toThrow(/SSRF Protection/i);
      await expect(validateSafeUrl('http://172.20.0.2:3000')).rejects.toThrow(/SSRF Protection/i);
    });

    it('blocks localhost access by default for standard cloud providers', async () => {
      await expect(validateSafeUrl('http://localhost:8080/v1')).rejects.toThrow(/SSRF Protection/i);
      await expect(validateSafeUrl('http://127.0.0.1:11434/v1')).rejects.toThrow(/SSRF Protection/i);
    });

    it('allows localhost when explicitly permitted for local providers (ollama / lmstudio)', async () => {
      const safe = await validateSafeUrl('http://localhost:11434/v1', { allowLocalhost: true });
      expect(safe).toBe('http://localhost:11434/v1');

      const safeIp = await validateSafeUrl('http://127.0.0.1:1234/v1', { allowLocalhost: true });
      expect(safeIp).toBe('http://127.0.0.1:1234/v1');
    });

    it('allows private hostnames if present in ALLOWED_PRIVATE_HOSTS whitelist', async () => {
      process.env.ALLOWED_PRIVATE_HOSTS = 'internal-gateway.local,vpc-proxy';
      const safe = await validateSafeUrl('http://internal-gateway.local:8000/v1');
      expect(safe).toBe('http://internal-gateway.local:8000/v1');
      delete process.env.ALLOWED_PRIVATE_HOSTS;
    });

    it('rejects non-HTTP protocols (file:, gopher:, ftp:)', async () => {
      await expect(validateSafeUrl('file:///etc/passwd')).rejects.toThrow(/Protocolo no permitido/i);
      await expect(validateSafeUrl('gopher://127.0.0.1:70')).rejects.toThrow(/Protocolo no permitido/i);
    });
  });

  describe('Analytics Cost Calculation via provider_models', () => {
    it('calculates cost using provider_models tariff accurately', () => {
      // claude-3-7-sonnet rate is 3.0 USD per million
      const cost = analyticsService.calculateCost('anthropic', 'claude-3-7-sonnet', 1_000_000);
      expect(cost).toBe(3.0);

      const costHalf = analyticsService.calculateCost('anthropic', 'claude-3-7-sonnet', 500_000);
      expect(costHalf).toBe(1.5);
    });

    it('returns null cost when model has no tariff rate defined', () => {
      const cost = analyticsService.calculateCost('custom-provider', 'unknown-model-without-rate', 500_000);
      expect(cost).toBeNull();
    });
  });

  describe('Provider Service Connection & Testing', () => {
    it('connects provider with encrypted key and updates baseUrl safely', async () => {
      const res = await providerService.connect(
        'openai',
        'sk-test-live-key-456',
        'gpt-4o',
        'https://api.openai.com/v1',
        'openai-compatible'
      );
      expect(res.success).toBe(true);

      const p = await providerService.getById('openai');
      expect(p.status).toBe('connected');
      expect(p.hasApiKey).toBe(true);
      expect(p.baseUrl).toBe('https://api.openai.com/v1');
      expect((p as any).encryptedApiKey).toBeUndefined(); // Never returned to caller
    });
  });
});
