import {
  createNoteUpdatedDomainEvent,
  mapDomainEventToSseEvent,
} from '../utils/note-event.util';
import { NoteWithCategory } from '../repository/notes.repository';
import { Status } from '@prisma/client';

describe('Note Event Utils', () => {
  const mockNote: NoteWithCategory = {
    id: 'note-1',
    content: 'Test content',
    userInput: 'User input',
    url: 'https://example.com',
    status: Status.COMPLETED,
    userId: 'user-123',
    categoryId: 'cat-1',
    aiTitle: 'AI Generated Title',
    aiSummary: 'Summary text',
    aiBullets: ['Point 1', 'Point 2'],
    isRead: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    category: {
      id: 'cat-1',
      name: 'Tech',
      key: 'tech',
      emoji: '💻',
      isDefault: false,
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  describe('createNoteUpdatedDomainEvent', () => {
    it('should create valid DomainEvent object with extracted bullets and payload', () => {
      const event = createNoteUpdatedDomainEvent(mockNote);

      expect(event.id).toBeDefined();
      expect(event.type).toBe('note.updated');
      expect(event.aggregateId).toBe('note-1');
      expect(event.userId).toBe('user-123');
      expect(event.payload.aiBullets).toEqual(['Point 1', 'Point 2']);
      expect(event.payload.category).toBe('Tech');
      expect(event.payload.status).toBe('COMPLETED');
    });
  });

  describe('mapDomainEventToSseEvent', () => {
    it('should map domain event to SSE payload', () => {
      const domainEvent = createNoteUpdatedDomainEvent(mockNote);
      const sseEvent = mapDomainEventToSseEvent(domainEvent);

      expect(sseEvent.id).toBe('note-1');
      expect(sseEvent.userId).toBe('user-123');
      expect(sseEvent.status).toBe('COMPLETED');
      expect(sseEvent.aiTitle).toBe('AI Generated Title');
      expect(sseEvent.category).toBe('Tech');
      expect(sseEvent.aiBullets).toEqual(['Point 1', 'Point 2']);
    });
  });
});
