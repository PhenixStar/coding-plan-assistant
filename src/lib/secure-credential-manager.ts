import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { logger } from './logger.js';

const CPA_STATE_DIR = path.join(os.homedir(), '.unified-coding-helper');
const WRAPPER_SCRIPTS_DIR = path.join(CPA_STATE_DIR, 'wrapper-scripts');
const ENV_VARS_FILE = path.join(CPA_STATE_DIR, 'env-credentials.json.enc');
const KEY_FILE = path.join(CPA_STATE_DIR, 'credential-key.bin');

// Encryption key derived from machine-specific information
let encryptionKey: Buffer | null = null;

export type CredentialStorageType = 'env' | 'wrapper' | 'keychain';

interface CredentialEntry {
  platformId: string;
  toolId: string;
  key: string;
  value: string;
  storageType: CredentialStorageType;
  createdAt: number;
  updatedAt: number;
}

interface CredentialStore {
  version: number;
  credentials: Record<string, CredentialEntry>;
}

const DEFAULT_CREDENTIAL_STORE: CredentialStore = {
  version: 1,
  credentials: {}
};

// Encryption utilities using AES-256-GCM
function getEncryptionKey(): Buffer {
  if (encryptionKey) {
    return encryptionKey;
  }

  // Try to load existing key
  if (fs.existsSync(KEY_FILE)) {
    try {
      encryptionKey = fs.readFileSync(KEY_FILE);
      return encryptionKey;
    } catch (error) {
      logger.warning('Failed to load encryption key, generating new one');
    }
  }

  // Generate a new machine-derived key
  const machineId = os.hostname() + os.homedir() + os.platform() + os.arch();
  const salt = 'unified-coding-helper-v1';
  encryptionKey = crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256');

  // Save key with restricted permissions
  try {
    fs.writeFileSync(KEY_FILE, encryptionKey);
    // Set restrictive permissions on key file (Unix-like systems)
    if (process.platform !== 'win32') {
      fs.chmodSync(KEY_FILE, 0o600);
    }
  } catch (error) {
    logger.warning('Could not save encryption key file');
  }

  return encryptionKey;
}

