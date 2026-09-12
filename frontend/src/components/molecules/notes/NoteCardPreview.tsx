/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { Note } from '@/types/note';
import Badge from '@/components/atoms/common/Badge';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryEmoji, getCategoryLabel } from '@/utils/category';
import { getRelativeImageUrl } from '@/utils/image';
import NoteMarkdownRenderer from '@/components/atoms/notes/NoteMarkdownRenderer';
import NoteAttachmentCard from './NoteAttachmentCard';

export interface NoteCardPreviewProps {
  note: Note;
  popupPos: 'left' | 'right';
  parsedDate: Date | null;
  onClick?: () => void;
}

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.startsWith('data:image/');
};

export function NoteCardPreview({
  note,
  popupPos,
  parsedDate,
  onClick,
}: NoteCardPreviewProps) {
  const { t } = useI18n();
  const hasImage = !!(note.url && isImageUrl(note.url));
  const hasDoc = !!(note.url && !isImageUrl(note.url));

  return (
    <div 
      onClick={onClick}
      className={`absolute top-0 ${popupPos === 'right' ? 'right-0' : 'left-0'} w-full h-[400px] sm:w-[calc(200%+1rem)] sm:h-[calc(200%+1rem)] z-50 p-6 rounded-2xl border border-zinc-300/60 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl flex flex-col gap-4 cursor-pointer transition-all`}
    >
      <div className="flex items-start justify-between gap-4 shrink-0">
        <h3 className="font-semibold text-foreground leading-tight text-[17px] tracking-tight">
          {note.title || t('notes.untitledNote')}
        </h3>
        {note.category && (
          <Badge 
            icon={getCategoryEmoji(note.category)} 
            text={getCategoryLabel(note.category, t)} 
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Column 1 (Left): Summary and Bullets */}
          <div className="space-y-6">
            {note.summary && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5 select-none">{t('notes.summary')}</p>
                <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {note.summary}
                </p>
              </div>
            )}
            
            {note.bullets && note.bullets.length > 0 && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">{t('notes.keyTakeaways')}</p>
                <ul className="space-y-2">
                  {note.bullets.map((bullet, i) => (
                    <li key={i} className="text-sm text-zinc-600 dark:text-zinc-300 flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      <span className="leading-snug font-medium">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Column 2 (Right): Image and Content */}
          <div className="space-y-6">
            {hasImage && (
              <div className="overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center relative w-full h-[180px]">
                <img 
                  src={getRelativeImageUrl(note.url!)} 
                  alt={note.title || t('notes.attachment')} 
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
            )}

            {hasDoc && (
              <NoteAttachmentCard url={note.url!} size="sm" />
            )}

            {note.content && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5 select-none">{t('notes.fullContentAnalysis')}</p>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800/30 space-y-1.5">
                  <NoteMarkdownRenderer content={note.content} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between shrink-0">
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
  );
}

export default NoteCardPreview;
