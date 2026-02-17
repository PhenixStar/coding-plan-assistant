/**
 * Scriptable Automation API Client
 * Provides programmatic access to CLI functionality for scripts and CI/CD
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { logger } from '../lib/logger.js';
import { configManager } from '../lib/config.js';
import { ErrorCode, ErrorSeverity, wrapError, AppError } from '../lib/errors.js';
import type {
  ApiResult,
  ApiSuccess,
  ApiError as ApiErrorType,
  ApiClientOptions,
  ApiOptions,
  ApiHealthStatus,
  Language,
  PlatformId,
  PlanType,
  UnifiedConfig,
  GetLangResult,
  SetLangParams,
  SetLangResult,
  GetPlatformResult,
  SetPlatformParams,
  SetPlatformResult,
  ListPlatformsResult,
  GetApiKeyResult,
  SetApiKeyParams,
  SetApiKeyResult,
  ListToolsResult,
  DoctorCheckResult,
  ExportConfigResult,
  ImportConfigParams,
  ImportConfigResult,
  ConfigFileParams,
  ConfigFileResult,
  ToolInfo,
  McpServiceInfo,
  PlatformInfo
} from './types.js';

/**
 * API Client for Scriptable Automation
 * Provides a programmatic interface to CLI functionality
 */
class ApiClient {
  private static instance: ApiClient;
  private initialized: boolean = false;
  private silent: boolean = false;
  private verbose: boolean = false;
  private masterPassword?: string;
  private configFile?: string;

  private constructor() {}

  /**
   * Get the singleton instance of the API client
   */
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Initialize the API client with options
   */
  initialize(options?: ApiOptions): void {
    try {
      // Set logging preferences
      if (options?.silent) {
        this.silent = true;
      }
      if (options?.verbose) {
        this.verbose = true;
        logger.setVerbose(true);
      }

      // Handle config file loading for config-as-code workflows
      if (options?.configFile) {
        this.configFile = options.configFile;
        this.loadConfigFromFile(options.configFile);
      }

      // Store master password for encrypted API key operations
      if (options?.masterPassword) {
        this.masterPassword = options.masterPassword;
      }

      this.initialized = true;
      logger.debug('API Client initialized successfully');
    } catch (error) {
      const initError = wrapError(
        error as Error,
        ErrorCode.INTERNAL_ERROR,
        `Failed to initialize API client: ${(error as Error).message}`,
        {
          severity: ErrorSeverity.HIGH,
          context: {
            operation: 'initialize API client',
            details: { options }
          },
          suggestedActions: [
            'Check if the configuration file path is valid',
            'Ensure the config file exists and is valid YAML format',
            'Verify you have proper permissions to read the config file'
          ]
        }
      );
      initError.log();
      throw initError;
    }
  }

  /**
   * Check if the API client is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get health status of the API
   */
  getHealthStatus(): ApiHealthStatus {
    const config = configManager.getConfig();
    return {
      ready: this.initialized,
      version: this.getVersion(),
      configLoaded: !!config,
      platformConfigured: !!config.platform
    };
  }

