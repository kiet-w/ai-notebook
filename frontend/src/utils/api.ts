import { Note, Category } from '@/types/note';
import axios from 'axios';

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  withCredentials: true,
});
let accessToken: string | null = null;
export const getAccessToken = () => accessToken;

// ponytail: interceptor tự động gắn Bearer token vào mọi request
apiInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// interceptor tự động refresh token khi gặp lỗi 401
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và chưa thử retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu để tránh loop vô tận
      
      try {
        // Tự động gọi endpoint refresh (mang theo HttpOnly Cookie)
        const res = await axios.post(
          `${apiInstance.defaults.baseURL}/users/refresh`, 
          {}, 
          { withCredentials: true }
        );
        
        accessToken = res.data.accessToken ?? res.data.accesToken;
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('token_refreshed'));
        }
        
        // Gắn token mới vào request cũ và chạy lại
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiInstance(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        if (typeof window !== 'undefined') {
          // Cố gắng gọi api logout để xoá HttpOnly cookie trước khi redirect
          try {
            await axios.post(`${apiInstance.defaults.baseURL}/users/logout`, {}, { withCredentials: true });
          } catch {}
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

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
  isRead: boolean;
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
    isRead: note.isRead ?? false,
    createdAt: note.createdAt,
  };
}

export const api = {
  async fetchNotes(category?: Category, limit?: number, cursor?: string): Promise<Note[]> {
    const apiCategory = category ? REVERSE_CATEGORY_MAP[category] : undefined;
    const params = new URLSearchParams();
    if (apiCategory) params.append('category', apiCategory);
    if (limit !== undefined) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    const res = await apiInstance.get(`/notes?${params.toString()}`);
    return (res.data as ApiNote[]).map(normalizeNote);
  },

  async fetchUnreadCounts(): Promise<Record<Category, number>> {
    const res = await apiInstance.get('/notes/unread-counts');
    return res.data as Record<Category, number>;
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
    const res = await apiInstance.get(`/notes/${id}`);
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

  async markAsRead(id: string): Promise<Note> {
    const res = await apiInstance.patch(`/notes/${id}/read`);
    return normalizeNote(res.data as ApiNote);
  },

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const res = await apiInstance.post('/users/login', { email, password });
    // ponytail: lưu accessToken vào memory để interceptor tự động gắn vào mọi request
    accessToken = res.data.accessToken ?? res.data.accesToken ?? null;
    return res.data;
  },

  async register(email: string, password: string, username: string): Promise<void> {
    const res = await apiInstance.post('/users/register', { email, password, user: username });
    accessToken = res.data.accessToken ?? null;
  },

  async logout(): Promise<void> {
    await apiInstance.post('/users/logout');
    accessToken = null;
  },
};

export type { Note };
