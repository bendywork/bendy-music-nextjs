export type Locale = 'zh' | 'en';

export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_STORAGE_KEY = 'app_locale';

export const localeUiCopy = {
  zh: {
    htmlLang: 'zh-CN',
    localeLabel: '中文',
    switchLanguage: '切换到英文',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    lightMode: '浅色模式',
    darkMode: '深色模式',
  },
  en: {
    htmlLang: 'en',
    localeLabel: 'EN',
    switchLanguage: 'Switch to Chinese',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
  },
} as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh' || value === 'en';
}

export function resolveLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }

  return DEFAULT_LOCALE;
}

export function getHtmlLang(locale: Locale): string {
  return localeUiCopy[locale].htmlLang;
}

export function getIntlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US';
}
