import type { Platform, PlanType, ToolConfig } from '../types/platform.js';
import type { PlatformConfig, PlatformId } from '../types/config.js';
import { logger } from './logger.js';

// GLM Platform Configuration
const GLM_CONFIG = {
  id: 'glm' as const,
  name: 'GLM (Z.AI)',
  globalUrl: 'https://open.bigmodel.cn/api/paas/v4/',
  chinaUrl: 'https://open.bigmodel.cn/api/paas/v4/',
  models: ['glm-coding-plan', 'glm-coding-plan-china'],
  defaultModel: 'glm-coding-plan',
  apiDocsUrl: 'https://open.bigmodel.cn/dev/api'
};

// MiniMax Platform Configuration
const MINIMAX_CONFIG = {
  id: 'minimax' as const,
  name: 'MiniMax',
  globalUrl: 'https://api.minimax.io/anthropic',
  chinaUrl: 'https://api.minimaxi.com/anthropic',
  globalOpenAiUrl: 'https://api.minimax.io/v1',
  chinaOpenAiUrl: 'https://api.minimaxi.com/v1',
  models: [
    'MiniMax-M2.5',
    'MiniMax-M2.5-highspeed',
    'MiniMax-M2.1',
    'MiniMax-M2.1-highspeed'
  ],
  defaultModel: 'MiniMax-M2.5',
  apiDocsUrl: 'https://platform.minimax.io/docs/coding-plan/'
};

class GLMPlatform implements Platform {
  id = GLM_CONFIG.id;
  name = GLM_CONFIG.name;
  globalUrl = GLM_CONFIG.globalUrl;
  chinaUrl = GLM_CONFIG.chinaUrl;
  models = GLM_CONFIG.models;
  defaultModel = GLM_CONFIG.defaultModel;

  getApiDocsUrl(): string {
    return GLM_CONFIG.apiDocsUrl;
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      // Basic format validation
      if (!key || key.length < 10) {
        return false;
      }
      // Actual API validation call to /models endpoint
      const response = await fetch(`${this.globalUrl}models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getToolConfig(plan: PlanType, apiKey: string, endpoint: string): ToolConfig {
    const baseUrl = endpoint || (plan === 'china' ? this.chinaUrl : this.globalUrl);
    return {
      baseUrl,
      apiKey,
      model: this.defaultModel,
      env: {
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_SONNET_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_OPUS_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: this.defaultModel
      }
    };
  }
}

class MiniMaxPlatform implements Platform {
  id = MINIMAX_CONFIG.id;
  name = MINIMAX_CONFIG.name;
  globalUrl = MINIMAX_CONFIG.globalUrl;
  chinaUrl = MINIMAX_CONFIG.chinaUrl;
  models = MINIMAX_CONFIG.models;
  defaultModel = MINIMAX_CONFIG.defaultModel;

  getApiDocsUrl(): string {
    return MINIMAX_CONFIG.apiDocsUrl;
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      // Basic format validation
      if (!key || key.length < 10) {
        return false;
      }
      // Actual API validation call to /models endpoint
      const response = await fetch(`${this.globalUrl}models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getToolConfig(plan: PlanType, apiKey: string, endpoint: string): ToolConfig {
    const baseUrl = endpoint || (plan === 'china' ? this.chinaUrl : this.globalUrl);
    const openAiBaseUrl = plan === 'china' ? MINIMAX_CONFIG.chinaOpenAiUrl : MINIMAX_CONFIG.globalOpenAiUrl;

    return {
      baseUrl,
      apiKey,
      model: this.defaultModel,
      env: {
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_SONNET_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_OPUS_MODEL: this.defaultModel,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: this.defaultModel,
        OPENAI_BASE_URL: openAiBaseUrl,
        OPENAI_API_KEY: apiKey,
        OPENAI_MODEL: this.defaultModel,
        MINIMAX_API_KEY: apiKey,
        MINIMAX_BASE_URL: baseUrl
      }
    };
  }
}

class PlatformManager {
  private static instance: PlatformManager;
  private platforms: Map<PlatformId, Platform> = new Map();

  private constructor() {
    this.platforms.set('glm', new GLMPlatform());
    this.platforms.set('minimax', new MiniMaxPlatform());
  }

  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager();
    }
    return PlatformManager.instance;
  }

  getPlatform(id: PlatformId): Platform | undefined {
    return this.platforms.get(id);
  }

  getAllPlatforms(): Platform[] {
    return Array.from(this.platforms.values());
  }

  getPlatformIds(): PlatformId[] {
    return Array.from(this.platforms.keys());
  }

  async validateApiKey(platformId: PlatformId, apiKey: string): Promise<boolean> {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      logger.warning(`Platform not found: ${platformId}`);
      return false;
    }
    return await platform.validateApiKey(apiKey);
  }

  getToolConfig(platformId: PlatformId, plan: PlanType, apiKey: string, endpoint: string): ToolConfig | undefined {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      return undefined;
    }
    return platform.getToolConfig(plan, apiKey, endpoint);
  }

  getApiDocsUrl(platformId: PlatformId): string {
    const platform = this.getPlatform(platformId);
    return platform?.getApiDocsUrl() || '';
  }
}

export const platformManager = PlatformManager.getInstance();
export { GLMPlatform, MiniMaxPlatform };
