'use client';

import React, { memo } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export const ImportHero = memo(function ImportHero() {
  const { t } = useI18n();

  return (
    <header className="mb-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 mb-6 text-2xl shadow-sm border border-zinc-200/40 dark:border-zinc-800/30 select-none">
        <Download className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight sm:text-4xl mb-3">
        {t('notes.importTitle')}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
        {t('notes.importSubtitle')}
      </p>
    </header>
  );
});

export default ImportHero;
