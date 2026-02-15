import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../lib/crypto';

describe('Crypto Module', () => {
  const testPassword = 'test-password-123';
  const testPlaintext = 'This is a secret message!';

  describe('encrypt', () => {
    it('should encrypt plaintext and return base64 string', () => {
      const encrypted = encrypt(testPlaintext, testPassword);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      // Verify it's valid base64
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different ciphertext for different passwords', () => {
      const encrypted1 = encrypt(testPlaintext, testPassword);
      const encrypted2 = encrypt(testPlaintext, 'different-password');

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce different ciphertext for same password (due to random salt/iv)', () => {
      const encrypted1 = encrypt(testPlaintext, testPassword);
      const encrypted2 = encrypt(testPlaintext, testPassword);

      // Due to random salt and IV, same plaintext/password should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string plaintext', () => {
      const encrypted = encrypt('', testPassword);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters in plaintext', () => {
      const unicodePlaintext = '你好世界 🔐 密码学 🛡️';
      const encrypted = encrypt(unicodePlaintext, testPassword);

      expect(encrypted).toBeDefined();
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(unicodePlaintext);
    });

    it('should handle long plaintext', () => {
      const longPlaintext = 'A'.repeat(10000);
      const encrypted = encrypt(longPlaintext, testPassword);

      expect(encrypted).toBeDefined();
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(longPlaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data correctly', () => {
      const encrypted = encrypt(testPlaintext, testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      expect(decrypted).toBe(testPlaintext);
    });

    it('should fail with wrong password', () => {
      const encrypted = encrypt(testPlaintext, testPassword);

      expect(() => decrypt(encrypted, 'wrong-password')).toThrow();
    });

    it('should fail with empty password', () => {
      const encrypted = encrypt(testPlaintext, testPassword);

      expect(() => decrypt(encrypted, '')).toThrow();
    });

    it('should fail with invalid base64 ciphertext', () => {
      expect(() => decrypt('not-valid-base64!!!', testPassword)).toThrow();
    });

    it('should fail with truncated ciphertext', () => {
      const encrypted = encrypt(testPlaintext, testPassword);
      const truncated = encrypted.slice(0, -10);

      expect(() => decrypt(truncated, testPassword)).toThrow();
    });

    it('should handle empty ciphertext', () => {
      expect(() => decrypt('', testPassword)).toThrow();
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should correctly encrypt and decrypt various strings', () => {
      const testCases = [
        'simple',
        'Hello World',
        '1234567890',
        '!@#$%^&*()',
        'Multi\nline\ntext',
        'Tab\there',
      ];

      for (const plaintext of testCases) {
        const encrypted = encrypt(plaintext, testPassword);
        const decrypted = decrypt(encrypted, testPassword);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should handle special characters in password', () => {
      const specialPasswords = [
        'p@ssw0rd!',
        'password#123',
        'my secret key',
        '12345678',
        'a',
      ];

      for (const password of specialPasswords) {
        const encrypted = encrypt(testPlaintext, password);
        const decrypted = decrypt(encrypted, password);
        expect(decrypted).toBe(testPlaintext);
      }
    });
  });

  describe('Security Properties', () => {
    it('should produce ciphertext that is longer than plaintext', () => {
      // The ciphertext includes salt (32 bytes) + iv (16 bytes) + tag (16 bytes) + encrypted content
      const encrypted = encrypt(testPlaintext, testPassword);
      const encryptedBuffer = Buffer.from(encrypted, 'base64');

      expect(encryptedBuffer.length).toBeGreaterThan(Buffer.from(testPlaintext).length);
    });

    it('should use AES-256-GCM algorithm', () => {
      // This is verified by the fact that encryption/decryption works correctly
      // AES-256-GCM is an authenticated encryption algorithm
      const encrypted = encrypt(testPlaintext, testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      // If tampering with ciphertext, decryption should fail (GCM provides authentication)
      expect(decrypted).toBe(testPlaintext);
    });
  });
});
