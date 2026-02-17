/**
 * Config API Module
 * Provides programmatic access to configuration export/import for scripts and CI/CD
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { configManager } from '../lib/config.js';
import type { UnifiedConfig } from '../types/config.js';
import type {
  ApiResult,
  ExportConfigResult,
  ImportConfigParams,
  ImportConfigResult,
  ConfigFileParams,
  ConfigFileResult
} from './types.js';

/**
 * Export the current configuration
 * Returns the full configuration object that can be used for backup or migration
 */
export function exportConfig(): ApiResult<ExportConfigResult> {
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
    const message = error instanceof Error ? error.message : 'Failed to export configuration';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Import configuration
 * @param params - The parameters including the config object and optional merge flag
 */
export function importConfig(params: ImportConfigParams): ApiResult<ImportConfigResult> {
  try {
    const { config, merge = false } = params;

    // Validate config object
    if (!config || typeof config !== 'object') {
      return {
        success: false,
        error: 'Invalid configuration object',
        code: 'INVALID_CONFIG'
      };
    }

    // Validate required fields
    if (!config.lang || !config.platform || !config.plan) {
      return {
        success: false,
        error: 'Configuration must include lang, platform, and plan fields',
        code: 'INVALID_CONFIG'
      };
    }

    if (merge) {
      // Merge with existing config
      configManager.updateConfig(config as Partial<UnifiedConfig>);
      return {
        success: true,
        data: {
          imported: true,
          merged: true
        },
        message: 'Configuration merged successfully'
      };
    } else {
      // Replace entire config
      configManager.saveConfig(config as Partial<UnifiedConfig>);
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
    const message = error instanceof Error ? error.message : 'Failed to import configuration';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Load configuration from a file
 * @param params - The parameters including the file path
 */
export function loadConfigFile(params: ConfigFileParams): ApiResult<ConfigFileResult> {
  try {
    const { path: filePath } = params;

    // Validate file path
    if (!filePath || filePath.trim().length === 0) {
      return {
        success: false,
        error: 'File path is required',
        code: 'MISSING_PATH'
      };
    }

    const resolvedPath = path.resolve(filePath.trim());

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        error: `Configuration file not found: ${resolvedPath}`,
        code: 'FILE_NOT_FOUND'
      };
    }

    // Read and parse the file
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    let config: UnifiedConfig;

    // Try to detect format and parse
    if (resolvedPath.endsWith('.json')) {
      config = JSON.parse(content) as UnifiedConfig;
    } else if (resolvedPath.endsWith('.yaml') || resolvedPath.endsWith('.yml')) {
      config = yaml.load(content) as UnifiedConfig;
    } else {
      // Try YAML first, then JSON
      try {
        config = yaml.load(content) as UnifiedConfig;
      } catch {
        try {
          config = JSON.parse(content) as UnifiedConfig;
        } catch {
          return {
            success: false,
            error: 'Unable to parse configuration file. Please use JSON or YAML format.',
            code: 'PARSE_ERROR'
          };
        }
      }
    }

    // Validate required fields
    if (!config.lang || !config.platform || !config.plan) {
      return {
        success: false,
        error: 'Configuration file must include lang, platform, and plan fields',
        code: 'INVALID_CONFIG'
      };
    }

    // Apply the loaded config
    configManager.saveConfig(config);

    return {
      success: true,
      data: {
        path: resolvedPath,
        loaded: true,
        config
      },
      message: 'Configuration loaded from file successfully'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load configuration file';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Save configuration to a file
 * @param params - The parameters including the file path and optional format
 */
export function saveConfigFile(params: ConfigFileParams & { format?: 'json' | 'yaml' }): ApiResult<ConfigFileResult> {
  try {
    const { path: filePath, format = 'yaml' } = params;

    // Validate file path
    if (!filePath || filePath.trim().length === 0) {
      return {
        success: false,
        error: 'File path is required',
        code: 'MISSING_PATH'
      };
    }

    const resolvedPath = path.resolve(filePath.trim());
    const config = configManager.getConfig();

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write in the specified format
    let content: string;
    if (format === 'json') {
      content = JSON.stringify(config, null, 2);
    } else {
      content = yaml.dump(config);
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');

    return {
      success: true,
      data: {
        path: resolvedPath,
        loaded: true
      },
      message: `Configuration saved to ${resolvedPath}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save configuration file';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Get the default configuration file path
 */
export function getConfigPath(): ApiResult<{ path: string }> {
  try {
    const configDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.unified-coding-helper');
    const configFile = path.join(configDir, 'config.yaml');

    return {
      success: true,
      data: {
        path: configFile
      },
      message: 'Configuration path retrieved'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get configuration path';
    return {
      success: false,
      error: message
    };
  }
}
