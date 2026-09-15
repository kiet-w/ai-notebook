'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { MessageSquare, Trash2 } from 'lucide-react';

export interface NoteAnnotationHighlightProps {
  annotation: NoteAnnotation;
  children: React.ReactNode;
  onClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void;
  onOpenNote?: (annotation: NoteAnnotation) => void;
  onDelete?: (id: string) => void;
  onChangeColor?: (id: string, color: AnnotationColor) => void;
  className?: string;
}

const colorStyles: Record<AnnotationColor, { mark: string; underline: string }> = {
  amber: {
    mark: 'bg-amber-200/70 dark:bg-amber-500/25 text-inherit',
    underline: 'border-b-2 border-amber-400 dark:border-amber-400',
  },
  blue: {
    mark: 'bg-blue-200/70 dark:bg-blue-500/25 text-inherit',
    underline: 'border-b-2 border-blue-400 dark:border-blue-400',
  },
  emerald: {
    mark: 'bg-emerald-200/70 dark:bg-emerald-500/25 text-inherit',
    underline: 'border-b-2 border-emerald-400 dark:border-emerald-400',
  },
  purple: {
    mark: 'bg-purple-200/70 dark:bg-purple-500/25 text-inherit',
    underline: 'border-b-2 border-purple-400 dark:border-purple-400',
  },
  rose: {
    mark: 'bg-rose-200/70 dark:bg-rose-500/25 text-inherit',
    underline: 'border-b-2 border-rose-400 dark:border-rose-400',
  },
};

const colorOptions: { key: AnnotationColor; label: string; bg: string }[] = [
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-400' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-400' },
  { key: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-400' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-400' },
  { key: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-400' },
];

export function NoteAnnotationHighlight({
  annotation,
  children,
  onClick,
  onOpenNote,
  onDelete,
  onChangeColor,
  className,
}: NoteAnnotationHighlightProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const color = annotation.color || 'amber';
  const styles = colorStyles[color] || colorStyles.amber;

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleOpenNoteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onOpenNote) {
      onOpenNote(annotation);
    } else if (onClick) {
      onClick(annotation, e);
    }
  };

  const handleDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(annotation.id);
    }
  };

  return (
    <mark
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(annotation, e);
      }}
      className={cn(
        'relative inline rounded-sm px-0.5 font-medium cursor-pointer transition-colors duration-150 group',
        styles.mark,
        styles.underline,
        annotation.comment ? 'border-b-[2.5px] border-dashed font-semibold' : '',
        className,
      )}
    >
      {/* 100% pure text stream with zero inline width displacement */}
      {children}

      {/* Floating Hover Toolbar (ABSOLUTE - takes ZERO inline space, never collides with text) */}
      <span
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute -top-8 left-1/2 -translate-x-1/2 z-30',
          'pointer-events-none group-hover:pointer-events-auto',
          'transition-all duration-150',
          showMenu
            ? 'flex pointer-events-auto opacity-100 scale-100'
            : 'hidden group-hover:flex opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
        )}
      >
        <span
          ref={menuRef}
          className="flex items-center gap-1 p-1 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-xl rounded-full border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] whitespace-nowrap select-none"
        >
          {/* Action 1: Thêm / Sửa Ghi chú */}
          <button
            type="button"
            onClick={handleOpenNoteAction}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={annotation.comment ? 'Xem / Sửa ghi chú' : 'Thêm ghi chú cho đoạn này'}
          >
            <MessageSquare className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>{annotation.comment ? 'Ghi chú' : 'Thêm ghi chú'}</span>
          </button>

          <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />

          {/* Action 2: Color Options */}
          {onChangeColor && (
            <div className="flex items-center gap-1 px-1">
              {colorOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeColor(annotation.id, opt.key);
                  }}
                  className={cn(
                    'w-3 h-3 rounded-full transition-transform cursor-pointer',
                    opt.bg,
                    color === opt.key
                      ? 'scale-125 ring-1.5 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900'
                      : 'opacity-60 hover:opacity-100 hover:scale-110'
                  )}
                  title={opt.label}
                />
              ))}
            </div>
          )}

          {/* Action 3: Xóa Highlight */}
          {onDelete && (
            <>
              <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
              <button
                type="button"
                onClick={handleDeleteAction}
                className="flex items-center gap-1 px-1.5 py-1 rounded-full text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Xóa highlight này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </span>
      </span>
    </mark>
  );
}

export default NoteAnnotationHighlight;
