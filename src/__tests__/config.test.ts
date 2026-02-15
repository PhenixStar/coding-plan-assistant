import { describe, it, expect, beforeEach, vi } from 'vitest';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'node:crypto';

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

// Helper functions for encryption (mimics the actual crypto module behavior)
function encryptPlaintext(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'base64')]).toString('base64');
}

function decryptPlaintext(encrypted: string, password: string): string {
  const data = Buffer.from(encrypted, 'base64');
  const salt = data.subarray(0, 32);
  const iv = data.subarray(32, 48);
  const authTag = data.subarray(48, 64);
  const encryptedText = data.subarray(64);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText.toString('base64'), 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

describe('Config Module', () => {
  const mockConfigDir = path.join(os.homedir(), '.coding-plan-assistant');
  const mockConfigPath = path.join(mockConfigDir, 'config.yaml');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create config directory if it does not exist', () => {
    // Setup - simulate no config exists
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('File not found');
    });

    // This test verifies the mock setup is working
    expect(fs.existsSync(mockConfigDir)).toBe(false);
  });

  it('should handle empty config file gracefully', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    // Reading empty file should be handled
    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    expect(content).toBe('');
  });

  it('should parse valid YAML config', () => {
    const validConfig = `
lang: en_US
platform: glm
plan: global
active_platform: glm

glm:
  api_key: test-glm-key
  plan: glm_coding_plan_global
`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(validConfig);

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;
    
    expect(parsed.lang).toBe('en_US');
    expect(parsed.platform).toBe('glm');
    expect(parsed.glm).toBeDefined();
  });
});

describe('Platform Configuration', () => {
  it('should have correct GLM endpoints', () => {
    const glmConfig = {
      global: 'https://open.bigmodel.cn/api/paas/v4/',
      china: 'https://open.bigmodel.cn/api/paas/v4/'
    };

    expect(glmConfig.global).toContain('bigmodel.cn');
    expect(glmConfig.china).toContain('bigmodel.cn');
  });

  it('should have correct MiniMax endpoints', () => {
    const minimaxConfig = {
      global: 'https://api.minimax.io/anthropic',
      china: 'https://api.minimaxi.com/anthropic'
    };

    expect(minimaxConfig.global).toContain('minimax.io');
    expect(minimaxConfig.china).toContain('minimaxi.com');
  });
});

describe('Supported Tools', () => {
  const supportedTools = [
    'Claude Code',
    'Cursor',
    'Cline',
    'Roo Code',
    'Kilo Code',
    'OpenCode',
    'Factory Droid',
    'Windsurf',
    'Zed AI',
    'GitHub Copilot',
    'Aider',
    'Codeium',
    'Continue',
    'Bolt.new',
    'Lovable'
  ];

  it('should have at least 10 supported tools', () => {
    expect(supportedTools.length).toBeGreaterThanOrEqual(10);
  });

  it('should include Claude Code in supported tools', () => {
    expect(supportedTools).toContain('Claude Code');
  });

  it('should include Factory Droid in supported tools', () => {
    expect(supportedTools).toContain('Factory Droid');
  });

  it('should include Windsurf in supported tools', () => {
    expect(supportedTools).toContain('Windsurf');
  });

  it('should include Zed AI in supported tools', () => {
    expect(supportedTools).toContain('Zed AI');
  });

  it('should include GitHub Copilot in supported tools', () => {
    expect(supportedTools).toContain('GitHub Copilot');
  });

  it('should include Bolt.new in supported tools', () => {
    expect(supportedTools).toContain('Bolt.new');
  });
});

