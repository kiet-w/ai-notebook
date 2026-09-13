'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { cn } from '@/lib/ui-styles';

export interface NoteAttachmentCardProps {
  url: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function NoteAttachmentCard({ url, className, size = 'md' }: NoteAttachmentCardProps) {
  const { t } = useI18n();
  const fileName = url.split('/').pop() || t('notes.document');

  if (size === 'sm') {
    return (
      <div
        className={cn(
          'p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between gap-4',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">📄</span>
          <div className="min-w-0">
            <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-0.5 select-none">{t('notes.attachment')}</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {fileName}
            </p>
          </div>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold text-white dark:text-zinc-900 shadow-sm shrink-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {t('common.openFile')}
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800/40 flex items-center justify-between gap-4',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-3xl shrink-0">📄</span>
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5 select-none">{t('notes.attachment')}</p>
          <p className="text-base font-semibold text-foreground truncate">
            {fileName}
          </p>
        </div>
      </div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm shrink-0 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {t('notes.openFile')}
      </a>
    </div>
  );
}

export default NoteAttachmentCard;
