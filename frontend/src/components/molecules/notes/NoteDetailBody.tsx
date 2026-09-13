'use client';

import React from 'react';
import { Note } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import NoteMarkdownRenderer from '@/components/atoms/notes/NoteMarkdownRenderer';
import NoteAttachmentCard from './NoteAttachmentCard';
import NoteDetailSkeleton from './NoteDetailSkeleton';
import { cn } from '@/lib/ui-styles';

export interface NoteDetailBodyProps {
  note: Note;
  loading: boolean;
  hasDoc: boolean;
}

export function NoteDetailBody({ note, loading, hasDoc }: NoteDetailBodyProps) {
  const { t } = useI18n();

  if (loading) {
    return <NoteDetailSkeleton />;
  }

  return (
    <div
      className={cn(
        'h-full',
        note.content
          ? 'space-y-8 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden'
          : 'max-w-3xl mx-auto space-y-6'
      )}
    >
      <div
        className={cn(
          note.content
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-start lg:items-stretch lg:flex-1 lg:overflow-hidden h-full'
            : 'space-y-6'
        )}
      >
        {/* Left Column: Full Content Analysis (if available) */}
        {note.content && (
          <div className="lg:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:p-8 lg:pr-4">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">{t('notes.fullContentAnalysis')}</p>
            <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-2">
              <NoteMarkdownRenderer content={note.content} />
            </div>
          </div>
        )}

        {/* Right / Main Column: Attachment, Summary & Bullets */}
        <div className={note.content ? 'lg:col-span-5 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:p-8 lg:pl-4 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-zinc-800/40' : 'space-y-6'}>
          {hasDoc && (
            <NoteAttachmentCard url={note.url!} />
          )}

          {note.summary && (
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">{t('notes.summary')}</p>
              <p className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                {note.summary}
              </p>
            </div>
          )}

          {note.bullets && note.bullets.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-3 select-none">{t('notes.keyTakeaways')}</p>
              <ul className="space-y-2.5">
                {note.bullets.map((bullet, i) => (
                  <li key={i} className="text-base text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-650" />
                    <span className="leading-relaxed font-medium">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteDetailBody;
