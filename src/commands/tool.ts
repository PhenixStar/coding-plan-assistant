import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { toolManager } from '../lib/tool-manager.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

const LOADABLE_TOOLS = ['claude-code', 'cursor', 'opencode', 'factory-droid'];

function resolvePlatform(platformArg?: string): PlatformId {
  if (platformArg === 'glm' || platformArg === 'minimax') {
    return platformArg;
  }
  return configManager.getActivePlatform();
}

export async function handleToolList(): Promise<void> {
  const tools = toolManager.getSupportedTools();
  console.log('\n' + i18n.t('tool.list_title') + ':');
  for (const tool of tools) {
    const isInstalled = toolManager.isToolInstalled(tool.id);
    if (isInstalled) {
      logger.success('✓ ' + tool.displayName);
    } else {
      logger.warning('✗ ' + tool.displayName);
    }
  }
}

export async function handleToolLoad(args: string[]): Promise<void> {
  const toolId = args[0];
  const platform = resolvePlatform(args[1]);

  if (!toolId) {
    logger.error(i18n.t('tool.load_usage'));
    return;
  }

  if (!LOADABLE_TOOLS.includes(toolId)) {
    logger.error(i18n.t('tool.load_not_supported', { tool: toolId }));
    return;
  }

  const success = toolManager.loadPlatformConfig(toolId, platform);
  if (success) {
    logger.success(i18n.t('tool.load_success', { platform, tool: toolId }));
  } else {
    logger.error(i18n.t('tool.load_failed', { tool: toolId }));
  }
}

export async function handleToolUnload(args: string[]): Promise<void> {
  const toolId = args[0];
  const platform = resolvePlatform(args[1]);

  if (!toolId) {
    logger.error(i18n.t('tool.unload_usage'));
    return;
  }

  if (!LOADABLE_TOOLS.includes(toolId)) {
    logger.error(i18n.t('tool.unload_not_supported', { tool: toolId }));
    return;
  }

  const success = toolManager.unloadPlatformConfig(toolId, platform);
  if (success) {
    logger.success(i18n.t('tool.unload_success', { tool: toolId }));
  } else {
    logger.error(i18n.t('tool.unload_failed', { tool: toolId }));
  }
}
