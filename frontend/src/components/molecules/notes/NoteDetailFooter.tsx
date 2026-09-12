'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';

export interface NoteDetailFooterProps {
  createdAt?: string | null;
}

export function NoteDetailFooter({ createdAt }: NoteDetailFooterProps) {
  const { t } = useI18n();

  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return null;

  return (
    <div className="px-8 py-4 border-t border-zinc-200/30 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-400 dark:text-zinc-500 flex items-center justify-between select-none">
      <span>{t('notes.createdOn')}</span>
      <span>
        {date.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
        {` ${t('notes.at')} `}
        {date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit' 
        })}
      </span>
    </div>
  );
}

export default NoteDetailFooter;
