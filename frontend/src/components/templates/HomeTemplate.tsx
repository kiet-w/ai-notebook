'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import NoteInput from '@/components/molecules/NoteInput';
import { api, Note } from '@/utils/api';
import { Category } from '@/types/note';
import { Download, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { compressAndResizeImage } from '@/utils/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Sidebar = dynamic(() => import('@/components/organisms/Sidebar'), { ssr: false });

interface RecentImport {
  id: string;
  title: string;
  category?: Category;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export default function HomeTemplate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () => api.fetchNotes(undefined, 25),
  });

  const { data: unreadCounts = {} as Record<Category, number> } = useQuery({
    queryKey: ['unreadCounts'],
    queryFn: () => api.fetchUnreadCounts(),
  });

  const recentImports = useMemo<RecentImport[]>(() => {
    return notes.slice(0, 5).map(n => ({
      id: n.id,
      title: n.title || n.content?.slice(0, 60) || 'Untitled',
      category: n.category,
      status: n.status,
      createdAt: n.createdAt,
    }));
  }, [notes]);

  const pendingNote = pendingNoteId ? notes.find(n => n.id === pendingNoteId) : null;
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

  const handleCapture = useCallback(async (content: string, category?: Category) => {
    try {
      const realNote = await api.createNote(content, category);
      setPendingNoteId(realNote.id);
      
      queryClient.setQueryData<Note[]>(['notes', 'recent'], (old = []) => {
        return [realNote, ...old].slice(0, 25);
      });
    } catch (error) {
      console.error('Failed to capture note:', error);
    }
  }, [queryClient]);

  const handleUpload = useCallback(async (file: File, category?: Category) => {
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
  }, [queryClient]);

  const handleSelectCategory = useCallback((cat: string | null) => {
    if (cat) {
      router.push(`/${cat}`);
    } else {
      router.push('/');
    }
  }, [router]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      if (n.category) {
        counts[n.category] = (counts[n.category] || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  const getStatusIcon = (status: RecentImport['status']) => {
    switch (status) {
      case 'PROCESSING':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-background font-sans overflow-hidden">
      <Sidebar
        selectedCategory={null}
        onSelectCategory={handleSelectCategory}
        unreadCounts={unreadCounts}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full max-w-3xl mx-auto px-6 py-16 sm:px-12">
          {/* Hero Header */}
          <header className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 mb-6 text-2xl shadow-sm border border-zinc-200/40 dark:border-zinc-800/30 select-none">
              <Download className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight sm:text-4xl mb-3">
              Import Context
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
              Paste URLs, type notes, or drop images. Choose a category and let AI organize the rest.
            </p>
          </header>

          {/* Import Input with Category Selector */}
          <div className="mb-12">
            <NoteInput
              onSubmit={handleCapture}
              onUpload={handleUpload}
              showCategorySelector
            />
          </div>

          {/* Category Quick Stats */}
          <div className="mb-10">
            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] mb-4 select-none">
              Categories
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['Cooking', 'Tech', 'Learning', 'Work', 'Finance', 'Other'] as Category[]).map((cat) => {
                const unreadCount = unreadCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => router.push(`/${cat}`)}
                    className="relative group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer"
                  >
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums shadow-sm border-2 border-white dark:border-zinc-950 z-10">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-lg select-none">
                      {cat === 'Cooking' ? '🍳' : cat === 'Tech' ? '💻' : cat === 'Learning' ? '📚' : cat === 'Work' ? '💼' : cat === 'Finance' ? '💰' : '📝'}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-foreground transition-colors">{cat}</span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-650 tabular-nums">{categoryStats[cat] || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Imports */}
          {recentImports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] select-none">
                  Recent Imports
                </h2>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums select-none">
                  {notes.length} total
                </span>
              </div>
              <div className="space-y-1.5">
                {recentImports.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.category && item.status === 'COMPLETED') {
                        router.push(`/${item.category}`);
                      }
                    }}
                    disabled={item.status === 'PROCESSING'}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer group text-left disabled:cursor-default disabled:opacity-70"
                  >
                    {getStatusIcon(item.status)}
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {item.title}
                    </span>
                    {item.category && (
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest shrink-0">
                        {item.category}
                      </span>
                    )}
                    {item.status === 'COMPLETED' && item.category && (
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Analyzing Toast */}
      {isAnalyzing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-2xl p-4 max-w-xs">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-primary">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-xs font-bold text-foreground leading-none mb-1 select-none">Analyzing note</h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">Classifying category...</p>
          </div>
        </div>
      )}
    </div>
  );
}
