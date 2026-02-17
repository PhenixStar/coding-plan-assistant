/**
 * Tool API Module
 * Provides programmatic access to tool management for scripts and CI/CD
 */

import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { toolManager } from '../lib/tool-manager.js';
import type { ApiResult, ListToolsResult, LoadToolParams, LoadToolResult, UnloadToolParams, UnloadToolResult } from './types.js';

const LOADABLE_TOOLS = [
  'claude-code',
  'cursor',
  'opencode',
  'factory-droid',
  'windsurf',
  'zed-ai',
  'copilot',
  'aider',
  'codeium',
  'continue'
];

function resolvePlatform(platformArg?: string): PlatformId {
  if (platformArg === 'glm' || platformArg === 'minimax') {
    return platformArg;
  }
  return configManager.getActivePlatform();
}

/**
 * List all supported tools with their installation status
 */
export function listTools(): ApiResult<ListToolsResult> {
  try {
    const tools = toolManager.getSupportedTools();
    return {
      success: true,
      data: {
        tools,
        total: tools.length
      },
      message: `Found ${tools.length} supported tools`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list tools';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Load platform configuration into a tool
 * @param params - The parameters including toolId and optional platform override
 */
export function loadTool(params: LoadToolParams): ApiResult<LoadToolResult> {
  try {
    const toolId = params.toolId;
    const platform = resolvePlatform(params.platform);

    if (!toolId) {
      return {
        success: false,
        error: 'Tool ID is required',
        code: 'MISSING_TOOL_ID'
      };
    }

    if (!LOADABLE_TOOLS.includes(toolId)) {
      return {
        success: false,
        error: `Load is not implemented for tool: ${toolId}`,
        code: 'TOOL_NOT_LOADABLE'
      };
    }

    const success = toolManager.loadPlatformConfig(toolId, platform);

    if (success) {
      return {
        success: true,
        data: {
          toolId,
          loaded: true,
          configPath: toolManager.getSupportedTools().find(t => t.id === toolId)?.configPath
        },
        message: `Loaded ${platform} config into ${toolId}`
      };
    } else {
      return {
        success: false,
        error: `Failed to load config into ${toolId}`,
        code: 'LOAD_FAILED'
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load tool';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Unload platform configuration from a tool
 * @param params - The parameters including toolId and optional platform override
 */
export function unloadTool(params: UnloadToolParams): ApiResult<UnloadToolResult> {
  try {
    const toolId = params.toolId;
    const platform = resolvePlatform(params.platform);

    if (!toolId) {
      return {
        success: false,
        error: 'Tool ID is required',
        code: 'MISSING_TOOL_ID'
      };
    }

    if (!LOADABLE_TOOLS.includes(toolId)) {
      return {
        success: false,
        error: `Unload is not implemented for tool: ${toolId}`,
        code: 'TOOL_NOT_LOADABLE'
      };
    }

    const success = toolManager.unloadPlatformConfig(toolId, platform);

    if (success) {
      return {
        success: true,
        data: {
          toolId,
          unloaded: true
        },
        message: `Unloaded config from ${toolId}`
      };
    } else {
      return {
        success: false,
        error: `Failed to unload config from ${toolId}`,
        code: 'UNLOAD_FAILED'
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unload tool';
    return {
      success: false,
      error: message
    };
  }
}
