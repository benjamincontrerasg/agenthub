import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../lib/crypto.js';
import { auditService } from './audit.service.js';
import { randomUUID } from 'crypto';

export interface SecretItem {
  id: string;
  name: string;
  description?: string | null;
  maskedValue: string;
  category: 'api_key' | 'database' | 'auth' | 'webhook' | 'custom';
  createdAt: string;
  updatedAt: string;
}

function maskSecretValue(val: string): string {
  if (val.length <= 8) {
    return '••••••••';
  }
  const start = val.slice(0, 4);
  const end = val.slice(-4);
  return `${start}••••••••${end}`;
}

export const secretsService = {
  /**
   * Listar todos los secretos registrados con su valor ofuscado (Zero-Trust)
   */
  async getSecrets(): Promise<SecretItem[]> {
    const rows = db.select().from(schema.secrets).all();
    return rows.map((r) => {
      let masked = '••••••••';
      try {
        const decrypted = decrypt(r.encryptedValue);
        masked = maskSecretValue(decrypted);
      } catch {
        masked = '••••[error decrypt]••••';
      }

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        maskedValue: masked,
        category: (r.category as any) || 'custom',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  },

  /**
   * Obtener el valor en texto plano descifrado de un secreto individual.
   * Emite una traza obligatoria en el registro inmutable de auditoría Zero-Trust.
   */
  async revealSecret(
    name: string,
    auditContext?: { userId?: string; userEmail?: string; ip?: string }
  ): Promise<{ name: string; value: string }> {
    const row = db.select().from(schema.secrets).where(eq(schema.secrets.name, name)).get();
    if (!row) {
      throw new Error(`Secreto "${name}" no encontrado en el almacén seguro.`);
    }

    const decrypted = decrypt(row.encryptedValue);

    // Registrar evento de auditoría Zero-Trust
    auditService.log({
      userId: auditContext?.userId || 'system',
      userEmail: auditContext?.userEmail || 'system@nexora.dev',
      action: 'secret.reveal',
      resource: `secret:${name}`,
      status: 'success',
      ip: auditContext?.ip || '127.0.0.1',
      details: {
        secretId: row.id,
        name,
        category: row.category,
      },
    });

    return { name: row.name, value: decrypted };
  },

  /**
   * Crear o actualizar un secreto con cifrado AES-256-GCM.
   */
  async setSecret(
    data: {
      name: string;
      value: string;
      description?: string;
      category?: 'api_key' | 'database' | 'auth' | 'webhook' | 'custom';
    },
    auditContext?: { userId?: string; userEmail?: string; ip?: string }
  ): Promise<SecretItem> {
    const normalizedName = data.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!normalizedName) {
      throw new Error('El nombre de la variable de entorno no es válido.');
    }

    const encrypted = encrypt(data.value);
    const existing = db.select().from(schema.secrets).where(eq(schema.secrets.name, normalizedName)).get();
    const now = new Date().toISOString();

    let secretId = existing?.id;

    if (existing) {
      db.update(schema.secrets)
        .set({
          encryptedValue: encrypted,
          description: data.description !== undefined ? data.description : existing.description,
          category: data.category || existing.category,
          updatedAt: now,
        })
        .where(eq(schema.secrets.name, normalizedName))
        .run();
    } else {
      secretId = randomUUID();
      db.insert(schema.secrets)
        .values({
          id: secretId,
          name: normalizedName,
          encryptedValue: encrypted,
          description: data.description || null,
          category: data.category || 'custom',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    // Registrar evento de auditoría
    auditService.log({
      userId: auditContext?.userId || 'system',
      userEmail: auditContext?.userEmail || 'system@nexora.dev',
      action: existing ? 'secret.update' : 'secret.create',
      resource: `secret:${normalizedName}`,
      status: 'success',
      ip: auditContext?.ip || '127.0.0.1',
      details: {
        name: normalizedName,
        category: data.category || 'custom',
      },
    });

    return {
      id: secretId!,
      name: normalizedName,
      description: data.description || null,
      maskedValue: maskSecretValue(data.value),
      category: data.category || 'custom',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
  },

  /**
   * Eliminar un secreto de forma permanente
   */
  async deleteSecret(
    name: string,
    auditContext?: { userId?: string; userEmail?: string; ip?: string }
  ): Promise<boolean> {
    const existing = db.select().from(schema.secrets).where(eq(schema.secrets.name, name)).get();
    if (!existing) {
      return false;
    }

    db.delete(schema.secrets).where(eq(schema.secrets.name, name)).run();

    auditService.log({
      userId: auditContext?.userId || 'system',
      userEmail: auditContext?.userEmail || 'system@nexora.dev',
      action: 'secret.delete',
      resource: `secret:${name}`,
      status: 'success',
      ip: auditContext?.ip || '127.0.0.1',
      details: {
        name,
        category: existing.category,
      },
    });

    return true;
  },
};
