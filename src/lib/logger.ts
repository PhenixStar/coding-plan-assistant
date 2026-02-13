import chalk from 'chalk';
import type { Language } from '../types/config.js';
import { i18n } from './i18n.js';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

class Logger {
  private static instance: Logger;
  private verbose: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  info(message: string): void {
    console.log(chalk.blue(`[INFO] ${message}`));
  }

  success(message: string): void {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  warning(message: string): void {
    console.log(chalk.yellow(`[WARNING] ${message}`));
  }

  error(message: string): void {
    console.error(chalk.red(`[ERROR] ${message}`));
  }

  // Helper methods for common patterns
  blank(): void {
    console.log('');
  }

  header(text: string): void {
    console.log(chalk.bold.cyan(text));
  }

  subheader(text: string): void {
    console.log(chalk.gray(text));
  }

  command(cmd: string): void {
    console.log(chalk.green(`$ ${cmd}`));
  }

  // Translation helpers
  t(key: string, params?: Record<string, string>): string {
    return i18n.t(key, params);
  }

  setLang(lang: Language): void {
    i18n.setLang(lang);
  }
}

export const logger = Logger.getInstance();
