import inquirer from 'inquirer';
import ora from 'ora';
import type { Language, PlatformId, PlanType } from '../types/config.js';
import type { ToolInfo } from '../types/tools.js';
import { configManager } from './config.js';
import { platformManager } from './platform-manager.js';
import { toolManager } from './tool-manager.js';
import { toolRegistry } from './tool-registry.js';
import { toolInstaller } from './tool-installer.js';
import { toolConfigManager } from './tool-config-manager.js';
import { mcpManager } from './mcp-manager.js';
import { logger } from './logger.js';
import { i18n } from './i18n.js';

class Wizard {
  private static instance: Wizard;
  private readonly BOX_WIDTH = 60;

  private constructor() {}

  static getInstance(): Wizard {
    if (!Wizard.instance) {
      Wizard.instance = new Wizard();
    }
    return Wizard.instance;
  }

  createBox(title: string): string {
    const border = '═'.repeat(this.BOX_WIDTH);
    const padding = ' '.repeat(2);
    const centeredTitle = padding + title + padding;
    const top = '╔' + border + '╗';
    const middle = '║' + centeredTitle.padEnd(this.BOX_WIDTH + 2) + '║';
    const bottom = '╚' + border + '╝';
    return '\n' + top + '\n' + middle + '\n' + bottom + '\n';
  }

  printBanner(): void {
    console.log(this.createBox(i18n.t('cli.title')));
    console.log(i18n.t('wizard.banner_subtitle'));
  }

  async runFirstTimeSetup(): Promise<void> {
    console.log('\n' + i18n.t('wizard.welcome'));
    console.log(i18n.t('wizard.privacy_note'));
    console.log('');

    await this.configLanguage();
    await this.configPlatform();
    await this.configPlan();
    await this.configApiKey(configManager.getActivePlatform());

    console.log('');
    logger.success(i18n.t('messages.config_saved'));
  }

  async configLanguage(): Promise<Language> {
    const { lang } = await inquirer.prompt([
      {
        type: 'list',
        name: 'lang',
        message: i18n.t('wizard.select_language'),
        choices: [
          { name: 'English', value: 'en_US' as Language },
          { name: '中文', value: 'zh_CN' as Language }
        ],
        default: configManager.getLang()
      }
    ]);

    configManager.setLang(lang);
    i18n.setLang(lang);
    logger.info(i18n.t('lang.changed', { from: configManager.getLang(), to: lang }));
    return lang;
  }

  async configPlatform(): Promise<PlatformId> {
    const { platform } = await inquirer.prompt([
      {
        type: 'list',
        name: 'platform',
        message: i18n.t('wizard.select_platform'),
        choices: [
          { name: 'GLM (Z.AI)', value: 'glm' as PlatformId },
          { name: 'MiniMax', value: 'minimax' as PlatformId }
        ],
        default: configManager.getPlatform()
      }
    ]);

    configManager.setPlatform(platform);
    logger.info(i18n.t('platform.changed', { from: configManager.getPlatform(), to: platform }));
    return platform;
  }

  async configPlan(): Promise<PlanType> {
    const { plan } = await inquirer.prompt([
      {
        type: 'list',
        name: 'plan',
        message: i18n.t('wizard.select_plan'),
        choices: [
          { name: i18n.t('wizard.plan_global'), value: 'global' as PlanType },
          { name: i18n.t('wizard.plan_china'), value: 'china' as PlanType }
        ],
        default: configManager.getPlan()
      }
    ]);

    configManager.setPlan(plan);
    return plan;
  }

