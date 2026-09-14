export function slugifyCategoryKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function formatCategoryEmoji(emoji?: string, fallback = '📁'): string {
  return emoji?.trim() || fallback;
}
