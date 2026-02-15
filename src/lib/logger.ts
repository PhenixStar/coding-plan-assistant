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

export interface ErrorContext {
  code?: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  suggestions?: string[];
  details?: Record<string, unknown>;
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

  /**
   * Output an error with contextual information
   * @param context - Error context containing message and optional details
   */
  errorContext(context: ErrorContext | string): void {
    const ctx = typeof context === 'string' ? { message: context } : context;
    const lines: string[] = [];

    // Build the error header
    let header = chalk.red('[ERROR]');
    if (ctx.code) {
      header += ` ${chalk.yellow(`[${ctx.code}]`)}`;
    }
    header += ` ${ctx.message}`;
    lines.push(header);

    // Add file location if available
    if (ctx.file) {
      let location = chalk.gray(`  at ${ctx.file}`);
      if (ctx.line !== undefined) {
        location += `:${ctx.line}`;
        if (ctx.column !== undefined) {
          location += `:${ctx.column}`;
        }
      }
      lines.push(location);
    }

    // Add stack trace in verbose mode
    if (this.verbose && ctx.stack) {
      lines.push(chalk.gray(ctx.stack));
    }

    // Add suggestions
    if (ctx.suggestions && ctx.suggestions.length > 0) {
      lines.push(chalk.cyan('  Suggestions:'));
      ctx.suggestions.forEach((suggestion) => {
        lines.push(chalk.gray(`    - ${suggestion}`));
      });
    }

    // Add additional details
    if (ctx.details && Object.keys(ctx.details).length > 0) {
      lines.push(chalk.gray('  Details:'));
      Object.entries(ctx.details).forEach(([key, value]) => {
        lines.push(chalk.gray(`    ${key}: ${JSON.stringify(value)}`));
      });
    }

    console.error(lines.join('\n'));
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
