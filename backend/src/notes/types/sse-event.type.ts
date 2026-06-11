import { Category, Status } from '@prisma/client';

export interface NoteUpdatedEvent {
  id: string;
  status: Extract<Status, 'COMPLETED' | 'FAILED'>;
  aiTitle: string | null;
  category: Category;
  aiSummary: string | null;
  aiBullets: string[] | null;
  content: string | null;
  createdAt: Date;
}
