import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptWithKey, decryptWithKey } from '../crypto.js';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';

describe('Crypto Service (AES-256-GCM v2 with Legacy Compatibility)', () => {
  it('correctly encrypts with modern v2: format and decrypts accurately', () => {
    const rawApiKey = 'sk-ant-api03-test-key-sample-1234567890';
    const encrypted = encrypt(rawApiKey);

    expect(encrypted.startsWith('v2:')).toBe(true);
    expect(encrypted).not.toBe(rawApiKey);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawApiKey);
  });

  it('produces different ciphertexts for the same plaintext due to random 12-byte IV', () => {
    const secret = 'sk-proj-openai-secret-key-abcdef';
    const enc1 = encrypt(secret);
    const enc2 = encrypt(secret);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(secret);
    expect(decrypt(enc2)).toBe(secret);
  });

  it('maintains backward compatibility with legacy v1 format (salt:iv:tag:ciphertext)', () => {
    const secret = 'legacy-key-from-database-v1';
    const masterKey = 'dev-encryption-key-change-in-production-32chars!!';

    // Generar formato v1 clásico
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    const key = scryptSync(masterKey, salt, 32);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const legacyCiphertext = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');

    expect(legacyCiphertext.startsWith('v2:')).toBe(false);

    // decryptWithKey debe ser capaz de descifrar el formato v1 antiguo sin errores
    const decrypted = decryptWithKey(legacyCiphertext, masterKey);
    expect(decrypted).toBe(secret);
  });

  it('fails to decrypt if ciphertext or auth tag is tampered with', () => {
    const secret = 'sensitive-data';
    const encrypted = encrypt(secret);
    const tampered = encrypted.substring(0, encrypted.length - 4) + 'AAAA';

    expect(() => decrypt(tampered)).toThrow();
  });

  it('supports multi-key encryption and seamless key rotation', () => {
    const secret = 'sk-prod-rotation-test-secret';
    const oldKey = 'old-master-key-32-chars-long-abc!!';
    const newKey = 'new-master-key-32-chars-long-xyz!!';

    // 1. Encrypt with old key
    const encryptedOld = encryptWithKey(secret, oldKey);
    expect(decryptWithKey(encryptedOld, oldKey)).toBe(secret);

    // Old key fails with wrong key
    expect(() => decryptWithKey(encryptedOld, newKey)).toThrow();

    // 2. Rotate to new key: decrypt with old, encrypt with new
    const plainFromOld = decryptWithKey(encryptedOld, oldKey);
    const encryptedNew = encryptWithKey(plainFromOld, newKey);

    // 3. New key decrypts successfully
    expect(decryptWithKey(encryptedNew, newKey)).toBe(secret);
  });
});
