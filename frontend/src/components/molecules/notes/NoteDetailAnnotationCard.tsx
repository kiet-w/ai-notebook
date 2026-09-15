'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { cn } from '@/lib/ui-styles';
import { useI18n } from '@/hooks/useI18n';
import { Highlighter, MessageSquare, Trash2, X, Check } from 'lucide-react';

export interface NoteDetailAnnotationCardProps {
  annotations: NoteAnnotation[];
  activeAnnotation: NoteAnnotation | null;
  selectedText?: string;
  isCreating?: boolean;
  activeColor?: AnnotationColor;
  onChangeActiveColor?: (color: AnnotationColor) => void;
  onSaveNew?: (data: { text: string; comment: string; color: AnnotationColor }) => void;
  onUpdate: (id: string, data: { comment?: string; color?: AnnotationColor }) => void;
  onDelete: (id: string) => void;
  onSelectAnnotation: (annotation: NoteAnnotation) => void;
  onCloseEditor: () => void;
  onClosePanel?: () => void;
  className?: string;
}

const colorOptions: { key: AnnotationColor; label: string; bg: string; border: string; ring: string }[] = [
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-400', border: 'border-amber-500', ring: 'ring-amber-400' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-400', border: 'border-blue-500', ring: 'ring-blue-400' },
  { key: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-400', border: 'border-emerald-500', ring: 'ring-emerald-400' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-400', border: 'border-purple-500', ring: 'ring-purple-400' },
  { key: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-400', border: 'border-rose-500', ring: 'ring-rose-400' },
];

const colorDots: Record<AnnotationColor, string> = {
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  purple: 'bg-purple-400',
  rose: 'bg-rose-400',
};

interface AnnotationEditorFormProps {
  activeAnnotation: NoteAnnotation | null;
  selectedText?: string;
  isCreating?: boolean;
  activeColor: AnnotationColor;
  onChangeActiveColor?: (color: AnnotationColor) => void;
  onSaveNew?: (data: { text: string; comment: string; color: AnnotationColor }) => void;
  onUpdate: (id: string, data: { comment?: string; color?: AnnotationColor }) => void;
  onDelete: (id: string) => void;
  onCloseEditor: () => void;
}

