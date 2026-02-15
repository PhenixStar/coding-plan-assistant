/**
 * TypeScript types for the crypto module
 * Provides encryption/decryption using AES-256-GCM with PBKDF2 key derivation
 */

/**
 * Encrypted data container
 * Base64 encoded string containing: salt + iv + authTag + ciphertext
 */
export type EncryptedData = string;

/**
 * Plaintext content to be encrypted
 */
export type Plaintext = string;

/**
 * Password used for encryption/decryption
 */
export type Password = string;

/**
 * Crypto module function signatures
 */
export interface CryptoFunctions {
  encrypt: (plaintext: Plaintext, password: Password) => EncryptedData;
  decrypt: (ciphertext: EncryptedData, password: Password) => Plaintext;
}
