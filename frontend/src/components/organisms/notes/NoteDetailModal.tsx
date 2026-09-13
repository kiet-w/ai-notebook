'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { api } from '@/utils/api';
import NoteDetailHeader from '@/components/molecules/notes/NoteDetailHeader';
import NoteDetailBody from '@/components/molecules/notes/NoteDetailBody';
import NoteDetailFooter from '@/components/molecules/notes/NoteDetailFooter';
import NoteDetailImageViewer from '@/components/molecules/notes/NoteDetailImageViewer';
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

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setImageAspectRatio(null);
    setLoading(isOpen && isPlaceholder);
    setFetchedNote(null);
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

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[100] flex bg-black/40 dark:bg-black/60 backdrop-blur-md p-4 md:p-6 overflow-y-auto',
        hasImage ? 'flex-col lg:flex-row items-center justify-start lg:justify-center gap-6 py-8 lg:py-0' : 'items-center justify-center'
      )}
      onClick={onClose}
    >
      {/* Main Note Card */}
      <div 
        className={cn(
          'bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden',
          hasImage ? 'w-full lg:w-[45%] max-w-3xl h-[80vh] lg:h-[85vh] lg:max-h-[800px]' : 'w-full max-w-3xl h-[80vh] lg:h-[85vh] lg:max-h-[800px]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <NoteDetailHeader note={displayNote} onClose={onClose} />
        <div className={cn('flex-1 overflow-y-auto p-6 md:p-8', displayNote.content && 'lg:overflow-hidden lg:flex lg:flex-col lg:p-0')}>
          <NoteDetailBody note={displayNote} loading={loading} hasDoc={hasDoc} />
        </div>
        <NoteDetailFooter createdAt={displayNote.createdAt} />
      </div>

      {/* Sibling Image Card */}
      {hasImage && (
        <NoteDetailImageViewer
          url={displayNote.url!}
          title={displayNote.title}
          isProcessing={displayNote.status === 'PROCESSING'}
          hasPortraitImage={imageAspectRatio === 'portrait'}
        />
      )}
    </div>
  );
}
