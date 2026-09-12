'use client';

import React, { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const { customCategories } = useCustomCategories();

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

  return (
    <div className="mb-10">
      <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] mb-4 select-none">
        {t('notes.categories')}
      </h2>
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
      </div>
    </div>
  );
});

export default CategoryGrid;
