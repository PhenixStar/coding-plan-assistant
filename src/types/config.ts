export type PlatformId = 'glm' | 'minimax';
export type PlanType = 'global' | 'china';
export type Language = 'en_US' | 'zh_CN';

export interface PlatformConfig {
  api_key?: string;
  endpoint?: string;
  plan?: PlanType;
}

export interface UnifiedConfig {
  lang: Language;
  platform: PlatformId;
  plan: PlanType;
  glm: PlatformConfig;
  minimax: PlatformConfig;
  active_platform: PlatformId;
}

export interface ToolConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  env?: Record<string, string>;
}

