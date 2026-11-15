import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

// Key cache to avoid recomputing expensive scrypt derivations on every request
const keyCache = new Map<string, Buffer>();

function getOrDeriveKey(masterKey: string, salt: Buffer): Buffer {
  const cacheKey = `${masterKey}:${salt.toString('hex')}`;
  let key = keyCache.get(cacheKey);
  if (!key) {
    key = scryptSync(masterKey, salt, 32);
    // Limit cache size to prevent unbounded memory growth
    if (keyCache.size > 2000) {
      keyCache.clear();
    }
    keyCache.set(cacheKey, key);
  }
  return key;
}

export function encryptWithKey(plaintext: string, masterKey: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = getOrDeriveKey(masterKey, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // salt:iv:tag:ciphertext, all base64
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptWithKey(ciphertext: string, masterKey: string): string {
  const data = Buffer.from(ciphertext, 'base64');

  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = getOrDeriveKey(masterKey, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

export function encrypt(plaintext: string): string {
  return encryptWithKey(plaintext, config.encryptionKey);
}

export function decrypt(ciphertext: string): string {
  return decryptWithKey(ciphertext, config.encryptionKey);
}
