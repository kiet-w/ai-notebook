'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Note } from '@/types/note';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { useI18n } from '@/hooks/useI18n';
import { useNoteAnnotations } from '@/hooks/useNoteAnnotations';
import NoteMarkdownRenderer from '@/components/atoms/notes/NoteMarkdownRenderer';
import NoteAttachmentCard from './NoteAttachmentCard';
import NoteDetailSkeleton from './NoteDetailSkeleton';
import NoteAnnotationPopover from './NoteAnnotationPopover';
import NoteAnnotationsList from './NoteAnnotationsList';
import { cn } from '@/lib/ui-styles';

export interface NoteDetailBodyProps {
  note: Note;
  loading: boolean;
  hasDoc: boolean;
  hasImage?: boolean;
}

interface PopoverState {
  isOpen: boolean;
  position: { top: number; left: number; bottom?: number };
  selectedText: string;
  existingAnnotation: NoteAnnotation | null;
  comment?: string;
}

const highlightColorOptions: { key: AnnotationColor; label: string; bg: string }[] = [
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-400' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-400' },
  { key: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-400' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-400' },
  { key: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-400' },
];

export function NoteDetailBody({ note, loading, hasDoc, hasImage }: NoteDetailBodyProps) {
  const { t } = useI18n();
  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useNoteAnnotations(note.id);

  const [activeColor, setActiveColor] = useState<AnnotationColor>('amber');
  const [popoverState, setPopoverState] = useState<PopoverState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    selectedText: '',
    existingAnnotation: null,
  });

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Instant auto-highlight on selection without intrusive popover
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Check if selection is inside content container
    if (
      contentContainerRef.current &&
      contentContainerRef.current.contains(selection.anchorNode)
    ) {
      let lineIndex: number | undefined;
      let prefix: string | undefined;
      let suffix: string | undefined;

      // Find enclosing element with data-line-index
      let element: HTMLElement | null =
        selection.anchorNode instanceof HTMLElement
          ? selection.anchorNode
          : selection.anchorNode?.parentElement ?? null;

      while (element && element !== contentContainerRef.current) {
        const attr = element.getAttribute('data-line-index');
        if (attr !== null) {
          lineIndex = parseInt(attr, 10);
          break;
        }
        element = element.parentElement;
      }

      if (element && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0);
          const preRange = document.createRange();
          preRange.selectNodeContents(element);
          preRange.setEnd(range.startContainer, range.startOffset);
          const preText = preRange.toString();
          prefix = preText.slice(-30);

          const postRange = document.createRange();
          postRange.selectNodeContents(element);
          postRange.setStart(range.endContainer, range.endOffset);
          const postText = postRange.toString();
          suffix = postText.slice(0, 30);
        } catch {
          // fallback if range extraction fails
        }
      }

      // Check if this exact annotation already exists at the same line/position
      const exists = annotations.some(
        (ann) =>
          ann.text === text &&
          (lineIndex === undefined || ann.lineIndex === lineIndex) &&
          (!prefix || ann.prefix === prefix),
      );

      if (!exists) {
        addAnnotation({
          text,
          comment: '',
          color: activeColor,
          lineIndex,
          prefix,
          suffix,
        });
      }
      // Clear native selection so custom border highlight shines through
      selection.removeAllRanges();
    }
  }, [activeColor, addAnnotation, annotations]);

  // Open detail editor ONLY when user clicks on an already highlighted text
  const handleAnnotationClick = useCallback((annotation: NoteAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      position: {
        top: rect.top,
        left: rect.left + rect.width / 2,
        bottom: rect.bottom,
      },
      selectedText: annotation.text,
      existingAnnotation: annotation,
      comment: annotation.comment || '',
    });
  }, []);

  const handleSelectFromList = useCallback((annotation: NoteAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      position: {
        top: rect.top,
        left: rect.left + rect.width / 2,
        bottom: rect.bottom,
      },
      selectedText: annotation.text,
      existingAnnotation: annotation,
      comment: annotation.comment || '',
    });
  }, []);

  const handleSaveFromDock = useCallback(() => {
    const commentText = popoverState.comment || '';
    if (popoverState.existingAnnotation) {
      updateAnnotation(popoverState.existingAnnotation.id, {
        comment: commentText,
        color: popoverState.existingAnnotation.color,
      });
    } else if (popoverState.selectedText.trim()) {
      addAnnotation({
        text: popoverState.selectedText,
        comment: commentText,
        color: activeColor,
      });
    }
    setPopoverState((prev) => ({ ...prev, isOpen: false }));
  }, [activeColor, addAnnotation, popoverState, updateAnnotation]);

  if (loading) {
    return <NoteDetailSkeleton />;
  }

  const hasSidebar =
    !hasImage &&
    (hasDoc ||
      !!note.summary ||
      (!!note.bullets && note.bullets.length > 0));

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {hasSidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-start lg:items-stretch h-full overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Note Content */}
          <div
            ref={contentContainerRef}
            onMouseUp={handleMouseUp}
            className="lg:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pr-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 select-none mb-2">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                {t('notes.fullContentAnalysis') || 'Nội dung ghi chú'}
              </p>
              
              {/* Highlight Pen Color Selector */}
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/70 px-2 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-700/50">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Bút highlight:
                </span>
                <div className="flex items-center gap-1">
                  {highlightColorOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setActiveColor(opt.key)}
                      className={cn(
                        'w-3.5 h-3.5 rounded-full transition-transform',
                        opt.bg,
                        activeColor === opt.key
                          ? 'ring-2 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-800 scale-110'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      )}
                      title={`Đổi màu bút: ${opt.label}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-2">
              <NoteMarkdownRenderer
                content={note.content || ''}
                annotations={annotations}
                onAnnotationClick={handleAnnotationClick}
              />
            </div>
          </div>

          {/* Right Column: Attachment, Summary, Bullets & Annotations */}
          <div className="lg:col-span-5 space-y-6 lg:h-full lg:overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pl-6 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-zinc-800/40">
            {hasDoc && <NoteAttachmentCard url={note.url!} />}

            {note.summary && (
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 select-none">
                  {t('notes.summary') || 'Tóm tắt'}
                </p>
                <p className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                  {note.summary}
                </p>
              </div>
            )}

            {note.bullets && note.bullets.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 select-none">
                  {t('notes.keyTakeaways') || 'Ý chính'}
                </p>
                <ul className="space-y-2.5">
                  {note.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 flex items-start gap-3"
                    >
                      <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      <span className="leading-relaxed font-medium">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sidebar Annotations Section */}
            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/30">
              <NoteAnnotationsList
                annotations={annotations}
                onSelectAnnotation={handleSelectFromList}
                onDeleteAnnotation={deleteAnnotation}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={contentContainerRef}
          onMouseUp={handleMouseUp}
          className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 select-none mb-2">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {t('notes.fullContentAnalysis') || 'Nội dung ghi chú'}
            </p>
            
            {/* Highlight Pen Color Selector */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/70 px-2 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-700/50">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                Bút highlight:
              </span>
              <div className="flex items-center gap-1">
                {highlightColorOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setActiveColor(opt.key)}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full transition-transform',
                      opt.bg,
                      activeColor === opt.key
                        ? 'ring-2 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-800 scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    )}
                    title={`Đổi màu bút: ${opt.label}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-2">
            <NoteMarkdownRenderer
              content={note.content || ''}
              annotations={annotations}
              onAnnotationClick={handleAnnotationClick}
            />
          </div>

          {/* If there are annotations or summary in single-column mode, render them cleanly below without changing column width */}
          {(note.summary || (note.bullets && note.bullets.length > 0) || annotations.length > 0) && (
            <div className="space-y-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/40">
              {note.summary && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 select-none">
                    {t('notes.summary') || 'Tóm tắt'}
                  </p>
                  <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {note.summary}
                  </p>
                </div>
              )}

              {note.bullets && note.bullets.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 select-none">
                    {t('notes.keyTakeaways') || 'Ý chính'}
                  </p>
                  <ul className="space-y-2">
                    {note.bullets.map((bullet, i) => (
                      <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                        <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span className="leading-relaxed font-medium">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {annotations.length > 0 && (
                <div className="pt-2">
                  <NoteAnnotationsList
                    annotations={annotations}
                    onSelectAnnotation={handleSelectFromList}
                    onDeleteAnnotation={deleteAnnotation}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Docked Annotation Drawer - docks cleanly at the bottom of the note container so the user can always read and observe the note above */}
      {popoverState.isOpen && (
        <div
          className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-xl p-3.5 sm:p-4 shrink-0 transition-all animate-in slide-in-from-bottom-2 duration-200 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
                {popoverState.existingAnnotation ? 'Sửa ghi chú' : 'Ghi chú cho đoạn'}:
              </span>
              <span className="text-xs text-zinc-800 dark:text-zinc-200 font-medium italic truncate max-w-[200px] sm:max-w-[320px] bg-zinc-100 dark:bg-zinc-800/70 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">
                &ldquo;{popoverState.selectedText || popoverState.existingAnnotation?.text}&rdquo;
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Color dots */}
              <div className="flex items-center gap-1">
                {highlightColorOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (popoverState.existingAnnotation) {
                        updateAnnotation(popoverState.existingAnnotation.id, { color: opt.key });
                        setPopoverState((prev) => ({
                          ...prev,
                          existingAnnotation: prev.existingAnnotation
                            ? { ...prev.existingAnnotation, color: opt.key }
                            : null,
                        }));
                      } else {
                        setActiveColor(opt.key);
                      }
                    }}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full transition-transform',
                      opt.bg,
                      (popoverState.existingAnnotation?.color ?? activeColor) === opt.key
                        ? 'ring-2 ring-offset-1 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900 scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    )}
                    title={opt.label}
                  />
                ))}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setPopoverState((prev) => ({ ...prev, isOpen: false }))}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <textarea
              autoFocus
              value={popoverState.comment ?? (popoverState.existingAnnotation?.comment || '')}
              onChange={(e) => {
                const val = e.target.value;
                setPopoverState((prev) => ({ ...prev, comment: val }));
              }}
              placeholder="Viết suy nghĩ, ghi chú hoặc phân tích của bạn..."
              rows={2}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSaveFromDock();
                }
              }}
              className="w-full text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
                Nhấn Ctrl+Enter để lưu nhanh
              </span>

              <div className="flex items-center gap-2">
                {popoverState.existingAnnotation && (
                  <button
                    type="button"
                    onClick={() => {
                      if (popoverState.existingAnnotation) {
                        deleteAnnotation(popoverState.existingAnnotation.id);
                        setPopoverState((prev) => ({ ...prev, isOpen: false }));
                      }
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Xóa
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPopoverState((prev) => ({ ...prev, isOpen: false }))}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 font-medium px-2.5 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSaveFromDock}
                  className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-3 py-1 rounded-lg hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
                >
                  {popoverState.existingAnnotation ? 'Cập nhật' : 'Lưu ghi chú'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteDetailBody;
