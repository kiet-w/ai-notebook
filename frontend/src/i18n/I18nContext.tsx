'use client';

import React, { createContext, useCallback, useMemo, useSyncExternalStore } from 'react';
import { Locale, TranslationDictionary, TranslationKey, TranslationParams, I18nContextValue } from './types';
import vi from './locales/vi';
import en from './locales/en';

const LOCALE_STORAGE_KEY = 'secondary_brain_locale';

const dictionaries: Record<Locale, TranslationDictionary> = {
  vi,
  en,
};

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'vi';
  }
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'vi' || stored === 'en') {
      return stored;
    }
  } catch {
    // Ignore localStorage errors (e.g. security sandboxing)
  }
  return 'vi';
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('storage', callback);
  window.addEventListener('locale_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('locale_change', callback);
  };
}

function getServerSnapshot(): Locale {
  return 'vi';
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedTranslation(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getStoredLocale, getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
      window.dispatchEvent(new Event('locale_change'));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | (string & Record<never, never>), params?: TranslationParams): string => {
      const dict = dictionaries[locale];
      let value = getNestedTranslation(dict, key);

      // Fallback to other locale if not found in current dictionary
      if (value === undefined) {
        const fallbackLocale: Locale = locale === 'vi' ? 'en' : 'vi';
        value = getNestedTranslation(dictionaries[fallbackLocale], key);
      }

      // If still missing, return the key itself
      if (value === undefined) {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
          return acc.replaceAll(`{${paramKey}}`, String(paramValue));
        }, value);
      }

      return value;
    },
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nProvider;

