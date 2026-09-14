export interface BaseDomainEvent<T = unknown> {
  id: string;
  type: string;
  aggregateId: string;
  userId?: string;
  timestamp: Date;
  payload: T;
}

export interface NoteUpdatedPayload {
  id: string;
  status: 'COMPLETED' | 'FAILED';
  aiTitle?: string | null;
  category?: string;
  categoryId?: string | null;
  aiSummary?: string | null;
  aiBullets?: string[] | null;
  content?: string | null;
  isRead?: boolean;
}

export type NoteUpdatedEvent = BaseDomainEvent<NoteUpdatedPayload>;
export type AppDomainEvent = NoteUpdatedEvent;
