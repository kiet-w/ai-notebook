import React, { memo } from 'react';
import { Category } from '@/types/note';
import { getCategoryLabel } from '@/utils/category';
import { useI18n } from '@/hooks/useI18n';
import { cn } from '@/lib/ui-styles';

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
  name,
  count,
  unreadCount = 0,
  onClick,
  className,
}: CategoryGridItemProps) {
  const { t } = useI18n();
  const displayName = name ?? getCategoryLabel(category, t);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative group flex flex-col justify-between p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer min-h-[68px] text-left',
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-foreground transition-colors truncate">
          {displayName}
        </span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums">
            {unreadCount}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between w-full mt-2">
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
          {count} {t('notes.items', { count })}
        </span>
      </div>
    </button>
  );
});

export default CategoryGridItem;

