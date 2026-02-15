import inquirer from 'inquirer';
import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { platformManager } from '../lib/platform-manager.js';
import { toolManager } from '../lib/tool-manager.js';
import { toolRegistry } from '../lib/tool-registry.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

export async function handleAuth(args: string[]): Promise<void> {
  if (args.length === 0) {
    await interactiveAuth();
    return;
  }

  const platform = args[0] as PlatformId;
  const token = args[1];

  if (!['glm', 'minimax'].includes(platform)) {
    logger.error(i18n.t('auth.platform_not_supported', { platform }));
    return;
  }

  if (!token) {
    logger.error(i18n.t('wizard.api_key_required'));
    return;
  }

  configManager.setPlatform(platform);
  configManager.setApiKey(platform, token);
  logger.success(i18n.t('auth.saved', { platform }));
}

export async function handleReload(args: string[]): Promise<void> {
  const toolId = args[0];

  if (!toolId) {
    logger.error('Usage: uchelper auth reload <tool>');
    return;
  }

  const platform = configManager.getActivePlatform();
  const apiKey = configManager.getApiKey(platform);

  if (!apiKey) {
    logger.error(i18n.t('auth.reload_missing_config'));
    return;
  }

  const tool = toolRegistry.getTool(toolId);
  if (!tool) {
    logger.error(i18n.t('doctor.tool_not_found', { tool: toolId }));
    return;
  }

  logger.info(i18n.t('auth.reloading', { tool: tool.name }));

  const success = toolManager.loadPlatformConfig(toolId, platform);
  if (success) {
    logger.success(i18n.t('auth.reloaded', { tool: tool.name }));
  } else {
    logger.error(i18n.t('auth.reload_failed'));
  }
}

async function interactiveAuth(): Promise<void> {
  const platform = await selectPlatform();
  const apiKey = await inputApiKey(platform);
  configManager.setApiKey(platform, apiKey);
  logger.success(i18n.t('auth.saved', { platform }));
}

async function selectPlatform(): Promise<PlatformId> {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: i18n.t('auth.platform_prompt'),
      choices: [
        { name: 'GLM (Z.AI)', value: 'glm' as PlatformId },
        { name: 'MiniMax', value: 'minimax' as PlatformId }
      ],
      default: configManager.getActivePlatform()
    }
  ]);

  configManager.setPlatform(platform);
  return platform;
}

async function inputApiKey(platform: PlatformId): Promise<string> {
  const existingKey = configManager.getApiKey(platform);
  const apiDocsUrl = platformManager.getApiDocsUrl(platform);

  console.log('\n' + i18n.t('auth.get_api_key_hint', { url: apiDocsUrl }));

  const { apiKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: i18n.t('auth.token_prompt'),
      default: existingKey || '',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return i18n.t('auth.token_required');
        }
        return true;
      }
    }
  ]);

  return apiKey.trim();
}
