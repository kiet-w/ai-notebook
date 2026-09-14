import { randomUUID } from 'crypto';
import { NoteWithCategory } from '../repository/notes.repository';
import { NoteUpdatedEvent as NoteUpdatedDomainEvent } from '../../events/types/domain-event.type';
import { NoteUpdatedEvent as NoteUpdatedSseEvent } from '../types/sse-event.type';
import { extractBullets } from './note.utils';

export function createNoteUpdatedDomainEvent(
  note: NoteWithCategory,
): NoteUpdatedDomainEvent {
  const aiBullets = extractBullets(note.aiBullets);

  return {
    id: randomUUID(),
    type: 'note.updated',
    aggregateId: note.id,
    userId: note.userId || undefined,
    timestamp: note.createdAt || new Date(),
    payload: {
      id: note.id,
      status: note.status as 'COMPLETED' | 'FAILED',
      aiTitle: note.aiTitle,
      category: note.category?.name || 'Other',
      categoryId: note.categoryId,
      aiSummary: note.aiSummary,
      aiBullets,
      content: note.content,
      isRead: note.isRead,
    },
  };
}

export function mapDomainEventToSseEvent(
  event: NoteUpdatedDomainEvent,
): NoteUpdatedSseEvent {
  const p = event.payload;
  return {
    id: p.id,
    userId: event.userId ?? null,
    status: p.status,
    aiTitle: p.aiTitle ?? null,
    category: p.category ?? 'Other',
    categoryId: p.categoryId ?? null,
    aiSummary: p.aiSummary ?? null,
    aiBullets: p.aiBullets ?? null,
    content: p.content ?? null,
    isRead: p.isRead ?? false,
    createdAt: event.timestamp,
  };
}
