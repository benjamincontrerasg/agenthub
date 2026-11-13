import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../crypto.js';

describe('Crypto Service (AES-256-GCM)', () => {
  it('correctly encrypts and decrypts a sensitive API key', () => {
    const rawApiKey = 'sk-ant-api03-test-key-sample-1234567890';
    const encrypted = encrypt(rawApiKey);

    expect(encrypted).not.toBe(rawApiKey);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(32);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawApiKey);
  });

  it('produces different ciphertexts for the same plaintext due to random IV and salt', () => {
    const secret = 'sk-proj-openai-secret-key-abcdef';
    const enc1 = encrypt(secret);
    const enc2 = encrypt(secret);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(secret);
    expect(decrypt(enc2)).toBe(secret);
  });

  it('fails to decrypt if ciphertext is tampered with', () => {
    const secret = 'sensitive-data';
    const encrypted = encrypt(secret);
    const tampered = encrypted.substring(0, encrypted.length - 4) + 'AAAA';

    expect(() => decrypt(tampered)).toThrow();
  });
});