  /**
   * Get the API version
   */
  private getVersion(): string {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  // ==================== Language Operations ====================

  /**
   * Get the current language setting
   */
  getLang(): ApiResult<GetLangResult> {
    try {
      const lang = configManager.getLang();
      return {
        success: true,
        data: { lang },
        message: 'Language retrieved successfully'
      };
    } catch (error) {
      return this.handleError(error, 'getLang');
    }
  }

  /**
   * Set the language setting
   */
  setLang(params: SetLangParams): ApiResult<SetLangResult> {
    try {
      const previousLang = configManager.getLang();
      configManager.setLang(params.lang);
      return {
        success: true,
        data: {
          previousLang,
          newLang: params.lang
        },
        message: `Language set to ${params.lang}`
      };
    } catch (error) {
      return this.handleError(error, 'setLang');
    }
  }

  // ==================== Platform Operations ====================

  /**
   * Get the current platform and plan
   */
  getPlatform(): ApiResult<GetPlatformResult> {
    try {
      const platform = configManager.getPlatform();
      const plan = configManager.getPlan();
      return {
        success: true,
        data: { platform, plan },
        message: 'Platform retrieved successfully'
      };
    } catch (error) {
      return this.handleError(error, 'getPlatform');
    }
  }

  /**
   * Set the active platform and optionally the plan
   */
  setPlatform(params: SetPlatformParams): ApiResult<SetPlatformResult> {
    try {
      const previousPlatform = configManager.getPlatform();
      configManager.setPlatform(params.platform);
      if (params.plan) {
        configManager.setPlan(params.plan);
      }
      return {
        success: true,
        data: {
          previousPlatform,
          newPlatform: params.platform,
          plan: configManager.getPlan()
        },
        message: `Platform set to ${params.platform}`
      };
    } catch (error) {
      return this.handleError(error, 'setPlatform');
    }
  }

  /**
   * List available platforms
   */
  listPlatforms(): ApiResult<ListPlatformsResult> {
    try {
      const platforms: PlatformInfo[] = [
        {
          id: 'glm',
          name: 'GLM',
          description: 'GLM AI Platform',
          apiDocsUrl: 'https://open.bigmodel.cn/doc',
          models: ['glm-4', 'glm-4-flash', 'glm-4-plus']
        },
        {
          id: 'minimax',
          name: 'MiniMax',
          description: 'MiniMax AI Platform',
          apiDocsUrl: 'https://platform.minimaxi.com/docs',
          models: ['abab6', 'abab6.5s']
        }
      ];
      return {
        success: true,
        data: { platforms },
        message: 'Platforms listed successfully'
      };
    } catch (error) {
      return this.handleError(error, 'listPlatforms');
    }
  }

  // ==================== Auth Operations ====================

  /**
   * Get API key status for a platform
   */
  getApiKey(platform?: PlatformId): ApiResult<GetApiKeyResult> {
    try {
      const plat = platform || configManager.getActivePlatform();
      const platformConfig = configManager.getPlatformConfig(plat);
      const hasApiKey = !!(platformConfig.api_key || platformConfig.encrypted_api_key);
      const encrypted = !!platformConfig.encrypted_api_key;
      return {
        success: true,
        data: { platform: plat, hasApiKey, encrypted },
        message: hasApiKey ? 'API key exists' : 'No API key found'
      };
    } catch (error) {
      return this.handleError(error, 'getApiKey');
    }
  }

  /**
   * Set API key for a platform
   */
  setApiKey(params: SetApiKeyParams): ApiResult<SetApiKeyResult> {
    try {
      if (params.encrypt && this.masterPassword) {
        configManager.setApiKey(params.platform, params.apiKey, this.masterPassword);
      } else {
        const platformConfig = configManager.getPlatformConfig(params.platform);
        configManager.setPlatformConfig(params.platform, {
          ...platformConfig,
          api_key: params.apiKey
        });
      }
      return {
        success: true,
        data: {
          platform: params.platform,
          encrypted: !!params.encrypt
        },
        message: 'API key set successfully'
      };
    } catch (error) {
      return this.handleError(error, 'setApiKey');
    }
  }

  // ==================== Config Operations ====================

  /**
   * Export the current configuration
   */
  exportConfig(): ApiResult<ExportConfigResult> {
    try {
      const config = configManager.getConfig();
      return {
        success: true,
        data: {
          config,
          exportedAt: new Date().toISOString()
        },
        message: 'Configuration exported successfully'
      };
    } catch (error) {
      return this.handleError(error, 'exportConfig');
    }
  }

  /**
   * Import a configuration
   */
  importConfig(params: ImportConfigParams): ApiResult<ImportConfigResult> {
    try {
      if (params.merge) {
        const currentConfig = configManager.getConfig();
        configManager.updateConfig(params.config);
        return {
          success: true,
          data: {
            imported: true,
            merged: true
          },
          message: 'Configuration merged successfully'
        };
      } else {
        configManager.updateConfig(params.config);
        return {
          success: true,
          data: {
            imported: true,
            merged: false
          },
          message: 'Configuration imported successfully'
        };
      }
    } catch (error) {
      return this.handleError(error, 'importConfig');
    }
  }

  /**
   * Load configuration from a file
   */
  loadConfigFromFile(filePath: string): ApiResult<ConfigFileResult> {
    try {
      if (!fs.existsSync(filePath)) {
        const error = new AppError(
          ErrorCode.FILE_NOT_FOUND,
          `Configuration file not found: ${filePath}`,
          {
            severity: ErrorSeverity.HIGH,
            context: {
              operation: 'load config file',
              filePath
            },
            suggestedActions: [
              'Check if the file path is correct',
              'Ensure the configuration file exists'
            ]
          }
        );
        error.log();
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const config = yaml.load(content) as UnifiedConfig;
      configManager.updateConfig(config);

      return {
        success: true,
        data: {
          path: filePath,
          loaded: true,
          config
        },
        message: 'Configuration loaded successfully'
      };
    } catch (error) {
      const loadError = wrapError(
        error as Error,
        ErrorCode.CONFIG_LOAD_FAILED,
        `Failed to load configuration from file: ${(error as Error).message}`,
        {
          severity: ErrorSeverity.HIGH,
          context: {
            operation: 'load config file',
            filePath,
            details: { filePath }
          },
          suggestedActions: [
            'Check if the file is valid YAML format',
            'Verify the configuration structure is correct'
          ]
        }
      );
      loadError.log();
      return {
        success: false,
        error: loadError.message,
        code: loadError.code
      };
    }
  }

  /**
   * Save configuration to a file
   */
  saveConfigToFile(filePath: string): ApiResult<ConfigFileResult> {
    try {
      const config = configManager.getConfig();
      const content = yaml.dump(config);
      fs.writeFileSync(filePath, content, 'utf-8');

      return {
        success: true,
        data: {
          path: filePath,
          loaded: true,
          config
        },
        message: 'Configuration saved successfully'
      };
    } catch (error) {
      const saveError = wrapError(
        error as Error,
        ErrorCode.CONFIG_SAVE_FAILED,
        `Failed to save configuration to file: ${(error as Error).message}`,
        {
          severity: ErrorSeverity.HIGH,
          context: {
            operation: 'save config file',
            filePath,
            details: { filePath }
          },
          suggestedActions: [
            'Check if the directory exists and is writable',
            'Verify file permissions'
          ]
        }
      );
      saveError.log();
      return {
        success: false,
        error: saveError.message,
        code: saveError.code
      };
    }
  }

  // ==================== Tool Operations ====================

  /**
   * List all available tools
   */
  listTools(): ApiResult<ListToolsResult> {
    try {
      // This would integrate with tool-manager in a full implementation
      const tools: ToolInfo[] = [];
      return {
        success: true,
        data: { tools, total: tools.length },
        message: 'Tools listed successfully'
      };
    } catch (error) {
      return this.handleError(error, 'listTools');
    }
  }

  /**
   * Run a doctor/health check
   */
  runDoctor(): ApiResult<DoctorCheckResult> {
    try {
      const checks = this.performHealthChecks();
      const summary = {
        total: checks.length,
        passed: checks.filter(c => c.passed).length,
        failed: checks.filter(c => !c.passed).length,
        warnings: 0
      };

      return {
        success: true,
        data: {
          passed: summary.failed === 0,
          checks,
          summary
        },
        message: summary.failed === 0 ? 'All checks passed' : 'Some checks failed'
      };
    } catch (error) {
      return this.handleError(error, 'runDoctor');
    }
  }

  /**
   * Perform health checks
   */
  private performHealthChecks(): Array<{
    name: string;
    passed: boolean;
    message?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

    // Check config
    try {
      configManager.getConfig();
      checks.push({
        name: 'Configuration',
        passed: true,
        message: 'Configuration loaded successfully',
        severity: 'high'
      });
    } catch {
      checks.push({
        name: 'Configuration',
        passed: false,
        message: 'Failed to load configuration',
        severity: 'critical'
      });
    }

    // Check platform
    try {
      const platform = configManager.getPlatform();
      checks.push({
        name: 'Platform',
        passed: true,
        message: `Platform configured: ${platform}`,
        severity: 'high'
      });
    } catch {
      checks.push({
        name: 'Platform',
        passed: false,
        message: 'No platform configured',
        severity: 'critical'
      });
    }

    return checks;
  }

  // ==================== Error Handling ====================

  /**
   * Handle errors and return standardized API error response
   */
  private handleError(error: unknown, operation: string): ApiErrorType {
    const errorCode = error instanceof AppError ? error.code : ErrorCode.INTERNAL_ERROR;
    const message = error instanceof Error ? error.message : 'An unknown error occurred';

    logger.debug(`API error in ${operation}: ${message}`);

    return {
      success: false,
      error: message,
      code: errorCode
    };
  }

  /**
   * Reset the API client to uninitialized state
   */
  reset(): void {
    this.initialized = false;
    this.silent = false;
    this.verbose = false;
    this.masterPassword = undefined;
    this.configFile = undefined;
    logger.debug('API Client reset');
  }
}

/**
 * The singleton API client instance
 */
export const apiClient = ApiClient.getInstance();

// Re-export types for convenience
export type {
  ApiResult,
  ApiSuccess,
  ApiClientOptions,
  ApiOptions,
  ApiHealthStatus
};
