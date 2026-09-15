'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { useI18n } from '@/hooks/useI18n';

export interface NoteAnnotationPopoverProps {
  position: { top: number; left: number; bottom?: number };
  selectedText: string;
  existingAnnotation?: NoteAnnotation | null;
  onSave: (data: { text: string; comment: string; color: AnnotationColor }) => void;
  onUpdate?: (id: string, data: { comment?: string; color?: AnnotationColor }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const colorOptions: { key: AnnotationColor; label: string; bg: string; border: string }[] = [
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-400', border: 'border-amber-500' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-400', border: 'border-blue-500' },
  { key: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-400', border: 'border-emerald-500' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-400', border: 'border-purple-500' },
  { key: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-400', border: 'border-rose-500' },
];

export function NoteAnnotationPopover({
  position,
  selectedText,
  existingAnnotation,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: NoteAnnotationPopoverProps) {
  const { t } = useI18n();
  const isEditing = !!existingAnnotation;

  const [comment, setComment] = useState(() => existingAnnotation?.comment || '');
  const [color, setColor] = useState<AnnotationColor>(() => existingAnnotation?.color || 'amber');
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: Math.max(16, position.top),
    left: Math.max(16, position.left - 160),
  });

  useEffect(() => {
    if (!popoverRef.current) return;
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const width = popoverRect.width || 320;
    const height = popoverRect.height || 260;
    const margin = 16;

    // Horizontal clamping: keep within screen width
    let left = position.left - width / 2;
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }

    // Vertical positioning:
    // If opening above the target would cut off at top, open below instead
    let top = position.top - height - 8;
    if (top < margin) {
      const bottom = position.bottom ?? (position.top + 36);
      top = bottom + 8;
      // If placing below goes off bottom, clamp to bottom margin
      if (top + height > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - height - margin);
      }
    }

    setCoords({ top, left });
  }, [position]);

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle click outside & escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isEditing && existingAnnotation && onUpdate) {
      onUpdate(existingAnnotation.id, { comment, color });
      onClose();
    } else {
      if (!selectedText.trim()) return;
      onSave({ text: selectedText, comment, color });
      onClose();
    }
  };

  const handleDelete = () => {
    if (existingAnnotation && onDelete) {
      onDelete(existingAnnotation.id);
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      className="fixed z-[120] w-[300px] sm:w-[340px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 text-left animate-in fade-in duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with quote preview */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
            {isEditing ? 'Chi tiết ghi chú' : 'Thêm ghi chú cho đoạn'}
          </p>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium italic line-clamp-2 bg-zinc-100 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/40">
            &ldquo;{selectedText || existingAnnotation?.text}&rdquo;
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={t('common.close') || 'Đóng'}
        >
          ✕
        </button>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Màu:</span>
        <div className="flex items-center gap-1.5">
          {colorOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setColor(opt.key)}
              className={cn(
                'w-5 h-5 rounded-full transition-transform',
                opt.bg,
                color === opt.key ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
              )}
              title={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Comment textarea */}
      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Viết suy nghĩ, ghi chú hoặc phân tích của bạn..."
          rows={3}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleSave();
            }
          }}
          className="w-full text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Nhấn Ctrl+Enter để lưu nhanh
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            {t('common.delete') || 'Xóa'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('common.cancel') || 'Hủy'}
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => handleSave()}
            className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-3 py-1.5 rounded-xl hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
          >
            {isEditing ? (t('common.save') || 'Cập nhật') : 'Lưu ghi chú'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteAnnotationPopover;
