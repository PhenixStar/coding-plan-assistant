import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Language } from '../types/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface LocaleData {
  [key: string]: any;
}

export class I18n {
  private static instance: I18n;
  private lang: Language = 'en_US';
  private locales: Map<Language, LocaleData> = new Map();

  private constructor() {
    this.loadLocales();
  }

  static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  private loadLocales(): void {
    const localesDir = path.join(__dirname, '../locales');
    const localeFiles = ['en_US.json', 'zh_CN.json'];

    for (const file of localeFiles) {
      try {
        const filePath = path.join(localesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lang = file.replace('.json', '') as Language;
        this.locales.set(lang, JSON.parse(content));
      } catch (error) {
        console.error(`Failed to load locale file: ${file}`, error);
      }
    }
  }

  setLang(lang: Language): void {
    if (this.locales.has(lang)) {
      this.lang = lang;
    }
  }

  getLang(): Language {
    return this.lang;
  }

  t(key: string, params?: Record<string, string>): string {
    const locale = this.locales.get(this.lang);
    if (!locale) return key;

    const keys = key.split('.');
    let value: any = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') return key;

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, param: string) => {
        return params[param] || match;
      });
    }

    return value;
  }
}

export const i18n = I18n.getInstance();
