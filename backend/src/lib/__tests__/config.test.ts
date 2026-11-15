import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('PASO 3 — Validación de Configuración y Claves Maestras', () => {
  const backendRoot = path.resolve(__dirname, '../../../');

  it('falla al arrancar si ENCRYPTION_KEY está ausente o tiene menos de 32 caracteres', () => {
    expect(() => {
      execSync('npx tsx -e "require(\'./src/config.js\')"', {
        cwd: backendRoot,
        env: {
          ...process.env,
          ENCRYPTION_KEY: 'clave-corta-insegura',
          JWT_SECRET: 'jwt-secret-valida-minimo-32-caracteres-largo!!',
        },
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('falla al arrancar si JWT_SECRET está ausente o tiene menos de 32 caracteres', () => {
    expect(() => {
      execSync('npx tsx -e "require(\'./src/config.js\')"', {
        cwd: backendRoot,
        env: {
          ...process.env,
          ENCRYPTION_KEY: 'encryption-key-valida-minimo-32-caracteres-largo!!',
          JWT_SECRET: 'jwt-corto',
        },
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('falla al arrancar si JWT_SECRET y ENCRYPTION_KEY son idénticas (violación de separación de dominios)', () => {
    expect(() => {
      execSync('npx tsx -e "require(\'./src/config.js\')"', {
        cwd: backendRoot,
        env: {
          ...process.env,
          ENCRYPTION_KEY: 'esta-es-una-clave-larga-compartida-32-chars!!',
          JWT_SECRET: 'esta-es-una-clave-larga-compartida-32-chars!!',
        },
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('arranca exitosamente cuando ambas claves son válidas, mayores a 32 caracteres y distintas', () => {
    const output = execSync(
      'npx tsx -e "import(\'./src/config.js\').then(m => console.log(\'CONFIG_OK\'))"',
      {
        cwd: backendRoot,
        env: {
          ...process.env,
          ENCRYPTION_KEY: 'clave-de-cifrado-falsa-minimo-32-caracteres-ok!!',
          JWT_SECRET: 'clave-jwt-secret-falsa-minimo-32-caracteres-ok!!',
        },
        stdio: 'pipe',
      }
    ).toString();

    expect(output).toContain('CONFIG_OK');
  });
});
