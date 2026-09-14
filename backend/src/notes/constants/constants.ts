export enum Status {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const DEFAULT_CATEGORY_NAMES = [
  'Cooking',
  'Tech',
  'Learning',
  'Work',
  'Finance',
  'Other',
] as const;

export type DefaultCategoryName = (typeof DEFAULT_CATEGORY_NAMES)[number];
