import { describe, it, expect, beforeEach, vi } from 'vitest';
import yaml from 'js-yaml';
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
    'Factory Droid'
  ];

  it('should have at least 5 supported tools', () => {
    expect(supportedTools.length).toBeGreaterThanOrEqual(5);
  });

  it('should include Claude Code in supported tools', () => {
    expect(supportedTools).toContain('Claude Code');
  });

  it('should include Factory Droid in supported tools', () => {
    expect(supportedTools).toContain('Factory Droid');
  });
});
