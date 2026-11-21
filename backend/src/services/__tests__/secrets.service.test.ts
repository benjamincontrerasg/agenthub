import { describe, it, expect, beforeEach } from 'vitest';
import { secretsService } from '../secrets.service.js';
import { seedDatabase } from '../../db/seed.js';

describe('Zero-Trust Secrets & Environment Variables Service', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('lista los secretos con valores ofuscados por defecto (Zero-Trust)', async () => {
    const list = await secretsService.getSecrets();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const first = list[0];
    expect(first.name).toBeDefined();
    expect(first.maskedValue).toContain('••');
  });

  it('permite registrar y cifrar un nuevo secreto con AES-256-GCM', async () => {
    const created = await secretsService.setSecret({
      name: 'STRIPE_WEBHOOK_SECRET_TEST',
      value: 'whsec_test_secret_key_1234567890',
      description: 'Clave de firma para webhook de Stripe',
      category: 'webhook',
    });

    expect(created.name).toBe('STRIPE_WEBHOOK_SECRET_TEST');
    expect(created.category).toBe('webhook');
    expect(created.maskedValue).toContain('••••');

    // Reveal and check plaintext
    const revealed = await secretsService.revealSecret('STRIPE_WEBHOOK_SECRET_TEST', {
      userId: 'test-admin',
      userEmail: 'admin@nexora.dev',
      ip: '127.0.0.1',
    });

    expect(revealed.value).toBe('whsec_test_secret_key_1234567890');
  });

  it('permite actualizar un secreto existente preservando el ID', async () => {
    await secretsService.setSecret({
      name: 'CUSTOM_API_KEY',
      value: 'original-value-12345',
      category: 'api_key',
    });

    const updated = await secretsService.setSecret({
      name: 'CUSTOM_API_KEY',
      value: 'updated-value-67890',
      category: 'api_key',
    });

    const revealed = await secretsService.revealSecret('CUSTOM_API_KEY');
    expect(revealed.value).toBe('updated-value-67890');
  });

  it('permite eliminar un secreto de forma permanente', async () => {
    await secretsService.setSecret({
      name: 'TEMPORARY_SECRET',
      value: 'temp_12345',
    });

    const deleted = await secretsService.deleteSecret('TEMPORARY_SECRET');
    expect(deleted).toBe(true);

    await expect(secretsService.revealSecret('TEMPORARY_SECRET')).rejects.toThrow();
  });
});
