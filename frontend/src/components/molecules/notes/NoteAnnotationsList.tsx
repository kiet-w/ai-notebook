'use client';

import React from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { useI18n } from '@/hooks/useI18n';

export interface NoteAnnotationsListProps {
  annotations: NoteAnnotation[];
  onSelectAnnotation: (annotation: NoteAnnotation, e: React.MouseEvent) => void;
  onDeleteAnnotation: (id: string) => void;
}

const colorDots: Record<AnnotationColor, string> = {
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  purple: 'bg-purple-400',
  rose: 'bg-rose-400',
};

export function NoteAnnotationsList({
  annotations,
  onSelectAnnotation,
  onDeleteAnnotation,
}: NoteAnnotationsListProps) {
  const { t } = useI18n();

  if (annotations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
            {t('notes.annotations') || 'Ghi chú của bạn'} (0)
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('notes.selectTextToAnnotate') || 'Bôi đen đoạn văn bản trong bài để tạo ghi chú cá nhân.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
          {t('notes.annotations') || 'Ghi chú của bạn'} ({annotations.length})
        </p>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {annotations.map((ann) => (
          <div
            key={ann.id}
            onClick={(e) => onSelectAnnotation(ann, e)}
            className="group relative p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-850/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full shrink-0', colorDots[ann.color] || colorDots.amber)} />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAnnotation(ann.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5 rounded transition-all text-xs"
                title={t('common.delete') || 'Xóa'}
              >
                ✕
              </button>
            </div>

            {/* Quoted Text */}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2 mb-1.5 pl-2 border-l-2 border-zinc-300 dark:border-zinc-700">
              &ldquo;{ann.text}&rdquo;
            </p>

            {/* Comment */}
            {ann.comment && (
              <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-snug">
                {ann.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoteAnnotationsList;
