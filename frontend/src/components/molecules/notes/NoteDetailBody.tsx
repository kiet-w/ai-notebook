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
}

interface PopoverState {
  isOpen: boolean;
  position: { top: number; left: number };
  selectedText: string;
  existingAnnotation: NoteAnnotation | null;
}

const highlightColorOptions: { key: AnnotationColor; label: string; bg: string }[] = [
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-400' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-400' },
  { key: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-400' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-400' },
  { key: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-400' },
];

export function NoteDetailBody({ note, loading, hasDoc }: NoteDetailBodyProps) {
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
    if (contentContainerRef.current && contentContainerRef.current.contains(selection.anchorNode)) {
      // Check if this exact text is already highlighted
      const exists = annotations.some((ann) => ann.text === text);
      if (!exists) {
        addAnnotation({
          text,
          comment: '',
          color: activeColor,
        });
      }
      // Clear native selection so custom border highlight shines through
      selection.removeAllRanges();
    }
  }, [activeColor, addAnnotation, annotations]);

  // Open detail popover ONLY when user clicks on an already highlighted text
  const handleAnnotationClick = useCallback((annotation: NoteAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      position: {
        top: Math.max(80, rect.top - 10),
        left: Math.min(window.innerWidth - 180, Math.max(180, rect.left + rect.width / 2)),
      },
      selectedText: annotation.text,
      existingAnnotation: annotation,
    });
  }, []);

  const handleSelectFromList = useCallback((annotation: NoteAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverState({
      isOpen: true,
      position: {
        top: Math.max(80, e.clientY - 10),
        left: Math.min(window.innerWidth - 180, Math.max(180, e.clientX)),
      },
      selectedText: annotation.text,
      existingAnnotation: annotation,
    });
  }, []);

  const handleSaveAnnotation = useCallback((data: { text: string; comment: string; color: AnnotationColor }) => {
    addAnnotation(data);
    window.getSelection()?.removeAllRanges();
  }, [addAnnotation]);

  if (loading) {
    return <NoteDetailSkeleton />;
  }

  const hasSidebar =
    hasDoc ||
    !!note.summary ||
    (!!note.bullets && note.bullets.length > 0) ||
    annotations.length > 0;

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
        </div>
      )}

      {/* Floating Annotation Popover - only displayed when clicked on a highlight to view/edit/delete */}
      {popoverState.isOpen && (
        <NoteAnnotationPopover
          position={popoverState.position}
          selectedText={popoverState.selectedText}
          existingAnnotation={popoverState.existingAnnotation}
          onSave={handleSaveAnnotation}
          onUpdate={updateAnnotation}
          onDelete={deleteAnnotation}
          onClose={() =>
            setPopoverState((prev) => ({ ...prev, isOpen: false }))
          }
        />
      )}
    </div>
  );
}

export default NoteDetailBody;