function AnnotationEditorForm({
  activeAnnotation,
  selectedText = '',
  isCreating = false,
  activeColor = 'amber',
  onChangeActiveColor,
  onSaveNew,
  onUpdate,
  onDelete,
  onCloseEditor,
}: AnnotationEditorFormProps) {
  const { t } = useI18n();
  const isEditing = !!activeAnnotation;

  const [comment, setComment] = useState(() => activeAnnotation?.comment || '');
  const [editorColor, setEditorColor] = useState<AnnotationColor>(
    () => activeAnnotation?.color || activeColor
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isEditing && activeAnnotation) {
      onUpdate(activeAnnotation.id, { comment, color: editorColor });
      onCloseEditor();
    } else if (isCreating && onSaveNew && selectedText.trim()) {
      onSaveNew({
        text: selectedText.trim(),
        comment,
        color: editorColor,
      });
      onCloseEditor();
    }
  };

  const handleDelete = () => {
    if (activeAnnotation) {
      onDelete(activeAnnotation.id);
      onCloseEditor();
    }
  };

  const displayedQuote = activeAnnotation?.text || selectedText;

  return (
    <div className="bg-zinc-50/90 dark:bg-zinc-900/60 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-3 shrink-0 animate-in fade-in duration-150">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {isEditing ? 'Sửa ghi chú' : 'Ghi chú cho đoạn'}
        </span>
        <button
          type="button"
          onClick={onCloseEditor}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Đóng soạn thảo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quoted Text Preview */}
      {displayedQuote && (
        <div className="bg-white/80 dark:bg-black/40 rounded-xl p-2.5 border border-zinc-200/60 dark:border-zinc-800/60 text-xs italic text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
          &ldquo;{displayedQuote}&rdquo;
        </div>
      )}

      {/* Color Selection */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none">
          Màu đánh dấu:
        </span>
        <div className="flex items-center gap-1.5">
          {colorOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setEditorColor(opt.key);
                if (onChangeActiveColor) onChangeActiveColor(opt.key);
              }}
              className={cn(
                'w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center',
                opt.bg,
                editorColor === opt.key
                  ? 'ring-2 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900 scale-110'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              )}
              title={opt.label}
            >
              {editorColor === opt.key && (
                <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-900 stroke-[3]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Textarea */}
      <div className="space-y-1">
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
          className="w-full text-xs bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none leading-relaxed"
        />
        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block text-right select-none">
          Ctrl+Enter để lưu
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="Xóa ghi chú này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCloseEditor}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {t('common.cancel') || 'Hủy'}
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-3.5 py-1.5 rounded-lg hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all cursor-pointer"
          >
            {isEditing ? (t('common.save') || 'Cập nhật') : 'Lưu ghi chú'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NoteDetailAnnotationCard({
  annotations,
  activeAnnotation,
  selectedText = '',
  isCreating = false,
  activeColor = 'amber',
  onChangeActiveColor,
  onSaveNew,
  onUpdate,
  onDelete,
  onSelectAnnotation,
  onCloseEditor,
  onClosePanel,
  className,
}: NoteDetailAnnotationCardProps) {
  const { t } = useI18n();
  const showEditor = !!activeAnnotation || isCreating;

  return (
    <div
      className={cn(
        'bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-5 flex flex-col shrink-0 overflow-hidden transition-all',
        className || 'w-full lg:w-[320px] xl:w-[360px] h-[60vh] lg:h-[88vh] lg:max-h-[850px]'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Card Header */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/50 dark:border-zinc-800/40 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
            {t('notes.annotations') || 'Ghi chú & Trích dẫn'}
          </span>
          {annotations.length > 0 && (
            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
              {annotations.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Thu gọn bảng ghi chú"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto space-y-4 pr-1">
        {/* Active Editor Form */}
        {showEditor && (
          <AnnotationEditorForm
            key={activeAnnotation?.id || selectedText || 'new'}
            activeAnnotation={activeAnnotation}
            selectedText={selectedText}
            isCreating={isCreating}
            activeColor={activeColor}
            onChangeActiveColor={onChangeActiveColor}
            onSaveNew={onSaveNew}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCloseEditor={onCloseEditor}
          />
        )}

        {/* Existing Annotations List */}
        <div className="space-y-2.5 flex-1">
          {annotations.length === 0 && !showEditor && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500 space-y-3 my-auto">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-800/60">
                <Highlighter className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Chưa có ghi chú nào
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Bôi đen đoạn văn bản trong bài bên trái để tạo ghi chú cá nhân.
                </p>
              </div>
            </div>
          )}

          {annotations.map((ann) => {
            const isSelected = activeAnnotation?.id === ann.id;
            return (
              <div
                key={ann.id}
                onClick={() => onSelectAnnotation(ann)}
                className={cn(
                  'group relative p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-1.5',
                  isSelected
                    ? 'bg-zinc-100/90 dark:bg-zinc-800/90 border-zinc-900 dark:border-zinc-100 shadow-sm'
                    : 'bg-zinc-50/70 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-850/60 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
              >
                <div className="flex items-center justify-between gap-2">
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
                      onDelete(ann.id);
                      if (activeAnnotation?.id === ann.id) {
                        onCloseEditor();
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5 rounded transition-all text-xs cursor-pointer"
                    title="Xóa ghi chú"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Quoted Text */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2 pl-2 border-l-2 border-zinc-300 dark:border-zinc-700 leading-relaxed">
                  &ldquo;{ann.text}&rdquo;
                </p>

                {/* Comment */}
                {ann.comment && (
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-snug pt-0.5">
                    {ann.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NoteDetailAnnotationCard;
