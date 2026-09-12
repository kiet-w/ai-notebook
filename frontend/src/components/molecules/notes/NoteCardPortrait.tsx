'use client';

import React from 'react';
import { Note } from '@/types/note';
import Badge from '@/components/atoms/common/Badge';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryEmoji, getCategoryLabel } from '@/utils/category';
import NoteCardMedia from './NoteCardMedia';

export interface NoteCardPortraitProps {
  note: Note;
  isUnread: boolean;
  parsedDate: Date | null;
}

export function NoteCardPortrait({ note, isUnread, parsedDate }: NoteCardPortraitProps) {
  const { t } = useI18n();
  const isProcessing = note.status === 'PROCESSING';
  const title = note.title || t('notes.untitledNote');

  return (
    <div className="flex gap-4 items-stretch h-full w-full">
      <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
        <div>
          <div className="flex items-start justify-between mb-3 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {isProcessing && (
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-650 animate-pulse shrink-0" />
              )}
              <h3 className="font-semibold text-foreground leading-tight text-[17px] tracking-tight line-clamp-1">
                {title}
              </h3>
            </div>
            {note.category && (
              <Badge 
                icon={getCategoryEmoji(note.category)} 
                text={getCategoryLabel(note.category, t)} 
              />
            )}
          </div>

          {note.summary ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium line-clamp-2 leading-relaxed">
              {note.summary}
            </p>
          ) : note.content ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2 leading-relaxed italic">
              {note.content}
            </p>
          ) : null}
        </div>

        <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {parsedDate && (
              <>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                  {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-550">
                  {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <NoteCardMedia
        url={note.url!}
        title={title}
        isProcessing={isProcessing}
        isUnread={isUnread}
        aspectRatio="portrait"
      />
    </div>
  );
}

export default NoteCardPortrait;