function encrypt(data: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV + AuthTag + Encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

class SecureCredentialManager {
  private static instance: SecureCredentialManager;
  private store: CredentialStore;

  private constructor() {
    this.store = this.loadStore();
  }

  static getInstance(): SecureCredentialManager {
    if (!SecureCredentialManager.instance) {
      SecureCredentialManager.instance = new SecureCredentialManager();
    }
    return SecureCredentialManager.instance;
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(CPA_STATE_DIR)) {
      fs.mkdirSync(CPA_STATE_DIR, { recursive: true });
    }
    if (!fs.existsSync(WRAPPER_SCRIPTS_DIR)) {
      fs.mkdirSync(WRAPPER_SCRIPTS_DIR, { recursive: true });
    }
  }

  private loadStore(): CredentialStore {
    this.ensureDirectories();
    try {
      // First check for encrypted file
      const encryptedFile = ENV_VARS_FILE;
      if (fs.existsSync(encryptedFile)) {
        const encryptedContent = fs.readFileSync(encryptedFile, 'utf-8');
        const decryptedContent = decrypt(encryptedContent);
        const loaded = JSON.parse(decryptedContent) as CredentialStore;
        return loaded;
      }
      // Legacy plaintext file - migrate to encrypted
      const legacyFile = ENV_VARS_FILE.replace('.enc', '');
      if (fs.existsSync(legacyFile)) {
        logger.info('Migrating legacy plaintext credentials to encrypted storage');
        const content = fs.readFileSync(legacyFile, 'utf-8');
        const loaded = JSON.parse(content) as CredentialStore;
        // Save in encrypted format
        this.store = loaded;
        this.saveStore();
        // Remove legacy file
        try {
          fs.unlinkSync(legacyFile);
        } catch (e) {
          // Ignore deletion errors
        }
        return loaded;
      }
    } catch (error) {
      logger.warning(`Failed to load credential store: ${error}`);
    }
    return { ...DEFAULT_CREDENTIAL_STORE };
  }

  private saveStore(): void {
    this.ensureDirectories();
    try {
      const plaintext = JSON.stringify(this.store, null, 2);
      const encrypted = encrypt(plaintext);
      fs.writeFileSync(ENV_VARS_FILE, encrypted, 'utf-8');
    } catch (error) {
      logger.error(`Failed to save credential store: ${error}`);
    }
  }

  private generateCredentialKey(platformId: string, toolId: string, key: string): string {
    return `${platformId}:${toolId}:${key}`;
  }

  setCredential(
    platformId: string,
    toolId: string,
    key: string,
    value: string,
    storageType: CredentialStorageType = 'env'
  ): boolean {
    try {
      const credentialKey = this.generateCredentialKey(platformId, toolId, key);
      const now = Date.now();

      this.store.credentials[credentialKey] = {
        platformId,
        toolId,
        key,
        value,
        storageType,
        createdAt: this.store.credentials[credentialKey]?.createdAt || now,
        updatedAt: now
      };

      this.saveStore();

      if (storageType === 'env') {
        return this.setupEnvBasedCredential(platformId, toolId, key, value);
      } else if (storageType === 'wrapper') {
        return this.createWrapperScript(platformId, toolId);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to set credential: ${error}`);
      return false;
    }
  }

  getCredential(platformId: string, toolId: string, key: string): string | undefined {
    const credentialKey = this.generateCredentialKey(platformId, toolId, key);
    return this.store.credentials[credentialKey]?.value;
  }

  removeCredential(platformId: string, toolId: string, key: string): boolean {
    try {
      const credentialKey = this.generateCredentialKey(platformId, toolId, key);
      const credential = this.store.credentials[credentialKey];

      if (!credential) {
        return true;
      }

      if (credential.storageType === 'wrapper') {
        this.removeWrapperScript(platformId, toolId);
      }

      delete this.store.credentials[credentialKey];
      this.saveStore();

      return true;
    } catch (error) {
      logger.error(`Failed to remove credential: ${error}`);
      return false;
    }
  }

  getAllCredentialsForTool(toolId: string): CredentialEntry[] {
    return Object.values(this.store.credentials).filter(c => c.toolId === toolId);
  }

  getAllCredentialsForPlatform(platformId: string): CredentialEntry[] {
    return Object.values(this.store.credentials).filter(c => c.platformId === platformId);
  }

  clearAllCredentials(): void {
    const toolIds = [...new Set(Object.values(this.store.credentials).map(c => c.toolId))];
    const platformIds = [...new Set(Object.values(this.store.credentials).map(c => c.platformId))];

    for (const toolId of toolIds) {
      for (const platformId of platformIds) {
        this.removeWrapperScript(platformId, toolId);
      }
    }

    this.store = { ...DEFAULT_CREDENTIAL_STORE };
    this.saveStore();
  }

  private setupEnvBasedCredential(
    platformId: string,
    toolId: string,
    key: string,
    value: string
  ): boolean {
    try {
      const envKey = this.getEnvVarName(platformId, toolId, key);
      process.env[envKey] = value;
      return true;
    } catch (error) {
      logger.error(`Failed to setup env-based credential: ${error}`);
      return false;
    }
  }

  private getEnvVarName(platformId: string, toolId: string, key: string): string {
    const sanitizedPlatform = platformId.toUpperCase().replace(/-/g, '_');
    const sanitizedTool = toolId.toUpperCase().replace(/-/g, '_');
    const sanitizedKey = key.toUpperCase().replace(/-/g, '_');
    return `CPA_${sanitizedPlatform}_${sanitizedTool}_${sanitizedKey}`;
  }

  createWrapperScript(platformId: string, toolId: string): boolean {
    try {
      const credentials = this.getAllCredentialsForTool(toolId).filter(
        c => c.platformId === platformId
      );

      if (credentials.length === 0) {
        return false;
      }

      const scriptPath = this.getWrapperScriptPath(platformId, toolId);
      const isWindows = os.platform() === 'win32';

      // For wrapper scripts, we export environment variable names only
      // The actual values will be sourced from encrypted storage at runtime
      // This prevents plaintext credentials from being written to disk in scripts
      const envVarExports = credentials.map(c => {
        const envKey = this.getEnvVarName(c.platformId, c.toolId, c.key);
        return envKey;
      }).join(' ');

      if (isWindows) {
        // Windows batch script that sources credentials from CPA CLI
        // This avoids storing plaintext credentials in the script
        const batchContent = `@echo off
REM Wrapper script for ${platformId}/${toolId}
REM Credentials are sourced from secure encrypted storage via CPA CLI
REM To use: run "cpa env source ${platformId} ${toolId}" before your command
`;
        fs.writeFileSync(scriptPath + '.bat', batchContent, 'utf-8');
      } else {
        // Unix script that sources from encrypted storage via CPA CLI
        // The credentials will be loaded into environment at runtime
        const bashContent = `#!/bin/bash
# Wrapper script for ${platformId}/${toolId}
# Credentials are sourced from secure encrypted storage via CPA CLI
# To use: run "source <(cpa env export ${platformId} ${toolId})" before your command
# Or use: cpa env run --platform ${platformId} --tool ${toolId} -- <command>

`;
        fs.writeFileSync(scriptPath + '.sh', bashContent, 'utf-8');
        fs.chmodSync(scriptPath + '.sh', 0o755);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to create wrapper script: ${error}`);
      return false;
    }
  }

  private getWrapperScriptPath(platformId: string, toolId: string): string {
    const sanitizedPlatform = platformId.replace(/-/g, '_');
    const sanitizedTool = toolId.replace(/-/g, '_');
    return path.join(WRAPPER_SCRIPTS_DIR, `${sanitizedPlatform}_${sanitizedTool}`);
  }

  getWrapperScriptCommand(platformId: string, toolId: string, command: string): string {
    const scriptPath = this.getWrapperScriptPath(platformId, toolId);
    const isWindows = os.platform() === 'win32';
    const ext = isWindows ? '.bat' : '.sh';

    if (isWindows) {
      return `${scriptPath}${ext} && ${command}`;
    } else {
      return `source ${scriptPath}${ext} && ${command}`;
    }
  }

  private removeWrapperScript(platformId: string, toolId: string): boolean {
    try {
      const scriptPath = this.getWrapperScriptPath(platformId, toolId);
      const isWindows = os.platform() === 'win32';

      if (isWindows) {
        const batPath = scriptPath + '.bat';
        if (fs.existsSync(batPath)) {
          fs.unlinkSync(batPath);
        }
      } else {
        const shPath = scriptPath + '.sh';
        if (fs.existsSync(shPath)) {
          fs.unlinkSync(shPath);
        }
      }

      return true;
    } catch (error) {
      logger.error(`Failed to remove wrapper script: ${error}`);
      return false;
    }
  }

  hasCredential(platformId: string, toolId: string, key: string): boolean {
    const credentialKey = this.generateCredentialKey(platformId, toolId, key);
    return !!this.store.credentials[credentialKey];
  }

  getStorageType(platformId: string, toolId: string, key: string): CredentialStorageType | undefined {
    const credentialKey = this.generateCredentialKey(platformId, toolId, key);
    return this.store.credentials[credentialKey]?.storageType;
  }

  getCredentialCount(): number {
    return Object.keys(this.store.credentials).length;
  }

  listAllCredentials(): CredentialEntry[] {
    return Object.values(this.store.credentials);
  }

  exportToEnvFile(filePath: string): boolean {
    try {
      const credentials = Object.values(this.store.credentials);
      const envContent = credentials.map(c => {
        const envKey = this.getEnvVarName(c.platformId, c.toolId, c.key);
        return `${envKey}=${c.value}`;
      }).join('\n');

      fs.writeFileSync(filePath, envContent, 'utf-8');
      return true;
    } catch (error) {
      logger.error(`Failed to export to env file: ${error}`);
      return false;
    }
  }

  // Export credentials to stdout for sourcing (used by wrapper scripts)
  exportCredentialsForSourcing(platformId: string, toolId: string): string {
    const credentials = this.getAllCredentialsForTool(toolId).filter(
      c => c.platformId === platformId
    );

    return credentials.map(c => {
      const envKey = this.getEnvVarName(c.platformId, c.toolId, c.key);
      return `export ${envKey}="${c.value}"`;
    }).join('\n');
  }

  isToolUsingSecureStorage(toolId: string, platformId: string): boolean {
    const credentials = this.getAllCredentialsForTool(toolId).filter(
      c => c.platformId === platformId
    );
    return credentials.length > 0 && credentials.every(c => c.storageType !== 'env' || this.hasEnvVarSet(c));
  }

  private hasEnvVarSet(credential: CredentialEntry): boolean {
    const envKey = this.getEnvVarName(credential.platformId, credential.toolId, credential.key);
    return !!process.env[envKey];
  }

  loadCredentialsToEnvironment(): void {
    const credentials = Object.values(this.store.credentials);
    for (const credential of credentials) {
      if (credential.storageType === 'env') {
        const envKey = this.getEnvVarName(credential.platformId, credential.toolId, credential.key);
        process.env[envKey] = credential.value;
      }
    }
  }
}

export const secureCredentialManager = SecureCredentialManager.getInstance();
