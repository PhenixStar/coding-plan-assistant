import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Mock the fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(''),
    writeFileSync: vi.fn().mockReturnValue(undefined),
    mkdirSync: vi.fn().mockReturnValue(undefined)
  },
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue(''),
  writeFileSync: vi.fn().mockReturnValue(undefined),
  mkdirSync: vi.fn().mockReturnValue(undefined)
}));

// Mock the logger module
vi.mock('../../lib/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    setVerbose: vi.fn()
  }
}));

// Mock the config module
vi.mock('../../lib/config.js', () => {
  const mockConfig = {
    lang: 'en_US' as const,
    platform: 'glm' as const,
    plan: 'global' as const,
    glm: {},
    minimax: {},
    active_platform: 'glm' as const
  };

  return {
    configManager: {
      getConfig: vi.fn().mockReturnValue(mockConfig),
      getLang: vi.fn().mockReturnValue('en_US'),
      setLang: vi.fn(),
      getPlatform: vi.fn().mockReturnValue('glm'),
      setPlatform: vi.fn(),
      getPlan: vi.fn().mockReturnValue('global'),
      setPlan: vi.fn(),
      getActivePlatform: vi.fn().mockReturnValue('glm'),
      getPlatformConfig: vi.fn().mockReturnValue({}),
      setPlatformConfig: vi.fn(),
      setApiKey: vi.fn(),
      updateConfig: vi.fn()
    }
  };
});

// Import after mocking
import { apiClient } from '../../api/client.js';
import type { UnifiedConfig, Language, PlatformId, PlanType } from '../../types/config.js';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the API client state
    apiClient.reset();
  });

  describe('Initialization', () => {
    it('should initialize without options', () => {
      apiClient.initialize();

      expect(apiClient.isReady()).toBe(true);
    });

    it('should initialize with silent mode', () => {
      apiClient.initialize({ silent: true });

      expect(apiClient.isReady()).toBe(true);
    });

    it('should initialize with verbose mode', () => {
      apiClient.initialize({ verbose: true });

      expect(apiClient.isReady()).toBe(true);
    });

    it('should initialize with master password', () => {
      apiClient.initialize({ masterPassword: 'test-password' });

      expect(apiClient.isReady()).toBe(true);
    });

    it('should handle config file loading on initialization', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('lang: en_US\nplatform: glm');

      apiClient.initialize({ configFile: '/test/config.yaml' });

      expect(apiClient.isReady()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      // Reset the client
      apiClient.reset();

      expect(apiClient.isReady()).toBe(false);
    });

    it('should return true after initialization', () => {
      apiClient.initialize();

      expect(apiClient.isReady()).toBe(true);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', () => {
      apiClient.initialize();

      const status = apiClient.getHealthStatus();

      expect(status).toBeDefined();
      expect(status.ready).toBe(true);
      expect(status.configLoaded).toBe(true);
      expect(status.platformConfigured).toBe(true);
    });
  });

  describe('Language Operations', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should get current language', () => {
      const result = apiClient.getLang();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lang).toBeDefined();
      }
    });

    it('should set language', () => {
      const result = apiClient.setLang({ lang: 'zh_CN' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newLang).toBe('zh_CN');
      }
    });

    it('should return previous language when setting new language', () => {
      const result = apiClient.setLang({ lang: 'zh_CN' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.previousLang).toBeDefined();
      }
    });
  });

  describe('Platform Operations', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should get current platform', () => {
      const result = apiClient.getPlatform();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBeDefined();
        expect(result.data.plan).toBeDefined();
      }
    });

    it('should set platform', () => {
      const result = apiClient.setPlatform({ platform: 'minimax' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newPlatform).toBe('minimax');
      }
    });

    it('should set platform with plan', () => {
      const result = apiClient.setPlatform({ platform: 'minimax', plan: 'china' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newPlatform).toBe('minimax');
      }
    });

    it('should list available platforms', () => {
      const result = apiClient.listPlatforms();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platforms).toBeDefined();
        expect(result.data.platforms.length).toBeGreaterThan(0);
        expect(result.data.platforms[0]).toHaveProperty('id');
        expect(result.data.platforms[0]).toHaveProperty('name');
      }
    });
  });

  describe('API Key Operations', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should get API key status', () => {
      const result = apiClient.getApiKey();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('platform');
        expect(result.data).toHaveProperty('hasApiKey');
        expect(result.data).toHaveProperty('encrypted');
      }
    });

    it('should get API key status for specific platform', () => {
      const result = apiClient.getApiKey('glm');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe('glm');
      }
    });

    it('should set API key', () => {
      const result = apiClient.setApiKey({
        platform: 'glm',
        apiKey: 'test-api-key'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe('glm');
        expect(result.data.encrypted).toBe(false);
      }
    });

    it('should set encrypted API key with master password', () => {
      apiClient.initialize({ masterPassword: 'test-password' });

      const result = apiClient.setApiKey({
        platform: 'glm',
        apiKey: 'test-api-key',
        encrypt: true
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Config Operations', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should export config', () => {
      const result = apiClient.exportConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config).toBeDefined();
        expect(result.data.exportedAt).toBeDefined();
      }
    });

    it('should import config', () => {
      const newConfig: Partial<UnifiedConfig> = {
        lang: 'zh_CN',
        platform: 'minimax'
      };

      const result = apiClient.importConfig({ config: newConfig });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imported).toBe(true);
        expect(result.data.merged).toBe(false);
      }
    });

    it('should merge config when merge option is true', () => {
      const newConfig: Partial<UnifiedConfig> = {
        lang: 'zh_CN'
      };

      const result = apiClient.importConfig({ config: newConfig, merge: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.merged).toBe(true);
      }
    });

    it('should load config from file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('lang: en_US\nplatform: glm');

      const result = apiClient.loadConfigFromFile('/test/config.yaml');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loaded).toBe(true);
        expect(result.data.path).toBe('/test/config.yaml');
      }
    });

    it('should return error for non-existent config file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = apiClient.loadConfigFromFile('/nonexistent/config.yaml');

      expect(result.success).toBe(false);
    });

    it('should save config to file', () => {
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

      const result = apiClient.saveConfigToFile('/test/output.yaml');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.path).toBe('/test/output.yaml');
      }
    });
  });

  describe('Tool Operations', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should list tools', () => {
      const result = apiClient.listTools();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tools).toBeDefined();
        expect(result.data.total).toBeDefined();
      }
    });
  });

  describe('Doctor/Health Check', () => {
    beforeEach(() => {
      apiClient.initialize();
    });

    it('should run doctor check', () => {
      const result = apiClient.runDoctor();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checks).toBeDefined();
        expect(result.data.summary).toBeDefined();
        expect(result.data.summary.total).toBeGreaterThan(0);
      }
    });

    it('should return passed status when all checks pass', () => {
      const result = apiClient.runDoctor();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passed).toBe(true);
        expect(result.data.summary.failed).toBe(0);
      }
    });
  });

  describe('Reset', () => {
    it('should reset the API client', () => {
      apiClient.initialize();
      expect(apiClient.isReady()).toBe(true);

      apiClient.reset();

      expect(apiClient.isReady()).toBe(false);
    });
  });
});

