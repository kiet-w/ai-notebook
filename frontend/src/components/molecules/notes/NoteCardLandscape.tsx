'use client';

import React from 'react';
import { Note } from '@/types/note';
import Badge from '@/components/atoms/common/Badge';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryLabel } from '@/utils/category';
import NoteCardMedia from './NoteCardMedia';

export interface NoteCardLandscapeProps {
  note: Note;
  isUnread: boolean;
  parsedDate: Date | null;
}

export function NoteCardLandscape({ note, isUnread, parsedDate }: NoteCardLandscapeProps) {
  const { t } = useI18n();
  const isProcessing = note.status === 'PROCESSING';
  const title = note.title || t('notes.untitledNote');

  return (
    <div className="flex flex-col gap-2 h-full w-full justify-between">
      <NoteCardMedia
        url={note.url!}
        title={title}
        isProcessing={isProcessing}
        isUnread={isUnread}
        aspectRatio="landscape"
      />
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between mb-1 gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              {isProcessing && (
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-650 animate-pulse shrink-0" />
              )}
              <h3 className="font-semibold text-foreground leading-none text-[15px] tracking-tight truncate">
                {title}
              </h3>
            </div>
            {note.category && (
              <Badge 
                text={getCategoryLabel(note.category, t)} 
              />
            )}
          </div>

          {note.summary ? (
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 font-medium line-clamp-1 leading-normal">
              {note.summary}
            </p>
          ) : note.content ? (
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 line-clamp-1 leading-normal italic">
              {note.content}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {parsedDate && (
              <>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                  {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-550">
                  {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteCardLandscape;
