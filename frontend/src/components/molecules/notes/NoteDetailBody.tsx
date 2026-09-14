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

export function NoteDetailBody({ note, loading, hasDoc }: NoteDetailBodyProps) {
  const { t } = useI18n();
  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useNoteAnnotations(note.id);

  const [popoverState, setPopoverState] = useState<PopoverState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    selectedText: '',
    existingAnnotation: null,
  });

  const contentContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Check if selection is inside content container
    if (contentContainerRef.current && contentContainerRef.current.contains(selection.anchorNode)) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setPopoverState({
            isOpen: true,
            position: {
              top: Math.max(80, rect.top - 10),
              left: Math.min(window.innerWidth - 180, Math.max(180, rect.left + rect.width / 2)),
            },
            selectedText: text,
            existingAnnotation: null,
          });
        }
      } catch (err) {
        console.warn('Failed to calculate selection position:', err);
      }
    }
  }, []);

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
    // Clear selection
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
            <div className="flex items-center justify-between select-none mb-2">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                {t('notes.fullContentAnalysis') || 'Nội dung ghi chú'}
              </p>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                {t('notes.selectTextToAnnotate') || 'Bôi đen văn bản để ghi chú'}
              </span>
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
          <div className="flex items-center justify-between select-none mb-2">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {t('notes.fullContentAnalysis') || 'Nội dung ghi chú'}
            </p>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
              {t('notes.selectTextToAnnotate') || 'Bôi đen văn bản để ghi chú'}
            </span>
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

      {/* Floating Annotation Popover */}
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
