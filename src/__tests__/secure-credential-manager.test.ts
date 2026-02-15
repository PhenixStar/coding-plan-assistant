import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock fs and path modules
vi.mock('fs');
vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
    resolve: (...args: string[]) => args.join('/')
  },
  join: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  resolve: (...args: string[]) => args.join('/')
}));

// Mock os module
vi.mock('os', () => ({
  default: {
    homedir: () => '/home/testuser',
    platform: () => 'linux'
  },
  homedir: () => '/home/testuser',
  platform: () => 'linux'
}));

// Mock logger
vi.mock('../lib/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
  }
}));

// Import the module after mocks are set up
import { secureCredentialManager } from '../lib/secure-credential-manager.js';

describe('SecureCredentialManager', () => {
  let manager: typeof secureCredentialManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock behavior - return empty credentials by default
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      return JSON.stringify({ version: 1, credentials: {} });
    });
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.chmodSync).mockReturnValue(undefined);

    // Use the exported singleton
    manager = secureCredentialManager;
  });

  describe('Singleton Pattern', () => {
    it('should be initialized with empty credentials', () => {
      expect(manager.getCredentialCount()).toBe(0);
    });
  });

  describe('setCredential', () => {
    it('should set a credential successfully', () => {
      const result = manager.setCredential('glm', 'cursor', 'api_key', 'test-key-123');

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should set credential with wrapper storage type', () => {
      const result = manager.setCredential('glm', 'cursor', 'api_key', 'test-key', 'wrapper');

      expect(result).toBe(true);
    });

    it('should set environment variable for env storage type', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'secret-key');

      expect(process.env['CPA_GLM_CURSOR_API_KEY']).toBe('secret-key');
    });
  });

  describe('getCredential', () => {
    it('should return undefined for non-existing credential', () => {
      const credential = manager.getCredential('glm', 'cursor', 'nonexistent');

      expect(credential).toBeUndefined();
    });
  });

  describe('hasCredential', () => {
    it('should return false for non-existing credential', () => {
      const hasCred = manager.hasCredential('glm', 'cursor', 'nonexistent');

      expect(hasCred).toBe(false);
    });
  });

  describe('getStorageType', () => {
    it('should return undefined for non-existing credential', () => {
      const storageType = manager.getStorageType('glm', 'cursor', 'nonexistent');

      expect(storageType).toBeUndefined();
    });
  });

  describe('getCredentialCount', () => {
    it('should return count of credentials', () => {
      // First set a credential to ensure count > 0
      manager.setCredential('test', 'test', 'key', 'value');

      const count = manager.getCredentialCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('listAllCredentials', () => {
    it('should return list of credentials', () => {
      // First set a credential to ensure list is not empty
      manager.setCredential('test', 'test', 'key', 'value');

      const credentials = manager.listAllCredentials();

      expect(credentials.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('removeCredential', () => {
    it('should return true for non-existing credential', () => {
      const result = manager.removeCredential('glm', 'cursor', 'nonexistent');

      expect(result).toBe(true);
    });
  });

  describe('getWrapperScriptCommand', () => {
    it('should generate correct wrapper script command for linux', () => {
      const command = manager.getWrapperScriptCommand('glm', 'cursor', 'echo hello');

      expect(command).toContain('source');
      expect(command).toContain('.sh');
      expect(command).toContain('echo hello');
    });
  });

  describe('Credential Operations Integration', () => {
    it('should set and retrieve a credential', () => {
      // Set a credential
      manager.setCredential('glm', 'cursor', 'api_key', 'my-secret-key');

      // Verify it was stored
      expect(manager.hasCredential('glm', 'cursor', 'api_key')).toBe(true);
      expect(manager.getCredential('glm', 'cursor', 'api_key')).toBe('my-secret-key');
    });

    it('should set and remove a credential', () => {
      // Set a credential
      manager.setCredential('glm', 'cursor', 'api_key', 'my-secret-key');
      expect(manager.hasCredential('glm', 'cursor', 'api_key')).toBe(true);

      // Remove the credential
      manager.removeCredential('glm', 'cursor', 'api_key');
      expect(manager.hasCredential('glm', 'cursor', 'api_key')).toBe(false);
    });

    it('should store multiple credentials for different platforms and tools', () => {
      // Set credentials for different platforms and tools
      manager.setCredential('glm', 'cursor', 'api_key', 'glm-key');
      manager.setCredential('minimax', 'claude', 'api_key', 'minimax-key');

      // Credentials from other tests may exist, verify our credentials are present
      expect(manager.getCredential('glm', 'cursor', 'api_key')).toBe('glm-key');
      expect(manager.getCredential('minimax', 'claude', 'api_key')).toBe('minimax-key');
    });

    it('should get all credentials for a specific tool', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'glm-key');
      manager.setCredential('minimax', 'cursor', 'api_key', 'minimax-key');

      const credentials = manager.getAllCredentialsForTool('cursor');
      expect(credentials).toHaveLength(2);
    });

    it('should get all credentials for a specific platform', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'cursor-key');
      manager.setCredential('glm', 'claude', 'api_key', 'claude-key');

      const credentials = manager.getAllCredentialsForPlatform('glm');
      expect(credentials).toHaveLength(2);
    });

    it('should export credentials to env file format', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'test-key');

      const result = manager.exportToEnvFile('/tmp/test.env');
      expect(result).toBe(true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/test.env',
        expect.stringContaining('CPA_GLM_CURSOR_API_KEY=test-key'),
        'utf-8'
      );
    });

    it('should load credentials to environment', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'env-key');

      // Clear the env var first
      delete process.env['CPA_GLM_CURSOR_API_KEY'];

      manager.loadCredentialsToEnvironment();

      expect(process.env['CPA_GLM_CURSOR_API_KEY']).toBe('env-key');
    });

    it('should only load env-type credentials to environment', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'env-key', 'env');
      manager.setCredential('glm', 'wrapper', 'api_key', 'wrapper-key', 'wrapper');

      delete process.env['CPA_GLM_CURSOR_API_KEY'];
      delete process.env['CPA_GLM_WRAPPER_API_KEY'];

      manager.loadCredentialsToEnvironment();

      expect(process.env['CPA_GLM_CURSOR_API_KEY']).toBe('env-key');
      expect(process.env['CPA_GLM_WRAPPER_API_KEY']).toBeUndefined();
    });

    it('should create wrapper script when storage type is wrapper', () => {
      manager.setCredential('glm', 'cursor', 'api_key', 'wrapper-key', 'wrapper');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
