import { Status } from '@prisma/client';

export class NoteResponseDto {
  id!: string;
  url!: string | null;
  userInput!: string | null;
  title!: string | null;
  aiTitle!: string | null;
  aiSummary!: string | null;
  aiBullets!: string[] | null;
  content!: string | null;
  category!: string | null;
  categoryId!: string | null;
  status!: Status;
  isRead!: boolean;
  createdAt!: Date;
}