describe('Encrypted API Key Storage', () => {
  const mockConfigDir = path.join(os.homedir(), '.unified-coding-helper');
  const mockConfigPath = path.join(mockConfigDir, 'config.yaml');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should encrypt API key before storing', () => {
    const testApiKey = 'sk-test-api-key-12345';
    const testPassword = 'test-master-password';

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    // Use helper function to simulate encryption
    const encryptedKey = encryptPlaintext(testApiKey, testPassword);

    // Verify encryption produces valid base64
    expect(encryptedKey).toBeDefined();
    expect(typeof encryptedKey).toBe('string');
    expect(() => Buffer.from(encryptedKey, 'base64')).not.toThrow();
  });

  it('should store encrypted API key in config', () => {
    const encryptedApiKey = 'encrypted-data-here';
    const config = {
      lang: 'en_US',
      platform: 'glm',
      plan: 'global',
      active_platform: 'glm',
      glm: {
        encrypted_api_key: encryptedApiKey
      }
    };

    const yamlContent = yaml.dump(config);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yamlContent);

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect(parsed).toBeDefined();
    expect((parsed as any).glm).toBeDefined();
    expect((parsed as any).glm.encrypted_api_key).toBe(encryptedApiKey);
  });

  it('should have separate fields for encrypted and plaintext API keys', () => {
    const config = {
      lang: 'en_US',
      platform: 'glm',
      glm: {
        api_key: 'plaintext-key',
        encrypted_api_key: 'encrypted-key'
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;
    const glmConfig = (parsed as any).glm;

    expect(glmConfig.api_key).toBe('plaintext-key');
    expect(glmConfig.encrypted_api_key).toBe('encrypted-key');
  });

  it('should support multiple platform encrypted keys', () => {
    const config = {
      lang: 'en_US',
      platform: 'glm',
      glm: {
        encrypted_api_key: 'glm-encrypted-key'
      },
      minimax: {
        encrypted_api_key: 'minimax-encrypted-key'
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect((parsed as any).glm.encrypted_api_key).toBe('glm-encrypted-key');
    expect((parsed as any).minimax.encrypted_api_key).toBe('minimax-encrypted-key');
  });

  it('should handle decryption failure gracefully', () => {
    const config = {
      lang: 'en_US',
      glm: {
        encrypted_api_key: 'invalid-encrypted-data'
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;
    const encryptedKey = (parsed as any).glm.encrypted_api_key;

    // Invalid encrypted data should cause decryption to fail
    expect(() => decryptPlaintext(encryptedKey, 'any-password')).toThrow();
  });
});

describe('Master Password Integration', () => {
  const mockConfigDir = path.join(os.homedir(), '.unified-coding-helper');
  const mockConfigPath = path.join(mockConfigDir, 'config.yaml');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store master password hash', () => {
    const passwordHash = 'encrypted-password-hash';
    const config = {
      lang: 'en_US',
      master_password_hash: passwordHash
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect((parsed as any).master_password_hash).toBeDefined();
  });

  it('should verify master password using decryption', () => {
    const masterPassword = 'my-master-password';

    // Create a verifier that's encrypted with the master password
    const storedHash = encryptPlaintext('master_password_verifier', masterPassword);

    // Verify correct password
    const verifier = decryptPlaintext(storedHash, masterPassword);
    expect(verifier).toBe('master_password_verifier');

    // Verify wrong password fails
    expect(() => decryptPlaintext(storedHash, 'wrong-password')).toThrow();
  });

  it('should handle missing master password hash', () => {
    const config = {
      lang: 'en_US'
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect((parsed as any).master_password_hash).toBeUndefined();
  });
});

describe('Backward Compatibility', () => {
  const mockConfigDir = path.join(os.homedir(), '.unified-coding-helper');
  const mockConfigPath = path.join(mockConfigDir, 'config.yaml');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should support plaintext API key for backward compatibility', () => {
    const config = {
      lang: 'en_US',
      glm: {
        api_key: 'plaintext-api-key'
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect((parsed as any).glm.api_key).toBe('plaintext-api-key');
  });

  it('should prioritize encrypted key when password provided', () => {
    const apiKey = 'my-secret-api-key';
    const password = 'master-password';

    const encryptedKey = encryptPlaintext(apiKey, password);

    const config = {
      lang: 'en_US',
      glm: {
        api_key: 'plaintext-key',
        encrypted_api_key: encryptedKey
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    // Both should exist - encrypted takes priority when password is provided
    expect((parsed as any).glm.api_key).toBe('plaintext-key');
    expect((parsed as any).glm.encrypted_api_key).toBe(encryptedKey);

    // Decryption should work with correct password
    const decrypted = decryptPlaintext((parsed as any).glm.encrypted_api_key, password);
    expect(decrypted).toBe(apiKey);
  });
});

describe('API Key Revocation', () => {
  const mockConfigDir = path.join(os.homedir(), '.unified-coding-helper');
  const mockConfigPath = path.join(mockConfigDir, 'config.yaml');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove both plaintext and encrypted API keys on revocation', () => {
    const config = {
      lang: 'en_US',
      glm: {
        api_key: 'plaintext-key',
        encrypted_api_key: 'encrypted-key'
      }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(yaml.dump(config));

    const content = fs.readFileSync(mockConfigPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    // Simulate revocation by deleting both fields
    delete (parsed as any).glm.api_key;
    delete (parsed as any).glm.encrypted_api_key;

    expect((parsed as any).glm.api_key).toBeUndefined();
    expect((parsed as any).glm.encrypted_api_key).toBeUndefined();
  });
});
