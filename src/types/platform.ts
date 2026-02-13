import type { PlanType, ToolConfig, PlatformId } from './config.js';

export type { PlanType, ToolConfig, PlatformId };

export interface Platform {
  id: PlatformId;
  name: string;
  globalUrl: string;
  chinaUrl: string;
  models: string[];
  defaultModel: string;
  getApiDocsUrl(): string;
  validateApiKey(key: string): Promise<boolean>;
  getToolConfig(plan: PlanType, apiKey: string, endpoint: string): ToolConfig;
}

export interface PlatformInfo {
  id: string;
  name: string;
  description: string;
  apiDocsUrl: string;
  models: string[];
}
