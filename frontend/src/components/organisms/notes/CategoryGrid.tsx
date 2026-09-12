'use client';

import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Category } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import { getAvailableCategories } from '@/utils/category';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import CategoryGridItem from '@/components/molecules/notes/CategoryGridItem';

export interface CategoryGridProps {
  categoryStats?: Record<string, number>;
  unreadCounts?: Record<string, number>;
  onSelectCategory?: (category: Category | string) => void;
  categories?: string[];
}

export const CategoryGrid = memo(function CategoryGrid({
  categoryStats = {},
  unreadCounts = {},
  onSelectCategory,
  categories,
}: CategoryGridProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { customCategories, addCategory } = useCustomCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const availableCategories = useMemo(() => {
    const allCustom = categories ? Array.from(new Set([...categories, ...customCategories])) : customCategories;
    return getAvailableCategories(categoryStats, unreadCounts, allCustom);
  }, [categoryStats, unreadCounts, categories, customCategories]);

  const handleSelect = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      router.push(`/${category}`);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    const res = addCategory(trimmed);
    if (res.success) {
      setNewCatName('');
      setIsAdding(false);
      setErrorMsg(null);
    } else {
      setErrorMsg(
        res.error === 'Category already exists'
          ? t('notes.categoryExistsError', { name: trimmed })
          : res.error || 'Failed'
      );
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] select-none">
          {t('notes.categories')}
        </h2>
        {errorMsg && (
          <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">
            {errorMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {availableCategories.map((cat) => {
          const unreadCount = unreadCounts[cat] || 0;
          const count = categoryStats[cat] || 0;
          return (
            <CategoryGridItem
              key={cat}
              category={cat}
              count={count}
              unreadCount={unreadCount}
              onClick={() => handleSelect(cat)}
            />
          );
        })}

        {/* Add Category Card */}
        {isAdding ? (
          <div className="relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm min-h-[68px]">
            <input
              ref={inputRef}
              type="text"
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCatName('');
                  setErrorMsg(null);
                }
              }}
              placeholder={t('notes.newCategory') || 'Tên...'}
              className="w-full text-center text-xs px-1.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="p-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-30 cursor-pointer"
                title={t('common.save')}
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewCatName('');
                  setErrorMsg(null);
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={t('common.cancel')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="group flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/40 dark:bg-zinc-900/10 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer min-h-[68px]"
            title={t('notes.addCategory') || 'Thêm danh mục'}
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              + {t('notes.addCategory') || 'Thêm danh mục'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
});

export default CategoryGrid;

