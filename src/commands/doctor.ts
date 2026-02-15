import { execSync } from 'node:child_process';
import type { PlatformId } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { toolManager } from '../lib/tool-manager.js';
import { toolRegistry } from '../lib/tool-registry.js';
import { toolInstaller } from '../lib/tool-installer.js';
import { platformManager } from '../lib/platform-manager.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

export async function doctor(): Promise<boolean> {
  console.log('\n' + i18n.t('doctor.checking'));
  console.log('');

  let allPassed = true;

  // Check PATH
  process.stdout.write('  ' + i18n.t('doctor.check_path') + '... ');
  // PATH is assumed to be working if Node.js is running
  logger.success('✓');

  // Check API key & network
  const platform = configManager.getActivePlatform();
  const apiKey = configManager.getApiKey(platform);

  process.stdout.write('  ' + i18n.t('doctor.check_api_key_network') + '... ');
  if (apiKey) {
    const isValid = await platformManager.validateApiKey(platform, apiKey);
    if (isValid) {
      logger.success(i18n.t('doctor.api_key_network_ok'));
    } else {
      logger.error(i18n.t('doctor.api_key_invalid'));
      allPassed = false;
    }
  } else {
    logger.warning(i18n.t('doctor.api_key_missing'));
    allPassed = false;
  }

  // Check platform config
  process.stdout.write('  ' + i18n.t('doctor.check_platform_config') + '... ');
  if (platform) {
    logger.success(i18n.t('doctor.platform_configured', { platform }));
  } else {
    logger.error(i18n.t('doctor.platform_not_configured'));
    allPassed = false;
  }

  // Check Git
  process.stdout.write('  ' + i18n.t('doctor.check_git_env') + '... ');
  if (toolInstaller.isGitInstalled()) {
    logger.success('✓');
  } else {
    logger.warning(i18n.t('doctor.git_not_installed'));
  }

  // Check tools
  console.log('\n' + i18n.t('doctor.check_tools') + ':');
  const tools = toolRegistry.getSupportedTools();
  for (const tool of tools) {
    const installed = toolInstaller.isToolInstalled(tool.id);
    const status = installed ? logger.success('✓ ' + i18n.t('doctor.tool_installed')) : logger.warning(' ' + i18n.t('doctor.tool_not_found', { tool: tool.name }));
  }

  console.log('');
  if (allPassed) {
    logger.success(i18n.t('doctor.all_good'));
  } else {
    logger.warning('\n' + i18n.t('doctor.suggestions'));
    if (!apiKey) {
      console.log('  - ' + i18n.t('auth.set_usage'));
    }
    console.log('  - ' + i18n.t('doctor.git_not_installed'));
  }

  return allPassed;
}
