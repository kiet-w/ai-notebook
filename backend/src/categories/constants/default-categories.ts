export interface DefaultCategoryConfig {
  name: string;
  key: string;
  emoji: string;
}

export const DEFAULT_CATEGORIES: DefaultCategoryConfig[] = [
  { name: 'Cooking', key: 'cooking', emoji: '🍳' },
  { name: 'Tech', key: 'tech', emoji: '💻' },
  { name: 'Learning', key: 'learning', emoji: '📚' },
  { name: 'Work', key: 'work', emoji: '💼' },
  { name: 'Finance', key: 'finance', emoji: '💰' },
  { name: 'Other', key: 'other', emoji: '📝' },
];
