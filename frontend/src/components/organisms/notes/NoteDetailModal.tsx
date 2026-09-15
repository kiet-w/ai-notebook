'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { api } from '@/utils/api';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';
import { useNoteAnnotations } from '@/hooks/useNoteAnnotations';
import NoteDetailHeader from '@/components/molecules/notes/NoteDetailHeader';
import NoteDetailBody from '@/components/molecules/notes/NoteDetailBody';
import NoteDetailFooter from '@/components/molecules/notes/NoteDetailFooter';
import NoteDetailImageViewer from '@/components/molecules/notes/NoteDetailImageViewer';
import NoteDetailAnnotationCard from '@/components/molecules/notes/NoteDetailAnnotationCard';
import { cn } from '@/lib/ui-styles';
import { getRelativeImageUrl } from '@/utils/image';

export interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.startsWith('data:image/');
};

const isPlaceholderContent = (content: string | null | undefined) => {
  if (!content) return true;
  return (
    content.startsWith('http://') ||
    content.startsWith('https://') ||
    content.startsWith('/uploads/') ||
    content.startsWith('Processing file: ')
  );
};

export default function NoteDetailModal({ note, isOpen, onClose }: NoteDetailModalProps) {
  const [fetchedNote, setFetchedNote] = useState<Note | null>(null);
  const { id: noteId, content: noteContent } = note;
  
  const isPlaceholder = isPlaceholderContent(noteContent);
  const [loading, setLoading] = useState(isOpen && isPlaceholder);
  const [imageAspectRatio, setImageAspectRatio] = useState<'portrait' | 'landscape' | null>(null);
  const [prevNoteId, setPrevNoteId] = useState<string | null>(null);

  const displayNote = fetchedNote || note;
  const hasImage = !!(displayNote.url && isImageUrl(displayNote.url));
  const hasDoc = !!(displayNote.url && !isImageUrl(displayNote.url));

  // Annotations management
  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useNoteAnnotations(displayNote.id);

  const [activeColor, setActiveColor] = useState<AnnotationColor>('amber');
  const [activeAnnotation, setActiveAnnotation] = useState<NoteAnnotation | null>(null);
  const [activeSelectedText, setActiveSelectedText] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isAnnotationPanelOpen, setIsAnnotationPanelOpen] = useState<boolean>(true);

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setImageAspectRatio(null);
    setLoading(isOpen && isPlaceholder);
    setFetchedNote(null);
    setActiveAnnotation(null);
    setActiveSelectedText('');
    setIsCreating(false);
  }

  useEffect(() => {
    if (!isOpen || !noteId || !isPlaceholder) return;

    api.fetchNoteById(noteId)
      .then((fullNote) => {
        setFetchedNote(fullNote);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch note details:', err);
        setLoading(false);
      });
  }, [noteId, isPlaceholder, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && displayNote.url && isImageUrl(displayNote.url)) {
      const img = new Image();
      img.onload = () => {
        setImageAspectRatio(img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape');
      };
      img.onerror = () => setImageAspectRatio('portrait');
      img.src = getRelativeImageUrl(displayNote.url);
    }
  }, [displayNote.url, isOpen]);

  const handleTextSelect = useCallback((data: {
    text: string;
    lineIndex?: number;
    prefix?: string;
    suffix?: string;
  }) => {
    const exists = annotations.find(
      (ann) =>
        ann.text === data.text &&
        (data.lineIndex === undefined || ann.lineIndex === data.lineIndex)
    );

    if (!exists) {
      addAnnotation({
        text: data.text,
        comment: '',
        color: activeColor,
        lineIndex: data.lineIndex,
        prefix: data.prefix,
        suffix: data.suffix,
      });
    }
  }, [activeColor, addAnnotation, annotations]);

  const handleAnnotationClick = useCallback((annotation: NoteAnnotation) => {
    setActiveAnnotation(annotation);
    setIsCreating(false);
    setActiveSelectedText(annotation.text);
    setIsAnnotationPanelOpen(true);
  }, []);

  const handleSaveNewAnnotation = useCallback((data: {
    text: string;
    comment: string;
    color: AnnotationColor;
  }) => {
    addAnnotation(data);
    setActiveAnnotation(null);
    setIsCreating(false);
    setActiveSelectedText('');
  }, [addAnnotation]);

  const handleUpdateAnnotation = useCallback((id: string, data: { comment?: string; color?: AnnotationColor }) => {
    updateAnnotation(id, data);
    setActiveAnnotation(null);
    setIsCreating(false);
    setActiveSelectedText('');
  }, [updateAnnotation]);

  const handleDeleteAnnotation = useCallback((id: string) => {
    deleteAnnotation(id);
    setActiveAnnotation(null);
    setIsCreating(false);
    setActiveSelectedText('');
  }, [deleteAnnotation]);

  const handleCloseEditor = useCallback(() => {
    setActiveAnnotation(null);
    setIsCreating(false);
    setActiveSelectedText('');
  }, []);

  const handleSelectAnnotationFromList = useCallback((annotation: NoteAnnotation) => {
    setActiveAnnotation(annotation);
    setIsCreating(false);
    setActiveSelectedText(annotation.text);
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[100] flex bg-black/40 dark:bg-black/60 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto',
        hasImage 
          ? 'flex-col lg:flex-row items-center justify-start lg:justify-center gap-4 xl:gap-6 py-6 lg:py-0 max-w-[1700px] mx-auto w-full' 
          : 'items-center justify-center'
      )}
      onClick={onClose}
    >
      {/* 1. Main Note Card */}
      <div 
        className={cn(
          'bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-all',
          hasImage 
            ? isAnnotationPanelOpen
              ? 'w-full lg:flex-1 lg:max-w-2xl h-[85vh] lg:h-[88vh] lg:max-h-[850px]'
              : 'w-full lg:w-[48%] max-w-3xl h-[85vh] lg:h-[88vh] lg:max-h-[850px]'
            : 'w-full max-w-3xl h-[85vh] lg:h-[88vh] lg:max-h-[850px]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <NoteDetailHeader note={displayNote} onClose={onClose} />
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col p-0">
          <NoteDetailBody
            note={displayNote}
            loading={loading}
            hasDoc={hasDoc}
            hasImage={hasImage}
            annotations={annotations}
            onAnnotationClick={handleAnnotationClick}
            onTextSelect={handleTextSelect}
            activeColor={activeColor}
            onChangeActiveColor={setActiveColor}
            isAnnotationPanelOpen={isAnnotationPanelOpen}
            onToggleAnnotationPanel={() => setIsAnnotationPanelOpen((prev) => !prev)}
          />
        </div>
        <NoteDetailFooter createdAt={displayNote.createdAt} />
      </div>

      {/* 2. Middle Annotation Card (Hiện ở giữa Note và Ảnh) */}
      {hasImage && isAnnotationPanelOpen && (
        <NoteDetailAnnotationCard
          annotations={annotations}
          activeAnnotation={activeAnnotation}
          selectedText={activeSelectedText}
          isCreating={isCreating}
          activeColor={activeColor}
          onChangeActiveColor={setActiveColor}
          onSaveNew={handleSaveNewAnnotation}
          onUpdate={handleUpdateAnnotation}
          onDelete={handleDeleteAnnotation}
          onSelectAnnotation={handleSelectAnnotationFromList}
          onCloseEditor={handleCloseEditor}
          onClosePanel={() => setIsAnnotationPanelOpen(false)}
        />
      )}

      {/* 3. Sibling Image Card */}
      {hasImage && (
        <NoteDetailImageViewer
          url={displayNote.url!}
          title={displayNote.title}
          isProcessing={displayNote.status === 'PROCESSING'}
          hasPortraitImage={imageAspectRatio === 'portrait'}
          className={cn(
            isAnnotationPanelOpen
              ? 'w-full lg:flex-1 lg:max-w-2xl h-[60vh] lg:h-[88vh] lg:max-h-[850px]'
              : (imageAspectRatio === 'portrait'
                  ? 'w-full lg:w-[40%] max-w-xl lg:max-w-2xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]'
                  : 'w-full lg:w-[50%] max-w-2xl lg:max-w-3xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]')
          )}
        />
      )}
    </div>
  );
}
