/**
 * Language API Module
 * Provides programmatic access to language configuration for scripts and CI/CD
 */

import { configManager } from '../lib/config.js';
import { i18n } from '../lib/i18n.js';
import type { Language } from '../types/config.js';
import type { ApiResult, GetLangResult, SetLangParams, SetLangResult } from './types.js';

const VALID_LANGUAGES: Language[] = ['en_US', 'zh_CN'];

/**
 * Get the current language setting
 */
export function getLang(): ApiResult<GetLangResult> {
  try {
    const lang = configManager.getLang();
    return {
      success: true,
      data: { lang },
      message: 'Language retrieved successfully'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get language';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Set the language setting
 * @param params - The parameters including the new language
 */
export function setLang(params: SetLangParams): ApiResult<SetLangResult> {
  try {
    const newLang = params.lang;

    // Validate language
    if (!newLang || !VALID_LANGUAGES.includes(newLang)) {
      return {
        success: false,
        error: `Invalid language: ${newLang || 'undefined'}. Valid options: ${VALID_LANGUAGES.join(', ')}`,
        code: 'INVALID_LANGUAGE'
      };
    }

    const previousLang = configManager.getLang();

    // Update config and i18n
    configManager.setLang(newLang);
    i18n.setLang(newLang);

    return {
      success: true,
      data: {
        previousLang,
        newLang
      },
      message: `Language changed from ${previousLang} to ${newLang}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set language';
    return {
      success: false,
      error: message
    };
  }
}
