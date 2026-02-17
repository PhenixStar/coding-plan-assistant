/**
 * TypeScript types and interfaces for the Scriptable Automation API
 * Provides programmatic access to CLI functionality for scripts and CI/CD
 */

import type { Language, PlatformId, PlanType, UnifiedConfig } from '../types/config.js';
import type { ToolInfo, McpServiceInfo } from '../types/tools.js';
import type { PlatformInfo } from '../types/platform.js';

/**
 * Re-export common types from config and tools
 */
export type { Language, PlatformId, PlanType, UnifiedConfig };
export type { ToolInfo, McpServiceInfo };
export type { PlatformInfo };

/**
 * API Result wrapper type for all API methods
 * Represents either a successful result or an error
 */
export type ApiResult<T> = ApiSuccess<T> | ApiError;

/**
 * Successful API result
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Failed API result
 */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

/**
 * Language API types
 */
export interface GetLangResult {
  lang: Language;
}

export interface SetLangParams {
  lang: Language;
}

export interface SetLangResult {
  previousLang: Language;
  newLang: Language;
}

/**
 * Platform API types
 */
export interface GetPlatformResult {
  platform: PlatformId;
  plan: PlanType;
}

export interface SetPlatformParams {
  platform: PlatformId;
  plan?: PlanType;
}

export interface SetPlatformResult {
  previousPlatform: PlatformId;
  newPlatform: PlatformId;
  plan: PlanType;
}

export interface ListPlatformsResult {
  platforms: PlatformInfo[];
}

/**
 * Auth API types
 */
export interface GetApiKeyResult {
  platform: PlatformId;
  hasApiKey: boolean;
  encrypted: boolean;
}

export interface SetApiKeyParams {
  platform: PlatformId;
  apiKey: string;
  encrypt?: boolean;
}

export interface SetApiKeyResult {
  platform: PlatformId;
  encrypted: boolean;
}

export interface ReloadAuthResult {
  platform: PlatformId;
  reloaded: boolean;
}

/**
 * Tool API types
 */
export interface ListToolsResult {
  tools: ToolInfo[];
  total: number;
}

export interface LoadToolParams {
  toolId: string;
  platform?: PlatformId;
}

export interface LoadToolResult {
  toolId: string;
  loaded: boolean;
  configPath?: string;
}

export interface UnloadToolParams {
  toolId: string;
  platform?: PlatformId;
}

export interface UnloadToolResult {
  toolId: string;
  unloaded: boolean;
}

export interface InstallToolParams {
  toolId: string;
}

export interface InstallToolResult {
  toolId: string;
  installed: boolean;
  message?: string;
}

/**
 * MCP Service API types
 */
export interface ListMcpServicesResult {
  services: McpServiceInfo[];
  total: number;
}

export interface EnableMcpServiceParams {
  serviceId: string;
}

export interface EnableMcpServiceResult {
  serviceId: string;
  enabled: boolean;
}

export interface DisableMcpServiceParams {
  serviceId: string;
}

export interface DisableMcpServiceResult {
  serviceId: string;
  disabled: boolean;
}

/**
 * Doctor/Health Check API types
 */
export interface DoctorCheckResult {
  passed: boolean;
  checks: HealthCheck[];
  summary: HealthCheckSummary;
}

export interface HealthCheck {
  name: string;
  passed: boolean;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthCheckSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

/**
 * Config API types (for config-as-code)
 */
export interface ExportConfigResult {
  config: UnifiedConfig;
  exportedAt: string;
}

export interface ImportConfigParams {
  config: UnifiedConfig;
  merge?: boolean;
}

export interface ImportConfigResult {
  imported: boolean;
  merged: boolean;
}

export interface ConfigFileParams {
  path: string;
}

export interface ConfigFileResult {
  path: string;
  loaded: boolean;
  config?: UnifiedConfig;
}

/**
 * API Client configuration options
 */
export interface ApiClientOptions {
  /** Path to config file for config-as-code workflows */
  configFile?: string;
  /** Silent mode - suppress logging */
  silent?: boolean;
  /** Verbose mode - enable detailed logging */
  verbose?: boolean;
}

/**
 * API initialization options
 */
export interface ApiOptions extends ApiClientOptions {
  /** Master password for encrypted API keys */
  masterPassword?: string;
}

/**
 * Health status for the API
 */
export interface ApiHealthStatus {
  ready: boolean;
  version: string;
  configLoaded: boolean;
  platformConfigured: boolean;
}
