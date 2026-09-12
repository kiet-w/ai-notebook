import {
  normalizeCategoryName,
  getCategoryLucideIcon,
  getCategoryEmoji,
  getCategoryLabel,
  getAvailableCategories,
  DEFAULT_CATEGORIES,
} from '../category';
import { Folder, Soup, Terminal } from 'lucide-react';

describe('category utils', () => {
  describe('normalizeCategoryName', () => {
    it('normalizes known categories regardless of case', () => {
      expect(normalizeCategoryName('cooking')).toBe('Cooking');
      expect(normalizeCategoryName('TECH')).toBe('Tech');
      expect(normalizeCategoryName('  learning ')).toBe('Learning');
    });

    it('capitalizes custom categories', () => {
      expect(normalizeCategoryName('design')).toBe('Design');
      expect(normalizeCategoryName('marketing')).toBe('Marketing');
    });

    it('handles empty input gracefully', () => {
      expect(normalizeCategoryName('')).toBe('');
    });
  });

  describe('getCategoryLucideIcon', () => {
    it('returns specific icon for default categories', () => {
      expect(getCategoryLucideIcon('Cooking')).toBe(Soup);
      expect(getCategoryLucideIcon('Tech')).toBe(Terminal);
    });

    it('falls back to Folder for unknown or null category', () => {
      expect(getCategoryLucideIcon('Unknown')).toBe(Folder);
      expect(getCategoryLucideIcon(null)).toBe(Folder);
      expect(getCategoryLucideIcon(undefined)).toBe(Folder);
    });
  });

  describe('getCategoryEmoji', () => {
    it('returns specific emoji for default categories', () => {
      expect(getCategoryEmoji('Cooking')).toBe('🍳');
      expect(getCategoryEmoji('Tech')).toBe('💻');
      expect(getCategoryEmoji('Learning')).toBe('📚');
    });

    it('returns fallback emoji for custom categories', () => {
      expect(getCategoryEmoji('Design')).toBe('📁');
      expect(getCategoryEmoji(null)).toBe('📝');
    });
  });

  describe('getCategoryLabel', () => {
    it('returns translation if translate function is provided', () => {
      const mockT = (key: string) => {
        if (key === 'categories.cooking') return 'Nấu ăn';
        return key;
      };
      expect(getCategoryLabel('Cooking', mockT)).toBe('Nấu ăn');
    });

    it('returns formatted category name without translate function', () => {
      expect(getCategoryLabel('cooking')).toBe('Cooking');
      expect(getCategoryLabel('custom-tag')).toBe('Custom-tag');
    });
  });

  describe('getAvailableCategories', () => {
    it('includes all default categories', () => {
      const result = getAvailableCategories();
      DEFAULT_CATEGORIES.forEach((c) => {
        expect(result).toContain(c.id);
      });
    });

    it('merges dynamic categories from stats and unread counts', () => {
      const stats = { Design: 5, Marketing: 2 };
      const unread = { Fitness: 1 };
      const custom = ['Travel'];
      const result = getAvailableCategories(stats, unread, custom);

      expect(result).toContain('Design');
      expect(result).toContain('Marketing');
      expect(result).toContain('Fitness');
      expect(result).toContain('Travel');
      expect(result).toContain('Cooking');
    });
  });
});
