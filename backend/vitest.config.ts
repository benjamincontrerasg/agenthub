import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    env: {
      ENCRYPTION_KEY: 'test-fake-encryption-key-min-32chars-for-vitest-suite!!',
      JWT_SECRET: 'test-fake-jwt-secret-min-32chars-for-vitest-suite-auth!!',
    },
  },
});
