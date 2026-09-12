import { normalizeNote, toApiCategory } from '../api';

describe('API Category normalization', () => {
  describe('toApiCategory', () => {
    it('converts category string to uppercase api format', () => {
      expect(toApiCategory('Cooking')).toBe('COOKING');
      expect(toApiCategory('tech')).toBe('TECH');
      expect(toApiCategory('CUSTOM_CAT')).toBe('CUSTOM_CAT');
    });

    it('returns undefined for empty or null', () => {
      expect(toApiCategory(null)).toBeUndefined();
      expect(toApiCategory(undefined)).toBeUndefined();
      expect(toApiCategory('')).toBeUndefined();
      expect(toApiCategory('   ')).toBeUndefined();
    });
  });

  describe('normalizeNote', () => {
    it('normalizes backend uppercase category to UI title case', () => {
      const apiNote = {
        id: '1',
        url: null,
        userInput: 'Test content',
        content: null,
        aiTitle: 'Test Title',
        aiSummary: 'Test Summary',
        aiBullets: ['Bullet 1'],
        category: 'COOKING',
        status: 'COMPLETED' as const,
        isRead: false,
        createdAt: '2026-09-12T00:00:00.000Z',
      };

      const note = normalizeNote(apiNote);
      expect(note.category).toBe('Cooking');
      expect(note.title).toBe('Test Title');
    });

    it('handles custom dynamic category from backend', () => {
      const apiNote = {
        id: '2',
        url: null,
        userInput: 'Design content',
        content: null,
        aiTitle: 'Design Title',
        aiSummary: null,
        aiBullets: null,
        category: 'DESIGN',
        status: 'COMPLETED' as const,
        isRead: true,
        createdAt: '2026-09-12T00:00:00.000Z',
      };

      const note = normalizeNote(apiNote);
      expect(note.category).toBe('Design');
    });
  });
});
