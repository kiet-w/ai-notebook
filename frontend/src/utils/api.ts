import { Note, Category } from '@/types/note';
import axios from 'axios';

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
});

type ApiCategory = 'COOKING' | 'TECH' | 'LEARNING' | 'WORK' | 'FINANCE' | 'OTHER';

interface ApiNote {
  id: string;
  url: string | null;
  userInput: string | null;
  content: string | null;
  aiTitle: string | null;
  aiSummary: string | null;
  aiBullets: string[] | null;
  category: ApiCategory;
  status: Note['status'];
  createdAt: string;
}

const CATEGORY_LABELS: Record<ApiCategory, Note['category']> = {
  COOKING: 'Cooking',
  TECH: 'Tech',
  LEARNING: 'Learning',
  WORK: 'Work',
  FINANCE: 'Finance',
  OTHER: 'Other',
};

const REVERSE_CATEGORY_MAP: Record<Category, ApiCategory> = {
  Cooking: 'COOKING',
  Tech: 'TECH',
  Learning: 'LEARNING',
  Work: 'WORK',
  Finance: 'FINANCE',
  Other: 'OTHER',
};

export function normalizeNote(note: ApiNote): Note {
  return {
    id: note.id,
    content: note.content ?? note.userInput ?? note.url ?? '',
    url: note.url ?? undefined,
    title: note.aiTitle ?? undefined,
    category: CATEGORY_LABELS[note.category],
    summary: note.aiSummary ?? undefined,
    bullets: note.aiBullets ?? undefined,
    status: note.status,
    createdAt: note.createdAt,
  };
}

export const api = {
  async fetchNotes(): Promise<Note[]> {
    const res = await apiInstance.get(`/notes?t=${Date.now()}`);
    const notes = res.data as ApiNote[];
    return notes.map(normalizeNote);
  },

  async createNote(content: string, category?: Category): Promise<Note> {
    const apiCategory = category ? REVERSE_CATEGORY_MAP[category] : undefined;
    const res = await apiInstance.post('/notes', { 
      userInput: content, 
      category: apiCategory 
    });
    return normalizeNote(res.data as ApiNote);
  },

  async uploadFile(file: File, category?: Category): Promise<Note> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', REVERSE_CATEGORY_MAP[category]);
    }
    const res = await apiInstance.post('/notes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeNote(res.data as ApiNote);
  },

  async fetchNoteById(id: string): Promise<Note> {
    const res = await apiInstance.get(`/notes/${id}?t=${Date.now()}`);
    return normalizeNote(res.data as ApiNote);
  },

  async searchNotes(query: string): Promise<{ answer: string; relatedNotes?: Note[] }> {
    const res = await apiInstance.post('/notes/search', { query });
    const data = res.data;
    return {
      answer: data.answer,
      relatedNotes: data.relatedNotes ? data.relatedNotes.map(normalizeNote) : undefined,
    };
  },
};

export type { Note };
