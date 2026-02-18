import type { EncryptedData } from './crypto.js';

export type PlatformId = 'glm' | 'minimax';
export type PlanType = 'global' | 'china';
export type Language = 'en_US' | 'zh_CN';
export type CredentialStorageType = 'env' | 'config' | 'external';

export interface CredentialStorageConfig {
  type: CredentialStorageType;
  externalProvider?: string;
  envPrefix?: string;
}

export interface PlatformConfig {
  api_key?: string;
  encrypted_api_key?: EncryptedData;
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
  credentialStorage?: CredentialStorageConfig;
}

export interface ToolConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  env?: Record<string, string>;
}

