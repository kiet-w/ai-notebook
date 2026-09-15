'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { MoreHorizontal, MessageSquare, Trash2 } from 'lucide-react';

export interface NoteAnnotationHighlightProps {
  annotation: NoteAnnotation;
  children: React.ReactNode;
  onClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void;
  onOpenNote?: (annotation: NoteAnnotation) => void;
  onDelete?: (id: string) => void;
  onChangeColor?: (id: string, color: AnnotationColor) => void;
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
        'relative inline rounded-md px-1 py-0.5 font-medium cursor-pointer transition-all duration-150 group shadow-sm my-0.5',
        styles.wrapper,
        className,
      )}
    >
      {children}

      {/* Badge if comment exists */}
      {annotation.comment && (
        <span
          className={cn(
            'inline-block ml-1 px-1 py-0.5 text-[9px] font-bold rounded align-middle leading-none opacity-90 group-hover:opacity-100 transition-opacity',
            styles.badge,
          )}
        >
          💬
        </span>
      )}

      {/* 3-dots button appearing on hover */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            setShowMenu((prev) => !prev);
          }
        }}
        className={cn(
          'inline-flex items-center justify-center ml-1 px-1 py-0.5 rounded text-[10px] select-none cursor-pointer transition-all duration-150 align-middle -translate-y-0.5',
          'bg-black/10 dark:bg-white/15 hover:bg-black/20 dark:hover:bg-white/25 text-zinc-700 dark:text-zinc-200',
          showMenu ? 'opacity-100 ring-1 ring-zinc-400 dark:ring-zinc-500' : 'opacity-0 group-hover:opacity-100'
        )}
        title="Tùy chọn highlight"
      >
        <MoreHorizontal className="w-3 h-3" />
      </span>

      {/* Popover Action Menu */}
      {showMenu && (
        <span
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_12px_28px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap select-none"
        >
          {/* Button: Thêm / Sửa ghi chú */}
          <button
            type="button"
            onClick={handleOpenNoteAction}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={annotation.comment ? 'Sửa ghi chú' : 'Thêm ghi chú cho đoạn này'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>{annotation.comment ? 'Sửa ghi chú' : 'Thêm ghi chú'}</span>
          </button>

          {/* Divider */}
          <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

          {/* Color Dots */}
          {onChangeColor && (
            <>
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
                      'w-3.5 h-3.5 rounded-full transition-transform cursor-pointer',
                      opt.bg,
                      color === opt.key
                        ? 'scale-125 ring-1.5 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900'
                        : 'opacity-60 hover:opacity-100 hover:scale-110'
                    )}
                    title={opt.label}
                  />
                ))}
              </div>
              <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
            </>
          )}

          {/* Button: Xóa highlight */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteAction}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Xóa highlight này"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}
        </span>
      )}
    </mark>
  );
}

export default NoteAnnotationHighlight;