describe('API Client Singleton', () => {
  it('should return the same instance', () => {
    const instance1 = apiClient;
    const instance2 = apiClient;

    expect(instance1).toBe(instance2);
  });
});

describe('API Types', () => {
  it('should have correct ApiResult structure', () => {
    const successResult = {
      success: true,
      data: { lang: 'en_US' as Language },
      message: 'Success'
    };

    expect(successResult.success).toBe(true);
    expect(successResult.data).toBeDefined();

    const errorResult = {
      success: false,
      error: 'Error message',
      code: 'ERROR_CODE'
    };

    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBeDefined();
  });

  it('should support PlatformId type', () => {
    const platforms: PlatformId[] = ['glm', 'minimax'];

    expect(platforms).toContain('glm');
    expect(platforms).toContain('minimax');
  });

  it('should support Language type', () => {
    const languages: Language[] = ['en_US', 'zh_CN'];

    expect(languages).toContain('en_US');
    expect(languages).toContain('zh_CN');
  });

  it('should support PlanType type', () => {
    const plans: PlanType[] = ['global', 'china'];

    expect(plans).toContain('global');
    expect(plans).toContain('china');
  });
});

describe('ApiHealthStatus', () => {
  it('should have correct structure', () => {
    const status = {
      ready: true,
      version: '0.2.0',
      configLoaded: true,
      platformConfigured: true
    };

    expect(status.ready).toBe(true);
    expect(status.version).toBeDefined();
    expect(status.configLoaded).toBe(true);
    expect(status.platformConfigured).toBe(true);
  });
});
