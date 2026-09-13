import { Category, Status } from '@prisma/client';

export class NoteResponseDto {
  id!: string;
  url!: string | null;
  userInput!: string | null;
  title!: string | null;
  aiTitle!: string | null;
  aiSummary!: string | null;
  aiBullets!: string[] | null;
  content!: string | null;
  category!: Category;
  status!: Status;
  isRead!: boolean;
  createdAt!: Date;
}
