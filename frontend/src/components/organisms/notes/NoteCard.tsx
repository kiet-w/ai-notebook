'use client';

import { useState, memo, useMemo, useRef } from 'react';
import { Note } from '@/types/note';
import { api } from '@/utils/api';
import NoteCardCompact from '@/components/molecules/notes/NoteCardCompact';
import NoteCardPreview from '@/components/molecules/notes/NoteCardPreview';
import NoteCardFailed from '@/components/molecules/notes/NoteCardFailed';

export interface NoteCardProps {
  note: Note;
  onOpenModal?: (note: Note) => void;
}

function NoteCard({ note, onOpenModal }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<'portrait' | 'landscape' | null>(null);
  const [localIsRead, setLocalIsRead] = useState(note.isRead);
  const [prevIsRead, setPrevIsRead] = useState(note.isRead);
  const cardRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<'left' | 'right'>('left');

  if (note.isRead !== prevIsRead) {
    setPrevIsRead(note.isRead);
    setLocalIsRead(note.isRead);
  }

  const handleMarkAsRead = async () => {
    if (localIsRead || note.status === 'PROCESSING') return;
    try {
      setLocalIsRead(true);
      await api.markAsRead(note.id);
    } catch (err) {
      console.error('Failed to mark note as read:', err);
      setLocalIsRead(false);
    }
  };

  const parsedDate = useMemo(() => {
    if (!note.createdAt) return null;
    const d = new Date(note.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }, [note.createdAt]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!localIsRead && note.status !== 'PROCESSING') {
      handleMarkAsRead();
    }
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      setPopupPos(rect.right + rect.width > screenWidth - 20 ? 'right' : 'left');
    }
  };

  const handleCardClick = () => {
    if (!localIsRead && note.status !== 'PROCESSING') {
      handleMarkAsRead();
    }
    onOpenModal?.(note);
  };

  if (note.status === 'FAILED') {
    return <NoteCardFailed content={note.content} />;
  }

  return (
    <div 
      ref={cardRef}
      className="relative w-full h-[180px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={handleCardClick}
        className="w-full h-full p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/30 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700 overflow-hidden cursor-pointer"
      >
        <NoteCardCompact
          note={note}
          isUnread={!localIsRead && note.status !== 'PROCESSING'}
          imageAspectRatio={imageAspectRatio}
          onImageLoadRatio={setImageAspectRatio}
          parsedDate={parsedDate}
        />
      </div>

      {isHovered && (
        <NoteCardPreview
          note={note}
          popupPos={popupPos}
          parsedDate={parsedDate}
          onClick={handleCardClick}
        />
      )}
    </div>
  );
}

export default memo(NoteCard);
