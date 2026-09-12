'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Note } from '@/types/note';
import Badge from '@/components/atoms/common/Badge';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryLabel } from '@/utils/category';

export interface NoteDetailHeaderProps {
  note: Note;
  onClose: () => void;
}

export function NoteDetailHeader({ note, onClose }: NoteDetailHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between p-6 border-b border-zinc-200/30 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4 min-w-0">
        <h3 className="font-semibold text-foreground text-lg md:text-xl truncate tracking-tight">
          {note.title || t('notes.untitledNote')}
        </h3>
        {note.category && (
          <Badge 
            text={getCategoryLabel(note.category, t)} 
          />
        )}
      </div>
      <button 
        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 border border-transparent hover:border-zinc-200/20 dark:hover:border-zinc-800/30 cursor-pointer"
        onClick={onClose}
        aria-label={t('common.close')}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default NoteDetailHeader;
