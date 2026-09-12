import React, { memo } from 'react';
import { Category } from '@/types/note';
import { getCategoryEmoji, getCategoryLabel } from '@/utils/category';
import { useI18n } from '@/hooks/useI18n';

export interface CategoryGridItemProps {
  category: Category | string;
  icon?: string;
  name?: string;
  count: number;
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}

export const CategoryGridItem = memo(function CategoryGridItem({
  category,
  icon,
  name,
  count,
  unreadCount = 0,
  onClick,
  className = '',
}: CategoryGridItemProps) {
  const { t } = useI18n();
  const displayIcon = icon ?? getCategoryEmoji(category);
  const displayName = name ?? getCategoryLabel(category, t);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer ${className}`}
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums shadow-sm border-2 border-white dark:border-zinc-950 z-10">
          {unreadCount}
        </span>
      )}
      <span className="text-lg select-none" role="img" aria-label={displayName}>
        {displayIcon}
      </span>
      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-foreground transition-colors">
        {displayName}
      </span>
      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-650 tabular-nums">
        {count}
      </span>
    </button>
  );
});

export default CategoryGridItem;
