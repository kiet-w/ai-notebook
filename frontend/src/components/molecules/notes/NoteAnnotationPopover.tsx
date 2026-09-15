'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { useI18n } from '@/hooks/useI18n';

export interface NoteAnnotationPopoverProps {
  position?: { top: number; left: number; bottom?: number };
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

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={popoverRef}
        className="w-full max-w-lg bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/50 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-6 text-left animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with quote preview */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 select-none">
              {isEditing ? 'Chi tiết ghi chú' : 'Thêm ghi chú cho đoạn'}
            </span>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium italic line-clamp-3 bg-zinc-100 dark:bg-zinc-900/80 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
              &ldquo;{selectedText || existingAnnotation?.text}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title={t('common.close') || 'Đóng'}
          >
            ✕
          </button>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            Màu đánh dấu:
          </span>
          <div className="flex items-center gap-2">
            {colorOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setColor(opt.key)}
                className={cn(
                  'w-6 h-6 rounded-full transition-transform cursor-pointer',
                  opt.bg,
                  color === opt.key
                    ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900 scale-110'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                )}
                title={opt.label}
              />
            ))}
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Viết suy nghĩ, ghi chú hoặc phân tích của bạn..."
            rows={4}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSave();
              }
            }}
            className="w-full text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
            <span>Nhấn Ctrl+Enter để lưu nhanh</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              {t('common.delete') || 'Xóa'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {t('common.cancel') || 'Hủy'}
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-4 py-2 rounded-xl hover:bg-zinc-800 dark:hover:bg-white shadow-md transition-all cursor-pointer"
            >
              {isEditing ? (t('common.save') || 'Cập nhật') : 'Lưu ghi chú'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteAnnotationPopover;
