'use client';

import React from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';

export interface NoteAnnotationHighlightProps {
  annotation: NoteAnnotation;
  children: React.ReactNode;
  onClick: (annotation: NoteAnnotation, e: React.MouseEvent) => void;
  className?: string;
}

const colorStyles: Record<AnnotationColor, { wrapper: string; badge: string }> = {
  amber: {
    wrapper:
      'border border-amber-400/90 dark:border-amber-500/90 bg-amber-200/60 dark:bg-amber-950/60 text-zinc-900 dark:text-zinc-100 hover:bg-amber-300/70 dark:hover:bg-amber-900/60',
    badge: 'bg-amber-400 dark:bg-amber-500 text-amber-950',
  },
  blue: {
    wrapper:
      'border border-blue-400/90 dark:border-blue-500/90 bg-blue-200/60 dark:bg-blue-950/60 text-zinc-900 dark:text-zinc-100 hover:bg-blue-300/70 dark:hover:bg-blue-900/60',
    badge: 'bg-blue-400 dark:bg-blue-500 text-blue-950',
  },
  emerald: {
    wrapper:
      'border border-emerald-400/90 dark:border-emerald-500/90 bg-emerald-200/60 dark:bg-emerald-950/60 text-zinc-900 dark:text-zinc-100 hover:bg-emerald-300/70 dark:hover:bg-emerald-900/60',
    badge: 'bg-emerald-400 dark:bg-emerald-500 text-emerald-950',
  },
  purple: {
    wrapper:
      'border border-purple-400/90 dark:border-purple-500/90 bg-purple-200/60 dark:bg-purple-950/60 text-zinc-900 dark:text-zinc-100 hover:bg-purple-300/70 dark:hover:bg-purple-900/60',
    badge: 'bg-purple-400 dark:bg-purple-500 text-purple-950',
  },
  rose: {
    wrapper:
      'border border-rose-400/90 dark:border-rose-500/90 bg-rose-200/60 dark:bg-rose-950/60 text-zinc-900 dark:text-zinc-100 hover:bg-rose-300/70 dark:hover:bg-rose-900/60',
    badge: 'bg-rose-400 dark:bg-rose-500 text-rose-950',
  },
};

export function NoteAnnotationHighlight({
  annotation,
  children,
  onClick,
  className,
}: NoteAnnotationHighlightProps) {
  const color = annotation.color || 'amber';
  const styles = colorStyles[color] || colorStyles.amber;

  return (
    <mark
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation, e);
      }}
      title={annotation.comment ? `Ghi chú: ${annotation.comment}` : 'Nhấp để xem/sửa ghi chú'}
      className={cn(
        'relative inline-block rounded-md px-1 py-0.5 font-medium cursor-pointer transition-all duration-150 group shadow-sm my-0.5',
        styles.wrapper,
        className,
      )}
    >
      {children}
      {annotation.comment && (
        <span
          className={cn(
            'inline-block ml-1.5 px-1 py-0.5 text-[9px] font-bold rounded align-middle leading-none opacity-90 group-hover:opacity-100 transition-opacity',
            styles.badge,
          )}
        >
          💬
        </span>
      )}
    </mark>
  );
}

export default NoteAnnotationHighlight;
