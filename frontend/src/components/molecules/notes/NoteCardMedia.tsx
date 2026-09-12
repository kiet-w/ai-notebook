/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { getRelativeImageUrl } from '@/utils/image';
import { useI18n } from '@/hooks/useI18n';

export interface NoteCardMediaProps {
  url: string;
  title?: string;
  isProcessing?: boolean;
  isUnread?: boolean;
  aspectRatio: 'landscape' | 'portrait';
}

export function NoteCardMedia({
  url,
  title,
  isProcessing,
  isUnread,
  aspectRatio,
}: NoteCardMediaProps) {
  const { t } = useI18n();
  const altText = title || t('notes.untitledNote');

  if (aspectRatio === 'landscape') {
    return (
      <div className="h-[65px] w-[65px] shrink-0 relative overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/45 bg-zinc-50 dark:bg-zinc-950">
        <img 
          src={getRelativeImageUrl(url)} 
          alt={altText} 
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center gap-1.5">
            <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="text-[8px] font-bold text-white tracking-widest uppercase select-none">
              {t('notes.processingAi')}
            </span>
          </div>
        )}
        {isUnread && !isProcessing && (
          <span className="absolute top-2 right-2 z-10 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-20 h-full shrink-0 relative overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/45 bg-zinc-50 dark:bg-zinc-950">
      <img 
        src={getRelativeImageUrl(url)} 
        alt={altText} 
        className="object-cover w-full h-full"
        loading="lazy"
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
          <div className="w-4 h-4 rounded-full border border-white/30 border-t-white animate-spin" />
          <span className="text-[7px] font-bold text-white tracking-wider uppercase select-none">
            {t('notes.processingAi')}
          </span>
        </div>
      )}
      {isUnread && !isProcessing && (
        <span className="absolute top-2 right-2 z-10 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
        </span>
      )}
    </div>
  );
}

export default NoteCardMedia;
