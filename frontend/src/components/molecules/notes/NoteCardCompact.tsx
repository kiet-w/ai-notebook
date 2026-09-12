'use client';

import React from 'react';
import { Note } from '@/types/note';
import NoteCardLandscape from './NoteCardLandscape';
import NoteCardPortrait from './NoteCardPortrait';
import NoteCardText from './NoteCardText';

export interface NoteCardCompactProps {
  note: Note;
  isUnread: boolean;
  imageAspectRatio: 'portrait' | 'landscape' | null;
  onImageLoadRatio: (ratio: 'portrait' | 'landscape') => void;
  parsedDate: Date | null;
}

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.startsWith('data:image/');
};

export function NoteCardCompact({
  note,
  isUnread,
  imageAspectRatio,
  onImageLoadRatio,
  parsedDate,
}: NoteCardCompactProps) {
  const hasImage = !!(note.url && isImageUrl(note.url));

  if (hasImage && imageAspectRatio === 'landscape') {
    return <NoteCardLandscape note={note} isUnread={isUnread} parsedDate={parsedDate} />;
  }

  if (hasImage && imageAspectRatio === 'portrait') {
    return <NoteCardPortrait note={note} isUnread={isUnread} parsedDate={parsedDate} />;
  }

  return (
    <NoteCardText
      note={note}
      isUnread={isUnread}
      hasImage={hasImage}
      imageAspectRatio={imageAspectRatio}
      onImageLoadRatio={onImageLoadRatio}
      parsedDate={parsedDate}
    />
  );
}

export default NoteCardCompact;
