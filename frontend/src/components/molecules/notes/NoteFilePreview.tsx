/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { XCircle } from 'lucide-react';

export interface NoteFilePreviewProps {
  file: File;
  previewUrl: string | null;
  onRemove: () => void;
}

export function NoteFilePreview({ file, previewUrl, onRemove }: NoteFilePreviewProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mx-2 mt-2 mb-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
        ) : (
          <span className="text-lg">📄</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{file.name}</p>
        <p className="text-[10px] font-medium text-zinc-500 tracking-wide mt-0.5">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <button 
        type="button" 
        onClick={onRemove}
        className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
}

export default NoteFilePreview;
