#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Language} from './types/config.js';
import { configManager } from './lib/config.js';
import { wizard } from './lib/wizard.js';
import { logger } from './lib/logger.js';
import { i18n } from './lib/i18n.js';
import { doctor } from './commands/doctor.js';
import { handleAuth, handleReload, handleLangMenu, handleShowLang, handleSetLang, handlePlatformMenu, handleShowPlatform, handleSetPlatform, handleToolList, handleToolLoad, handleToolUnload } from './commands/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command('uchelper')
  .version(packageJson.version)
  .description(packageJson.description)
  .option('-c, --config <path>', 'Path to configuration file (YAML or JSON)');

// Init command - run initialization wizard
program
  .command('init')
  .description(i18n.t('commands.init'))
  .action(async () => {
    logger.setLang(configManager.getLang());
    i18n.setLang(configManager.getLang());

    await wizard.runFirstTimeSetup();
  });

// Language commands
const langCommand = program
  .command('lang')
  .description(i18n.t('commands.lang'))
  .action(async () => {
    await handleLangMenu();
  });

langCommand
  .command('show')
  .description(i18n.t('lang.show_usage'))
  .action(async () => {
    await handleShowLang();
  });

langCommand
  .command('set <lang>')
  .description(i18n.t('lang.set_usage'))
  .action(async (lang) => {
    await handleSetLang([lang]);
  });

// Platform commands
const platformCommand = program
  .command('platform')
  .description(i18n.t('commands.platform'))
  .action(async () => {
    await handlePlatformMenu();
  });

platformCommand
  .command('show')
  .description(i18n.t('platform.show_usage'))
  .action(async () => {
    await handleShowPlatform();
  });

platformCommand
  .command('set <platform>')
  .description(i18n.t('platform.set_usage'))
  .action(async (platform) => {
    await handleSetPlatform([platform]);
  });

// Auth commands
const authCommand = program
  .command('auth')
  .description(i18n.t('commands.auth'))
  .argument('[platform]')
  .argument('[token]')
  .action(async (platform, token) => {
    const args = [platform, token].filter((arg): arg is string => Boolean(arg));
    await handleAuth(args);
  });

authCommand
  .command('reload <tool>')
  .description(i18n.t('auth.reload_usage'))
  .action(async (tool) => {
    await handleReload([tool]);
  });

// Doctor command
program
  .command('doctor')
  .description(i18n.t('commands.doctor'))
  .action(async () => {
    await doctor();
  });

// Tool command
const toolCommand = program
  .command('tool')
  .description('Manage supported tools')
  .action(async () => {
    await handleToolList();
  });

toolCommand
  .command('list')
  .description('List supported tools and load/unload capability')
  .action(async () => {
    await handleToolList();
  });

toolCommand
  .command('load <tool> [platform]')
  .description('Load platform config into a supported tool')
  .action(async (tool, platform) => {
    const args = [tool, platform].filter((arg): arg is string => Boolean(arg));
    await handleToolLoad(args);
  });

toolCommand
  .command('unload <tool> [platform]')
  .description('Unload platform config from a supported tool')
  .action(async (tool, platform) => {
    const args = [tool, platform].filter((arg): arg is string => Boolean(arg));
    await handleToolUnload(args);
  });

// Parse and execute
if (process.argv.length === 2) {
  // No arguments - check if first run
  if (configManager.isFirstRun()) {
    console.log(i18n.t('messages.first_run'));
    await wizard.runFirstTimeSetup();
  } else {
    // Show main menu
    logger.setLang(configManager.getLang());
    i18n.setLang(configManager.getLang());
    await wizard.showMainMenu();
  }
} else {
  // Handle --config flag by pre-parsing arguments
  // Extract --config value before main parsing
  const configArgIndex = process.argv.findIndex((arg) => arg === '-c' || arg === '--config');
  let configPath: string | undefined;

  if (configArgIndex !== -1) {
    configPath = process.argv[configArgIndex + 1];
    // Remove -c/--config and its value from argv for cleaner parsing
    const cleanArgv = [...process.argv];
    if (process.argv[configArgIndex] === '-c' || process.argv[configArgIndex] === '--config') {
      cleanArgv.splice(configArgIndex, 2);
    } else {
      cleanArgv.splice(configArgIndex, 1);
    }
    process.argv = cleanArgv;
  }

  // Load config from file if --config was provided
  if (configPath) {
    try {
      configManager.loadConfigFromFile(configPath);
    } catch (error) {
      console.error(`Error loading config: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  }

  program.parseAsync(process.argv);
}
