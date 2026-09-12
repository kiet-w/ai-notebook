export type DefaultCategory = 'Cooking' | 'Tech' | 'Learning' | 'Work' | 'Finance' | 'Other';
export type Category = DefaultCategory | (string & {});

export interface CategoryItem {
  id: string;
  name?: string;
  key?: string;
  emoji?: string;
  fallback?: string;
}

export type Status = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Note {
  id: string;
  content: string;
  url?: string;
  title?: string;
  category?: Category;
  summary?: string;
  bullets?: string[];
  status: Status;
  isRead: boolean;
  createdAt: string;
}

