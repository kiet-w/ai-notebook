/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';

export interface NoteDetailImageViewerProps {
  url: string;
  title?: string;
  isProcessing?: boolean;
  hasPortraitImage?: boolean;
}

export function NoteDetailImageViewer({
  url,
  title,
  isProcessing,
  hasPortraitImage,
}: NoteDetailImageViewerProps) {
  const { t } = useI18n();
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div 
      className={`${
        hasPortraitImage 
          ? 'w-full lg:w-[40%] max-w-xl lg:max-w-2xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]' 
          : 'w-full lg:w-[50%] max-w-2xl lg:max-w-3xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]'
      } bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-6 flex flex-col shrink-0 relative overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full flex items-center justify-between mb-3 shrink-0">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest select-none">
          {t('notes.imageAttachment')}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 dark:border-zinc-800/30 px-2 py-0.5 rounded-full select-none">
            {isZoomed ? t('notes.clickToFit') : t('notes.clickToZoom')}
          </span>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:text-zinc-550 dark:hover:text-zinc-200 uppercase tracking-widest hover:underline cursor-pointer select-none"
          >
            {t('notes.openOriginal')}
          </a>
        </div>
      </div>
      <div 
        className={`w-full flex-1 flex items-center justify-center relative min-h-0 rounded-2xl ${
          isZoomed ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'
        }`}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <img 
          src={url} 
          alt={title || t('notes.attachment')} 
          className={`rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm transition-all duration-300 ${
            isZoomed 
              ? 'max-w-none max-h-none w-auto h-auto scale-100 object-none p-4' 
              : 'w-full h-full object-contain'
          }`}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="text-xs font-bold text-white tracking-widest uppercase select-none">
              {t('notes.aiAnalyzingImage')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetailImageViewer;
