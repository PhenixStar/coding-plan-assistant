#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Language } from './types/config.js';
import { configManager } from './lib/config.js';
import { wizard } from './lib/wizard.js';
import { logger } from './lib/logger.js';
import { i18n } from './lib/i18n.js';
import { doctor } from './commands/doctor.js';
import { handleAuth, handleReload, handleLangMenu, handleShowLang, handleSetLang, handlePlatformMenu, handleShowPlatform, handleSetPlatform } from './commands/index.js';
import { toolManager } from './lib/tool-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command('uchelper')
  .version(packageJson.version)
  .description(packageJson.description);

// Init command - run initialization wizard
program
  .command('init')
  .description(i18n.t('commands.init'))
  .action(async () => {
    logger.setLang(configManager.getLang());
    i18n.setLang(configManager.getLang());

    await wizard.runFirstTimeSetup();
  });

// Lang commands
program
  .command('lang')
  .description(i18n.t('commands.lang'))
  .action(async () => {
    await handleLangMenu();
  });

program
  .command('lang show')
  .description(i18n.t('lang.show_usage'))
  .action(async () => {
    await handleShowLang();
  });

program
  .command('lang set <lang>')
  .description(i18n.t('lang.set_usage'))
  .action(async (lang) => {
    await handleSetLang([lang]);
  });

// Platform commands
program
  .command('platform')
  .description(i18n.t('commands.platform'))
  .action(async () => {
    await handlePlatformMenu();
  });

program
  .command('platform show')
  .description(i18n.t('platform.show_usage'))
  .action(async () => {
    await handleShowPlatform();
  });

program
  .command('platform set <platform>')
  .description(i18n.t('platform.set_usage'))
  .action(async (platform) => {
    await handleSetPlatform([platform]);
  });

// Auth commands
program
  .command('auth [platform] [token]')
  .description(i18n.t('commands.auth'))
  .action(async (platform, token) => {
    await handleAuth([platform, token]);
  });

program
  .command('auth reload <tool>')
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
program
  .command('tool list')
  .description('List supported tools')
  .action(async () => {
    const tools = toolManager.getSupportedTools();
    console.log('\nSupported tools:');
    for (const tool of tools) {
      const installed = toolManager.isToolInstalled(tool.id) ? '✓' : '✗';
      console.log(`  ${installed} ${tool.displayName}`);
    }
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
  program.parseAsync(process.argv);
}
