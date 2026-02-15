import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { toolManager } from '../lib/tool-manager.js';
import { logger } from '../lib/logger.js';

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

export async function handleToolList(): Promise<void> {
  const tools = toolManager.getSupportedTools();
  console.log('\nSupported tools:');
  for (const tool of tools) {
    const installed = toolManager.isToolInstalled(tool.id) ? '✓' : '✗';
    const loadable = LOADABLE_TOOLS.includes(tool.id) ? '' : ' (inspect only)';
    console.log(`  ${installed} ${tool.displayName}${loadable}`);
  }
}

export async function handleToolLoad(args: string[]): Promise<void> {
  const toolId = args[0];
  const platform = resolvePlatform(args[1]);

  if (!toolId) {
    logger.error('Usage: cpa tool load <tool> [glm|minimax]');
    return;
  }

  if (!LOADABLE_TOOLS.includes(toolId)) {
    logger.error(`Load is not implemented for tool: ${toolId}`);
    return;
  }

  const success = toolManager.loadPlatformConfig(toolId, platform);
  if (success) {
    logger.success(`Loaded ${platform} config into ${toolId}`);
  } else {
    logger.error(`Failed to load config into ${toolId}`);
  }
}

export async function handleToolUnload(args: string[]): Promise<void> {
  const toolId = args[0];
  const platform = resolvePlatform(args[1]);

  if (!toolId) {
    logger.error('Usage: cpa tool unload <tool> [glm|minimax]');
    return;
  }

  if (!LOADABLE_TOOLS.includes(toolId)) {
    logger.error(`Unload is not implemented for tool: ${toolId}`);
    return;
  }

  const success = toolManager.unloadPlatformConfig(toolId, platform);
  if (success) {
    logger.success(`Unloaded config from ${toolId}`);
  } else {
    logger.error(`Failed to unload config from ${toolId}`);
  }
}
