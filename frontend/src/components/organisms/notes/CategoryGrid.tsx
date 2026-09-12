'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types/note';

export interface CategoryGridProps {
  categoryStats?: Record<string, number>;
  unreadCounts?: Record<string, number>;
  onSelectCategory?: (category: Category | string) => void;
}

interface CategoryItemConfig {
  id: Category;
  icon: string;
}

const CATEGORIES: CategoryItemConfig[] = [
  { id: 'Cooking', icon: '🍳' },
  { id: 'Tech', icon: '💻' },
  { id: 'Learning', icon: '📚' },
  { id: 'Work', icon: '💼' },
  { id: 'Finance', icon: '💰' },
  { id: 'Other', icon: '📝' },
];

export const CategoryGrid = memo(function CategoryGrid({
  categoryStats = {},
  unreadCounts = {},
  onSelectCategory,
}: CategoryGridProps) {
  const router = useRouter();

  const handleSelect = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      router.push(`/${category}`);
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] mb-4 select-none">
        Categories
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {CATEGORIES.map(({ id: cat, icon }) => {
          const unreadCount = unreadCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => handleSelect(cat)}
              className="relative group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums shadow-sm border-2 border-white dark:border-zinc-950 z-10">
                  {unreadCount}
                </span>
              )}
              <span className="text-lg select-none">{icon}</span>
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-foreground transition-colors">
                {cat}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-650 tabular-nums">
                {categoryStats[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default CategoryGrid;
