import inquirer from 'inquirer';
import type { Language } from '../types/config.js';
import { configManager } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

export async function handleShowLang(): Promise<void> {
  const lang = configManager.getLang();
  console.log(i18n.t('lang.current') + ': ' + lang);
}

export async function handleSetLang(args: string[]): Promise<void> {
  const newLang = args[0] as Language;

  if (!newLang || !['en_US', 'zh_CN'].includes(newLang)) {
    logger.error(i18n.t('lang.invalid', { lang: newLang || '' }));
    console.log(i18n.t('lang.available') + ': en_US, zh_CN');
    return;
  }

  configManager.setLang(newLang);
  i18n.setLang(newLang);
  logger.success(i18n.t('lang.changed', { from: configManager.getLang(), to: newLang }));
}

export async function handleLangMenu(): Promise<void> {
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
  logger.success(i18n.t('lang.changed', { from: configManager.getLang(), to: lang }));
}
