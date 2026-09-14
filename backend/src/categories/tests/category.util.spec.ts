import {
  formatCategoryEmoji,
  slugifyCategoryKey,
} from '../utils/category.util';

describe('Category Utils', () => {
  describe('slugifyCategoryKey', () => {
    it('should lowercase and replace spaces with hyphens', () => {
      expect(slugifyCategoryKey('Work & Projects')).toBe('work-&-projects');
      expect(slugifyCategoryKey('My Category Name')).toBe('my-category-name');
      expect(slugifyCategoryKey('   Trim  Spaces   ')).toBe('trim-spaces');
    });

    it('should handle single words', () => {
      expect(slugifyCategoryKey('Tech')).toBe('tech');
    });
  });

  describe('formatCategoryEmoji', () => {
    it('should trim and return valid emoji', () => {
      expect(formatCategoryEmoji('  🚀  ')).toBe('🚀');
    });

    it('should fallback to default emoji when empty or undefined', () => {
      expect(formatCategoryEmoji(undefined)).toBe('📁');
      expect(formatCategoryEmoji('')).toBe('📁');
      expect(formatCategoryEmoji('   ')).toBe('📁');
      expect(formatCategoryEmoji(undefined, '📝')).toBe('📝');
    });
  });
});
