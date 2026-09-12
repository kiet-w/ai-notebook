'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Locale } from '@/i18n/types';

export interface LanguageSwitcherProps {
  variant?: 'segmented' | 'compact' | 'ghost';
  className?: string;
}

const LOCALES: { code: Locale; label: string; flag: string; shortLabel: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', shortLabel: 'VI' },
  { code: 'en', label: 'English', flag: '🇺🇸', shortLabel: 'EN' },
];

export function LanguageSwitcher({ variant = 'segmented', className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  if (variant === 'compact') {
    const nextLocale: Locale = locale === 'vi' ? 'en' : 'vi';
    const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

    return (
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer ${className}`}
        title={`Switch to ${nextLocale === 'vi' ? 'Tiếng Việt' : 'English'}`}
        aria-label="Toggle language"
      >
        <span className="text-sm select-none" role="img" aria-hidden="true">
          {current.flag}
        </span>
        <span className="tracking-wide uppercase">{current.shortLabel}</span>
      </button>
    );
  }

  if (variant === 'ghost') {
    const nextLocale: Locale = locale === 'vi' ? 'en' : 'vi';
    const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

    return (
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/35 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer ${className}`}
        title={`Switch to ${nextLocale === 'vi' ? 'Tiếng Việt' : 'English'}`}
        aria-label="Toggle language"
      >
        <span className="text-sm select-none" role="img" aria-hidden="true">
          {current.flag}
        </span>
        <span>{current.label}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm ${className}`}
    >
      {LOCALES.map(({ code, label, flag }) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent'
            }`}
          >
            <span className="text-sm leading-none" role="img" aria-hidden="true">
              {flag}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
