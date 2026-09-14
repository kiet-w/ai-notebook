import { NoteMapper } from './note.mapper';
import { NoteWithCategory } from '../repository/notes.repository';
import { Status } from '@prisma/client';

describe('NoteMapper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const baseMockNote: NoteWithCategory = {
    id: 'note-1',
    url: 'https://example.com/test',
    userInput: 'Sample input',
    aiTitle: 'Sample Title',
    aiSummary: 'Summary text',
    aiBullets: ['bullet 1', 'bullet 2'],
    content: 'Full content',
    category: {
      id: 'cat-1',
      name: 'Tech',
      key: 'tech',
      emoji: '💻',
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categoryId: 'cat-1',
    status: Status.COMPLETED,
    isRead: false,
    userId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  describe('toResponseDto', () => {
    it('should map note correctly with existing external url', () => {
      const dto = NoteMapper.toResponseDto(baseMockNote);

      expect(dto).toEqual({
        id: 'note-1',
        url: 'https://example.com/test',
        userInput: 'Sample input',
        title: 'Sample Title',
        aiTitle: 'Sample Title',
        aiSummary: 'Summary text',
        aiBullets: ['bullet 1', 'bullet 2'],
        content: 'Full content',
        category: 'Tech',
        categoryId: 'cat-1',
        status: Status.COMPLETED,
        isRead: false,
        createdAt: baseMockNote.createdAt,
      });
    });

    it('should prepend default localhost:3001 to /uploads/ relative url when env is not set', () => {
      delete process.env.BACKEND_URL;
      delete process.env.PORT;

      const uploadNote: NoteWithCategory = {
        ...baseMockNote,
        url: '/uploads/123-file.pdf',
      };

      const dto = NoteMapper.toResponseDto(uploadNote);
      expect(dto.url).toBe('http://localhost:3001/uploads/123-file.pdf');
    });

    it('should prepend custom BACKEND_URL to /uploads/ relative url', () => {
      process.env.BACKEND_URL = 'https://api.example.com';

      const uploadNote: NoteWithCategory = {
        ...baseMockNote,
        url: '/uploads/123-file.pdf',
      };

      const dto = NoteMapper.toResponseDto(uploadNote);
      expect(dto.url).toBe('https://api.example.com/uploads/123-file.pdf');
    });

    it('should fallback category to Other and categoryId to null when missing', () => {
      const noteWithoutCategory: NoteWithCategory = {
        ...baseMockNote,
        category: null,
        categoryId: null,
      };

      const dto = NoteMapper.toResponseDto(noteWithoutCategory);
      expect(dto.category).toBe('Other');
      expect(dto.categoryId).toBeNull();
    });
  });

  describe('toResponseDtoList', () => {
    it('should map an array of notes', () => {
      const list = NoteMapper.toResponseDtoList([baseMockNote]);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('note-1');
    });
  });
});
