export type Category = 'Cooking' | 'Tech' | 'Learning' | 'Work' | 'Finance' | 'Other';
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
  createdAt: string;
}
