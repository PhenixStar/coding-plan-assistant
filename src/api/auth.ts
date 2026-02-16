/**
 * Auth API Module
 * Provides programmatic access to authentication configuration for scripts and CI/CD
 */

import { configManager } from '../lib/config.js';
import { toolManager } from '../lib/tool-manager.js';
import { toolRegistry } from '../lib/tool-registry.js';
import type { PlatformId } from '../types/config.js';
import type { ApiResult, GetApiKeyResult, SetApiKeyParams, SetApiKeyResult, ReloadAuthResult } from './types.js';

const VALID_PLATFORMS: PlatformId[] = ['glm', 'minimax'];

/**
 * Get API key status for a platform
 * @param params - Optional parameters including the platform
 */
export function getApiKey(params?: { platform?: PlatformId }): ApiResult<GetApiKeyResult> {
  try {
    const platform = params?.platform || configManager.getActivePlatform();

    // Validate platform
    if (!VALID_PLATFORMS.includes(platform)) {
      return {
        success: false,
        error: `Invalid platform: ${platform}. Valid options: ${VALID_PLATFORMS.join(', ')}`,
        code: 'INVALID_PLATFORM'
      };
    }

    const platformConfig = configManager.getPlatformConfig(platform);
    const hasApiKey = !!(platformConfig.api_key || platformConfig.encrypted_api_key);
    const encrypted = !!platformConfig.encrypted_api_key;

    return {
      success: true,
      data: { platform, hasApiKey, encrypted },
      message: hasApiKey ? 'API key exists' : 'No API key found'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get API key';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Set API key for a platform
 * @param params - The parameters including platform, API key, and encryption option
 */
export function setApiKey(params: SetApiKeyParams): ApiResult<SetApiKeyResult> {
  try {
    const { platform, apiKey, encrypt } = params;

    // Validate platform
    if (!VALID_PLATFORMS.includes(platform)) {
      return {
        success: false,
        error: `Invalid platform: ${platform}. Valid options: ${VALID_PLATFORMS.join(', ')}`,
        code: 'INVALID_PLATFORM'
      };
    }

    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        error: 'API key is required',
        code: 'MISSING_API_KEY'
      };
    }

    // Update platform first
    configManager.setPlatform(platform);

    // Set API key (with or without encryption)
    if (encrypt) {
      // Encryption requires master password - this is handled by the client
      // For now, we store as encrypted if master password was provided to API client
      configManager.setApiKey(platform, apiKey.trim(), '');
    } else {
      const platformConfig = configManager.getPlatformConfig(platform);
      configManager.setPlatformConfig(platform, {
        ...platformConfig,
        api_key: apiKey.trim()
      });
    }

    return {
      success: true,
      data: {
        platform,
        encrypted: encrypt || false
      },
      message: 'API key set successfully'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set API key';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Reload platform configuration for a tool
 * @param params - The parameters including tool ID and optional platform
 */
export function reload(params: { toolId: string; platform?: PlatformId }): ApiResult<ReloadAuthResult> {
  try {
    const { toolId, platform } = params;

    // Validate tool ID
    if (!toolId || toolId.trim().length === 0) {
      return {
        success: false,
        error: 'Tool ID is required',
        code: 'MISSING_TOOL_ID'
      };
    }

    const activePlatform = platform || configManager.getActivePlatform();

    // Validate platform
    if (!VALID_PLATFORMS.includes(activePlatform)) {
      return {
        success: false,
        error: `Invalid platform: ${activePlatform}. Valid options: ${VALID_PLATFORMS.join(', ')}`,
        code: 'INVALID_PLATFORM'
      };
    }

    // Check if API key exists
    const apiKey = configManager.getApiKey(activePlatform);
    if (!apiKey) {
      return {
        success: false,
        error: 'No API key configured. Please set API key first.',
        code: 'MISSING_API_KEY'
      };
    }

    // Get tool from registry
    const tool = toolRegistry.getTool(toolId.trim());
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolId}`,
        code: 'TOOL_NOT_FOUND'
      };
    }

    // Reload platform configuration
    const success = toolManager.loadPlatformConfig(toolId.trim(), activePlatform);

    if (success) {
      return {
        success: true,
        data: {
          platform: activePlatform,
          reloaded: true
        },
        message: `Successfully reloaded ${tool.name} configuration`
      };
    } else {
      return {
        success: false,
        error: `Failed to reload ${tool.name} configuration`,
        code: 'RELOAD_FAILED'
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reload configuration';
    return {
      success: false,
      error: message
    };
  }
}
