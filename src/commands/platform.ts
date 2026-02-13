import inquirer from 'inquirer';
import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

export async function handleShowPlatform(): Promise<void> {
  const platform = configManager.getActivePlatform();
  console.log(i18n.t('platform.current') + ': ' + platform);
}

export async function handleSetPlatform(args: string[]): Promise<void> {
  const newPlatform = args[0] as PlatformId;

  if (!newPlatform || !['glm', 'minimax'].includes(newPlatform)) {
    logger.error(i18n.t('platform.invalid', { platform: newPlatform || '' }));
    console.log(i18n.t('platform.available') + ': glm, minimax');
    return;
  }

  configManager.setPlatform(newPlatform);
  logger.success(i18n.t('platform.changed', { from: configManager.getPlatform(), to: newPlatform }));
}

export async function handlePlatformMenu(): Promise<void> {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: i18n.t('wizard.select_platform'),
      choices: [
        { name: 'GLM (Z.AI)', value: 'glm' as PlatformId },
        { name: 'MiniMax', value: 'minimax' as PlatformId }
      ],
      default: configManager.getActivePlatform()
    }
  ]);

  configManager.setPlatform(platform);
  logger.success(i18n.t('platform.changed', { from: configManager.getPlatform(), to: platform }));
}
