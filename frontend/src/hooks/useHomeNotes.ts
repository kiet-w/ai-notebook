'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Note } from '@/utils/api';
import { Category } from '@/types/note';
import { compressAndResizeImage } from '@/utils/image';

export interface RecentImport {
  id: string;
  title: string;
  category?: Category;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export function useHomeNotes() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', 'recent'],
    queryFn: () => api.fetchNotes(undefined, 25),
  });

  const { data: unreadCounts = {} as Record<Category, number> } = useQuery<Record<Category, number>>({
    queryKey: ['unreadCounts'],
    queryFn: () => api.fetchUnreadCounts(),
  });

  const recentImports = useMemo<RecentImport[]>(() => {
    return notes.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title || n.content?.slice(0, 60) || 'Untitled',
      category: n.category,
      status: n.status,
      createdAt: n.createdAt,
    }));
  }, [notes]);

  const pendingNote = pendingNoteId ? notes.find((n) => n.id === pendingNoteId) : null;
  const isAnalyzing = pendingNoteId !== null && (!pendingNote || pendingNote.status === 'PROCESSING');

  useEffect(() => {
    if (pendingNote) {
      if (pendingNote.status === 'COMPLETED') {
        const cat = pendingNote.category;
        setTimeout(() => setPendingNoteId(null), 0);
        if (cat) {
          router.push('/' + cat);
        }
      } else if (pendingNote.status === 'FAILED') {
        setTimeout(() => setPendingNoteId(null), 0);
      }
    }
  }, [pendingNote, router]);

  const handleCapture = useCallback(
    async (content: string, category?: Category) => {
      try {
        const realNote = await api.createNote(content, category);
        setPendingNoteId(realNote.id);

        queryClient.setQueryData<Note[]>(['notes', 'recent'], (old = []) => {
          return [realNote, ...old].slice(0, 25);
        });
      } catch (error) {
        console.error('Failed to capture note:', error);
      }
    },
    [queryClient]
  );

  const handleUpload = useCallback(
    async (file: File, category?: Category) => {
      let uploadFile = file;

      if (file.type.startsWith('image/')) {
        try {
          uploadFile = await compressAndResizeImage(file);
        } catch (err) {
          console.error('Failed to compress image:', err);
        }
      }

      try {
        const realNote = await api.uploadFile(uploadFile, category);
        setPendingNoteId(realNote.id);

        queryClient.setQueryData<Note[]>(['notes', 'recent'], (old = []) => {
          return [realNote, ...old].slice(0, 25);
        });
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    },
    [queryClient]
  );

  const handleSelectCategory = useCallback(
    (cat: string | null) => {
      if (cat) {
        router.push(`/${cat}`);
      } else {
        router.push('/');
      }
    },
    [router]
  );

  const navigateToCategory = useCallback(
    (cat: string) => {
      router.push(`/${cat}`);
    },
    [router]
  );

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((n) => {
      if (n.category) {
        counts[n.category] = (counts[n.category] || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  const totalNotesCount = notes.length;

  return {
    notes,
    unreadCounts,
    recentImports,
    categoryStats,
    isAnalyzing,
    totalNotesCount,
    pendingNoteId,
    handleCapture,
    handleUpload,
    handleSelectCategory,
    navigateToCategory,
  };
}
