'use client';

import React from 'react';
import { Category } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryEmoji, getCategoryLabel } from '@/utils/category';

export interface NoteCategoryPickerProps {
  categories: string[];
  selectedCategory?: Category;
  onSelectCategory: (category?: Category) => void;
}

export function NoteCategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
}: NoteCategoryPickerProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2">
      {categories.map((catId) => {
        const emoji = getCategoryEmoji(catId);
        const label = getCategoryLabel(catId, t);
        const isSelected = selectedCategory === catId;

        return (
          <button
            key={catId}
            type="button"
            onClick={() => onSelectCategory(isSelected ? undefined : (catId as Category))}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
              isSelected
                ? 'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300 shadow-sm'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200/60 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700/40 dark:hover:bg-zinc-700/50'
            }`}
          >
            <span className="text-sm leading-none select-none">{emoji}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default NoteCategoryPicker;
