import type { PlatformId, ToolConfig as ToolConfigType } from '../types/config.js';
import { configManager } from './config.js';
import { platformManager } from './platform-manager.js';
import { logger } from './logger.js';

class ToolPlatformConfig {
  private static instance: ToolPlatformConfig;

  private constructor() {}

  static getInstance(): ToolPlatformConfig {
    if (!ToolPlatformConfig.instance) {
      ToolPlatformConfig.instance = new ToolPlatformConfig();
    }
    return ToolPlatformConfig.instance;
  }

  getApiKey(platformId: PlatformId): string | undefined {
    return configManager.getApiKey(platformId);
  }

  getPlan(): string {
    return configManager.getPlan();
  }

  getEndpoint(platformId: PlatformId): string | undefined {
    return configManager.getEndpoint(platformId);
  }

  getToolConfig(platformId: PlatformId): ToolConfigType | undefined {
    const apiKey = this.getApiKey(platformId);
    const plan = this.getPlan();
    const endpoint = this.getEndpoint(platformId);

    if (!apiKey) {
      logger.warning(`API key not set for platform: ${platformId}`);
      return undefined;
    }

    return platformManager.getToolConfig(platformId, plan as 'global' | 'china', apiKey, endpoint || '');
  }

  isConfigured(platformId: PlatformId): boolean {
    const apiKey = this.getApiKey(platformId);
    return !!apiKey && apiKey.length > 0;
  }

  getConfiguredPlatforms(): PlatformId[] {
    const platformIds: PlatformId[] = ['glm', 'minimax'];
    return platformIds.filter(id => this.isConfigured(id));
  }

  validatePlatform(platformId: PlatformId): Promise<boolean> {
    const apiKey = this.getApiKey(platformId);
    if (!apiKey) {
      return Promise.resolve(false);
    }
    return platformManager.validateApiKey(platformId, apiKey);
  }

  getApiDocsUrl(platformId: PlatformId): string {
    return platformManager.getApiDocsUrl(platformId);
  }

  getModels(platformId: PlatformId): string[] {
    const platform = platformManager.getPlatform(platformId);
    return platform?.models || [];
  }

  getDefaultModel(platformId: PlatformId): string | undefined {
    const platform = platformManager.getPlatform(platformId);
    return platform?.defaultModel;
  }

  getPlatformName(platformId: PlatformId): string {
    const platform = platformManager.getPlatform(platformId);
    return platform?.name || platformId;
  }
}

export const toolPlatformConfig = ToolPlatformConfig.getInstance();
export { ToolPlatformConfig };