  async configApiKey(platform: PlatformId): Promise<string> {
    const existingKey = configManager.getApiKey(platform);
    const apiDocsUrl = platformManager.getApiDocsUrl(platform);

    console.log('\n' + i18n.t('auth.get_api_key_hint', { url: apiDocsUrl }));

    const { apiKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: i18n.t('wizard.input_api_key'),
        default: existingKey || '',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return i18n.t('wizard.api_key_required');
          }
          return true;
        }
      }
    ]);

    configManager.setApiKey(platform, apiKey.trim());
    logger.success(i18n.t('auth.saved', { platform }));
    return apiKey.trim();
  }

  async selectTool(): Promise<string> {
    const tools = toolRegistry.getSupportedTools();
    const { tool } = await inquirer.prompt([
      {
        type: 'list',
        name: 'tool',
        message: i18n.t('wizard.select_tool'),
        choices: tools.map(t => ({
          name: `${t.displayName} ${toolInstaller.isToolInstalled(t.id) ? '(✓)' : ''}`,
          value: t.id
        }))
      }
    ]);

    return tool;
  }

  async showMainMenu(): Promise<void> {
    const platform = configManager.getActivePlatform();
    const apiKey = configManager.getApiKey(platform);

    while (true) {
      const choices = [
        { name: i18n.t('menu_config_language'), value: 'lang' },
        { name: i18n.t('menu_select_platform'), value: 'platform' },
        { name: i18n.t('menu_select_plan'), value: 'plan' },
        { name: i18n.t('menu_config_api_key'), value: 'apikey' },
        { name: i18n.t('menu_config_tool'), value: 'tool' },
        { name: i18n.t('menu_exit'), value: 'exit' }
      ];

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: i18n.t('wizard.main_menu_title'),
          choices
        }
      ]);

      if (action === 'exit') {
        console.log(i18n.t('wizard.goodbye'));
        break;
      }

      await this.handleMenuAction(action);
    }
  }

  async handleMenuAction(action: string): Promise<void> {
    switch (action) {
      case 'lang':
        await this.configLanguage();
        break;
      case 'platform':
        await this.configPlatform();
        break;
      case 'plan':
        await this.configPlan();
        break;
      case 'apikey':
        await this.configApiKey(configManager.getActivePlatform());
        break;
      case 'tool':
        await this.showToolMenu();
        break;
    }
  }

  async showToolMenu(): Promise<void> {
    const toolId = await this.selectTool();
    const tool = toolRegistry.getTool(toolId);
    if (!tool) return;

    const platform = configManager.getActivePlatform();
    const apiKey = configManager.getApiKey(platform);

    while (true) {
      const choices = [
        { name: i18n.t('wizard.action_load_config', { tool: tool.name }), value: 'load' },
        { name: i18n.t('wizard.action_unload_config', { tool: tool.name }), value: 'unload' },
        { name: i18n.t('wizard.action_mcp_config'), value: 'mcp' },
        { name: i18n.t('wizard.action_view_config'), value: 'view' },
        { name: i18n.t('wizard.action_back'), value: 'back' }
      ];

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: `${tool.displayName} - ${i18n.t('wizard.menu_title')}`,
          choices
        }
      ]);

      if (action === 'back') break;
      if (action === 'view') {
        this.showCurrentConfig(toolId);
      } else if (action === 'load') {
        await this.loadConfig(toolId, platform);
      } else if (action === 'unload') {
        await this.unloadConfig(toolId, platform);
      } else if (action === 'mcp') {
        await this.showMcpMenu(toolId);
      }
    }
  }

  showCurrentConfig(toolId: string): void {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) {
      console.log('\n' + i18n.t('wizard.current_config') + ':');
      console.log('{}');
      return;
    }
    const config = toolConfigManager.readToolConfig(tool.configPath);
    console.log('\n' + i18n.t('wizard.current_config') + ':');
    console.log(JSON.stringify(config, null, 2));
  }

  async loadConfig(toolId: string, platform: PlatformId): Promise<void> {
    const spinner = ora(i18n.t('wizard.loading_config'));
    spinner.start();

    try {
      const success = toolManager.loadPlatformConfig(toolId, platform);
      spinner.stop();

      if (success) {
        logger.success(i18n.t('wizard.config_loaded', { tool: toolId }));
      } else {
        logger.error(i18n.t('wizard.config_failed'));
      }
    } catch (error) {
      spinner.stop();
      logger.error(i18n.t('wizard.config_failed') + ': ' + error);
    }
  }

  async unloadConfig(toolId: string, platform: PlatformId): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: i18n.t('wizard.confirm_unload_config', { tool: toolId }),
        default: false
      }
    ]);

    if (!confirm) return;

    const spinner = ora(i18n.t('wizard.unloading_config'));
    spinner.start();

    try {
      const success = toolManager.unloadPlatformConfig(toolId, platform);
      spinner.stop();

      if (success) {
        logger.success(i18n.t('wizard.config_unloaded'));
      } else {
        logger.error(i18n.t('wizard.config_unload_failed'));
      }
    } catch (error) {
      spinner.stop();
      logger.error(i18n.t('wizard.config_unload_failed') + ': ' + error);
    }
  }

  async showMcpMenu(toolId: string): Promise<void> {
    const platform = configManager.getActivePlatform();
    const services = mcpManager.getAllServices(platform);

    if (services.length === 0) {
      console.log(i18n.t('wizard.no_preset_mcp_installed'));
      return;
    }

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: i18n.t('wizard.mcp_menu_title'),
        choices: [
          { name: i18n.t('wizard.action_install_all_mcp'), value: 'install-all' },
          { name: i18n.t('wizard.action_back'), value: 'back' }
        ]
      }
    ]);

    if (action === 'install-all') {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: i18n.t('wizard.install_all_mcp_confirm'),
          default: false
        }
      ]);

      if (confirm) {
        const spinner = ora(i18n.t('wizard.installing_all_mcp'));
        spinner.start();
        const success = await mcpManager.installAllBuiltInServices(platform);
        spinner.stop();

        if (success) {
          logger.success(i18n.t('wizard.all_mcp_installed'));
        } else {
          logger.warning(i18n.t('wizard.all_mcp_install_failed'));
        }
      }
    }
  }
}

export const wizard = Wizard.getInstance();
