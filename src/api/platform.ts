/**
 * Platform API Module
 * Provides programmatic access to platform configuration for scripts and CI/CD
 */

import { configManager } from '../lib/config.js';
import type { PlatformId, PlanType } from '../types/config.js';
import type { ApiResult, GetPlatformResult, SetPlatformParams, SetPlatformResult } from './types.js';

const VALID_PLATFORMS: PlatformId[] = ['glm', 'minimax'];

/**
 * Get the current platform setting
 */
export function getPlatform(): ApiResult<GetPlatformResult> {
  try {
    const platform = configManager.getActivePlatform();
    const plan = configManager.getPlan();
    return {
      success: true,
      data: { platform, plan },
      message: 'Platform retrieved successfully'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get platform';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Set the platform setting
 * @param params - The parameters including the new platform
 */
export function setPlatform(params: SetPlatformParams): ApiResult<SetPlatformResult> {
  try {
    const newPlatform = params.platform;

    // Validate platform
    if (!newPlatform || !VALID_PLATFORMS.includes(newPlatform)) {
      return {
        success: false,
        error: `Invalid platform: ${newPlatform || 'undefined'}. Valid options: ${VALID_PLATFORMS.join(', ')}`,
        code: 'INVALID_PLATFORM'
      };
    }

    const previousPlatform = configManager.getActivePlatform();

    // Update platform
    configManager.setPlatform(newPlatform);

    // Update plan if provided
    if (params.plan) {
      configManager.setPlan(params.plan);
    }

    const plan = configManager.getPlan();

    return {
      success: true,
      data: {
        previousPlatform,
        newPlatform,
        plan
      },
      message: `Platform changed from ${previousPlatform} to ${newPlatform}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set platform';
    return {
      success: false,
      error: message
    };
  }
}
