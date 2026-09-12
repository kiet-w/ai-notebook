'use client';

import React, { memo, useState } from 'react';
import { FolderPlus, Plus, Check, AlertCircle } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import Icon from '@/components/atoms/common/Icon';
import { useCustomCategories } from '@/hooks/useCustomCategories';

export interface ImportHeroProps {
  onCreateCategory?: (name: string) => { success: boolean; error?: string; category?: string };
}

export const ImportHero = memo(function ImportHero({ onCreateCategory }: ImportHeroProps) {
  const { t } = useI18n();
  const { addCategory: defaultAddCategory } = useCustomCategories();
  const [categoryName, setCategoryName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    const addFn = onCreateCategory || defaultAddCategory;
    const result = addFn(trimmed);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: t('notes.categoryCreatedSuccess', { name: result.category || trimmed }),
      });
      setCategoryName('');
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error === 'Category already exists'
          ? t('notes.categoryExistsError', { name: trimmed })
          : result.error || 'Failed to create category',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <header className="mb-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 mb-5 text-2xl shadow-sm border border-zinc-200/40 dark:border-zinc-800/30 select-none">
        <FolderPlus className="w-6 h-6 text-zinc-700 dark:text-zinc-200" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight sm:text-4xl mb-2.5">
        {t('notes.importTitle')}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed mb-6">
        {t('notes.importSubtitle')}
      </p>

      {/* Inline Create Category Form */}
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={t('notes.createCategoryPlaceholder')}
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!categoryName.trim()}
            className="h-10 px-4 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shrink-0"
          >
            <Icon icon={Plus} size={15} />
            <span>{t('notes.createCategoryButton')}</span>
          </button>
        </form>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200/60 dark:border-red-800/40'
            }`}
          >
            <Icon
              icon={statusMessage.type === 'success' ? Check : AlertCircle}
              size={13}
            />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </header>
  );
});

export default ImportHero;
