import {
  Soup,
  Terminal,
  BookOpen,
  Briefcase,
  Coins,
  Folder,
  Palette,
  Megaphone,
  Plane,
  Dumbbell,
  Music,
  ShoppingBag,
  User,
  Code,
  Newspaper,
  Sparkles,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { CategoryItem } from '@/types/note';
import { TranslateFunction } from '@/i18n/types';

export const DEFAULT_CATEGORY_METAS: Record<
  string,
  { emoji: string; icon: LucideIcon; key: string; fallback: string }
> = {
  Cooking: { emoji: '🍳', icon: Soup, key: 'cooking', fallback: 'Cooking' },
  Tech: { emoji: '💻', icon: Terminal, key: 'tech', fallback: 'Tech' },
  Learning: { emoji: '📚', icon: BookOpen, key: 'learning', fallback: 'Learning' },
  Work: { emoji: '💼', icon: Briefcase, key: 'work', fallback: 'Work' },
  Finance: { emoji: '💰', icon: Coins, key: 'finance', fallback: 'Finance' },
  Other: { emoji: '📝', icon: Folder, key: 'other', fallback: 'Other' },
};

// Smart matching for popular custom categories
export const CUSTOM_CATEGORY_PRESETS: Record<string, { emoji: string; icon: LucideIcon }> = {
  design: { emoji: '🎨', icon: Palette },
  marketing: { emoji: '📢', icon: Megaphone },
  travel: { emoji: '✈️', icon: Plane },
  fitness: { emoji: '🏋️', icon: Dumbbell },
  gym: { emoji: '🏋️', icon: Dumbbell },
  health: { emoji: '💊', icon: Sparkles },
  music: { emoji: '🎵', icon: Music },
  shopping: { emoji: '🛍️', icon: ShoppingBag },
  personal: { emoji: '👤', icon: User },
  code: { emoji: '💻', icon: Code },
  development: { emoji: '💻', icon: Code },
  news: { emoji: '📰', icon: Newspaper },
  research: { emoji: '🔬', icon: Layers },
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'Cooking', key: 'cooking', emoji: '🍳', fallback: 'Cooking' },
  { id: 'Tech', key: 'tech', emoji: '💻', fallback: 'Tech' },
  { id: 'Learning', key: 'learning', emoji: '📚', fallback: 'Learning' },
  { id: 'Work', key: 'work', emoji: '💼', fallback: 'Work' },
  { id: 'Finance', key: 'finance', emoji: '💰', fallback: 'Finance' },
  { id: 'Other', key: 'other', emoji: '📝', fallback: 'Other' },
];

/**
 * Normalizes category key for safe matching (case-insensitive)
 */
export function normalizeCategoryName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  for (const defaultName of Object.keys(DEFAULT_CATEGORY_METAS)) {
    if (defaultName.toLowerCase() === lower) {
      return defaultName;
    }
  }
  // Capitalize first letter and lowercase rest if custom
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Checks if a category name belongs to default categories
 */
export function isDefaultCategory(name?: string | null): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();
  return Object.keys(DEFAULT_CATEGORY_METAS).some((k) => k.toLowerCase() === lower);
}

/**
 * Validates a category name
 */
export function isValidCategoryName(name?: string | null): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Category name cannot be empty' };
  }
  const trimmed = name.trim();
  if (trimmed.length > 30) {
    return { valid: false, error: 'Category name cannot exceed 30 characters' };
  }
  return { valid: true };
}

/**
 * Returns LucideIcon component for a given category name with smart preset & fallback
 */
export function getCategoryLucideIcon(category?: string | null): LucideIcon {
  if (!category) return Folder;
  const normalized = normalizeCategoryName(category);
  if (DEFAULT_CATEGORY_METAS[normalized]) {
    return DEFAULT_CATEGORY_METAS[normalized].icon;
  }
  const lower = normalized.toLowerCase();
  if (CUSTOM_CATEGORY_PRESETS[lower]) {
    return CUSTOM_CATEGORY_PRESETS[lower].icon;
  }
  return Folder;
}

/**
 * Returns emoji string for a given category name with smart preset & fallback
 */
export function getCategoryEmoji(category?: string | null): string {
  if (!category) return '📝';
  const normalized = normalizeCategoryName(category);
  if (DEFAULT_CATEGORY_METAS[normalized]) {
    return DEFAULT_CATEGORY_METAS[normalized].emoji;
  }
  const lower = normalized.toLowerCase();
  if (CUSTOM_CATEGORY_PRESETS[lower]) {
    return CUSTOM_CATEGORY_PRESETS[lower].emoji;
  }
  return '📁';
}

/**
 * Resolves localized category name or returns capitalized fallback
 */
export function getCategoryLabel(
  category?: string | null,
  t?: TranslateFunction | ((key: string, options?: Record<string, string | number>) => string)
): string {
  if (!category) return '';
  const normalized = normalizeCategoryName(category);
  const meta = DEFAULT_CATEGORY_METAS[normalized];

  if (t) {
    if (meta?.key) {
      const translated = t(`categories.${meta.key}`);
      if (translated && !translated.startsWith('categories.')) return translated;
    }
    const directTranslation = t(`categories.${normalized}`);
    if (directTranslation && !directTranslation.startsWith('categories.')) return directTranslation;
    const lowerTranslation = t(`categories.${normalized.toLowerCase()}`);
    if (lowerTranslation && !lowerTranslation.startsWith('categories.')) return lowerTranslation;
  }

  return meta?.fallback || normalized;
}

/**
 * Generates a full CategoryItem object for a given category name
 */
export function getCategoryItem(
  category: string,
  t?: TranslateFunction | ((key: string, options?: Record<string, string | number>) => string)
): CategoryItem {
  const normalized = normalizeCategoryName(category);
  const emoji = getCategoryEmoji(normalized);
  const label = getCategoryLabel(normalized, t);
  const isDef = isDefaultCategory(normalized);

  return {
    id: normalized,
    name: label,
    emoji,
    key: isDef ? DEFAULT_CATEGORY_METAS[normalized]?.key : undefined,
    fallback: normalized,
  };
}

/**
 * Merges default categories with any dynamic categories found in stats, unreadCounts, or custom list
 */
export function getAvailableCategories(
  stats?: Record<string, number>,
  unreadCounts?: Record<string, number>,
  customCategories?: string[]
): string[] {
  const categorySet = new Set<string>();

  // Add default categories
  DEFAULT_CATEGORIES.forEach((c) => categorySet.add(c.id));

  // Add from stats
  if (stats) {
    Object.keys(stats).forEach((cat) => {
      if (cat && cat.trim()) categorySet.add(normalizeCategoryName(cat));
    });
  }

  // Add from unread counts
  if (unreadCounts) {
    Object.keys(unreadCounts).forEach((cat) => {
      if (cat && cat.trim()) categorySet.add(normalizeCategoryName(cat));
    });
  }

  // Add custom
  if (customCategories) {
    customCategories.forEach((cat) => {
      if (cat && cat.trim()) categorySet.add(normalizeCategoryName(cat));
    });
  }

  return Array.from(categorySet);
}
