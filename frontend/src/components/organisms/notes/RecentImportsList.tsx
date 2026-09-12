'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types/note';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export interface RecentImportItem {
  id: string;
  title: string;
  category?: Category;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt?: string;
}

export interface RecentImportsListProps {
  items?: RecentImportItem[];
  recentImports?: RecentImportItem[];
  totalCount?: number;
  totalNotesCount?: number;
  onSelectItem?: (item: RecentImportItem) => void;
  onSelectNoteCategory?: (category: string) => void;
}

const getStatusIcon = (status: RecentImportItem['status']) => {
  switch (status) {
    case 'PROCESSING':
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500" />;
    case 'COMPLETED':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'FAILED':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  }
};

export const RecentImportsList = memo(function RecentImportsList({
  items,
  recentImports,
  totalCount,
  totalNotesCount,
  onSelectItem,
  onSelectNoteCategory,
}: RecentImportsListProps) {
  const router = useRouter();
  const { t } = useI18n();
  const list = items || recentImports || [];
  const count = totalCount ?? totalNotesCount ?? list.length;

  if (list.length === 0) return null;

  const handleClick = (item: RecentImportItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    } else if (onSelectNoteCategory && item.category) {
      onSelectNoteCategory(item.category);
    } else if (item.category && item.status === 'COMPLETED') {
      router.push(`/${item.category}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] select-none">
          {t('notes.recentImportsTitle')}
        </h2>
        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums select-none">
          {t('notes.totalCount', { count })}
        </span>
      </div>
      <div className="space-y-1.5">
        {list.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            disabled={item.status === 'PROCESSING'}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer group text-left disabled:cursor-default disabled:opacity-70"
          >
            {getStatusIcon(item.status)}
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {item.title}
            </span>
            {item.category && (
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest shrink-0">
                {t(`categories.${item.category}`)}
              </span>
            )}
            {item.status === 'COMPLETED' && item.category && (
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

export default RecentImportsList;
