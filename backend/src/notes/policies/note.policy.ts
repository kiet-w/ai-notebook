import { NotFoundException } from '@nestjs/common';
import { NoteWithCategory } from '../repository/notes.repository';
import { Note } from '@prisma/client';

export function ensureNoteOwnership<T extends NoteWithCategory | Note>(
  note: T | null,
  userId: string,
  noteId: string,
): asserts note is T {
  if (!note || note.userId !== userId) {
    throw new NotFoundException(`Note with ID ${noteId} not found`);
  }
}
