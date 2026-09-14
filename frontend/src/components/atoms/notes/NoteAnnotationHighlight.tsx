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
      'border-b-2 border-amber-400 dark:border-amber-500/80 bg-amber-100/60 dark:bg-amber-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-amber-200/80 dark:hover:bg-amber-900/50',
    badge: 'bg-amber-400 dark:bg-amber-500 text-amber-950',
  },
  blue: {
    wrapper:
      'border-b-2 border-blue-400 dark:border-blue-500/80 bg-blue-100/60 dark:bg-blue-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-blue-200/80 dark:hover:bg-blue-900/50',
    badge: 'bg-blue-400 dark:bg-blue-500 text-blue-950',
  },
  emerald: {
    wrapper:
      'border-b-2 border-emerald-400 dark:border-emerald-500/80 bg-emerald-100/60 dark:bg-emerald-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/50',
    badge: 'bg-emerald-400 dark:bg-emerald-500 text-emerald-950',
  },
  purple: {
    wrapper:
      'border-b-2 border-purple-400 dark:border-purple-500/80 bg-purple-100/60 dark:bg-purple-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-purple-200/80 dark:hover:bg-purple-900/50',
    badge: 'bg-purple-400 dark:bg-purple-500 text-purple-950',
  },
  rose: {
    wrapper:
      'border-b-2 border-rose-400 dark:border-rose-500/80 bg-rose-100/60 dark:bg-rose-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-rose-200/80 dark:hover:bg-rose-900/50',
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
      title={annotation.comment ? `Ghi chú: ${annotation.comment}` : 'Xem ghi chú'}
      className={cn(
        'relative inline rounded px-1 py-0.5 font-normal cursor-pointer transition-all duration-150 group decoration-clone',
        styles.wrapper,
        className,
      )}
    >
      {children}
      {annotation.comment && (
        <span
          className={cn(
            'inline-block ml-1 px-1 py-0.2 text-[9px] font-bold rounded uppercase align-middle leading-none opacity-80 group-hover:opacity-100 transition-opacity',
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
