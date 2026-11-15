import { createCipheriv, createDecipheriv, randomBytes, scryptSync, hkdfSync } from 'crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const V2_IV_LENGTH = 12; // NIST standard 96-bit nonce for AES-GCM
const TAG_LENGTH = 16;
const V1_IV_LENGTH = 16;
const V1_SALT_LENGTH = 16;
const V2_DOMAIN_SALT = Buffer.from('nexora-crypto-domain-v2-salt', 'utf8');

// Key cache so keys are derived exactly once per master key at startup / first use
const v2KeyCache = new Map<string, Buffer>();
const v1KeyCache = new Map<string, Buffer>();

export function deriveKeyV2(masterKey: string): Buffer {
  let key = v2KeyCache.get(masterKey);
  if (!key) {
    // HKDF / scrypt derivation derived once at startup
    key = Buffer.from(hkdfSync('sha256', masterKey, V2_DOMAIN_SALT, 'nexora-aes-256-gcm-key', 32));
    v2KeyCache.set(masterKey, key);
  }
  return key;
}

function getOrDeriveKeyV1(masterKey: string, salt: Buffer): Buffer {
  const cacheKey = `${masterKey}:${salt.toString('hex')}`;
  let key = v1KeyCache.get(cacheKey);
  if (!key) {
    key = scryptSync(masterKey, salt, 32);
    if (v1KeyCache.size > 2000) v1KeyCache.clear();
    v1KeyCache.set(cacheKey, key);
  }
  return key;
}

/**
 * Cifra un texto plano utilizando el formato moderno 'v2:' con IV de 12 bytes y derivación única.
 */
export function encryptWithKey(plaintext: string, masterKey: string): string {
  const key = deriveKeyV2(masterKey);
  const iv = randomBytes(V2_IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v2:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Descifra tanto el formato moderno 'v2:' como el formato heredado 'v1' (salt:iv:tag:ciphertext).
 */
export function decryptWithKey(ciphertext: string, masterKey: string): string {
  if (ciphertext.startsWith('v2:')) {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Formato de cifrado v2 inválido o corrupto.');
    }
    const iv = Buffer.from(parts[1], 'base64');
    const tag = Buffer.from(parts[2], 'base64');
    const encrypted = Buffer.from(parts[3], 'base64');

    const key = deriveKeyV2(masterKey);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }

  // Compatibilidad con formato heredado v1 (salt:iv:tag:ciphertext todo en un buffer base64)
  const data = Buffer.from(ciphertext, 'base64');
  if (data.length < V1_SALT_LENGTH + V1_IV_LENGTH + TAG_LENGTH) {
    throw new Error('Longitud de datos cifrados insuficiente para formato v1.');
  }

  const salt = data.subarray(0, V1_SALT_LENGTH);
  const iv = data.subarray(V1_SALT_LENGTH, V1_SALT_LENGTH + V1_IV_LENGTH);
  const tag = data.subarray(V1_SALT_LENGTH + V1_IV_LENGTH, V1_SALT_LENGTH + V1_IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(V1_SALT_LENGTH + V1_IV_LENGTH + TAG_LENGTH);

  const key = getOrDeriveKeyV1(masterKey, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Cifra utilizando la clave principal activa configurada en el sistema.
 */
export function encrypt(plaintext: string): string {
  return encryptWithKey(plaintext, config.encryptionKey);
}

/**
 * Descifra con la clave actual o, en ventana de rotación, con la clave previa sin downtime.
 */
export function decrypt(ciphertext: string): string {
  try {
    return decryptWithKey(ciphertext, config.encryptionKey);
  } catch (err: any) {
    if (config.previousEncryptionKey) {
      try {
        return decryptWithKey(ciphertext, config.previousEncryptionKey);
      } catch {}
    }
    throw err;
  }
}
