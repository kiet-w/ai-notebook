'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import NoteCard from '@/components/organisms/NoteCard';
import Sidebar from '@/components/organisms/Sidebar';
import { api, Note } from '@/utils/api';
import { Category } from '@/types/note';
import { useSSE } from '@/hooks/useSSE';
import { Inbox, AlertCircle } from 'lucide-react';
import { groupNotesByDate } from '@/utils/date';

const NoteDetailModal = dynamic(() => import('@/components/organisms/NoteDetailModal'), { ssr: false });

interface CategoryTemplateProps {
  category: string;
}

export default function CategoryTemplate({ category }: CategoryTemplateProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNoteForModal, setActiveNoteForModal] = useState<Note | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const loadNotes = useCallback((showSkeleton = true) => {
    if (showSkeleton) {
      setLoading(true);
    }
    setError(null);
    setHasMore(true);

    Promise.all([
      api.fetchNotes(category as Category, 25),
      api.fetchUnreadCounts(),
    ])
      .then(([fetchedNotes, counts]) => {
        setNotes(fetchedNotes);
        setUnreadCounts(counts);
        if (fetchedNotes.length < 25) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error(`Failed to load category data:`, err);
        if (showSkeleton) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.');
        }
      })
      .finally(() => {
        if (showSkeleton) {
          setLoading(false);
        }
      });
  }, [category]);

  const loadMoreNotes = useCallback(() => {
    if (loadingMore || !hasMore || loading || notes.length === 0) return;

    setLoadingMore(true);
    const lastNoteId = notes[notes.length - 1]?.id;

    api.fetchNotes(category as Category, 25, lastNoteId)
      .then((newNotes) => {
        if (newNotes.length < 25) {
          setHasMore(false);
        }
        setNotes((prev) => {
          const prevIds = new Set(prev.map((n) => n.id));
          const filteredNew = newNotes.filter((n) => !prevIds.has(n.id));
          return [...prev, ...filteredNew];
        });
      })
      .catch((err) => {
        console.error('Failed to load more notes:', err);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [category, notes, loadingMore, hasMore, loading]);

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        if (updatedNote.category !== category) {
          return prev.filter((n) => n.id !== updatedNote.id);
        }
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      if (updatedNote.category === category) {
        return [updatedNote, ...prev];
      }
      return prev;
    });
    api.fetchUnreadCounts().then(setUnreadCounts).catch(console.error);
  }, [category]);

  useSSE(handleNoteUpdated);

  useEffect(() => {
    setTimeout(() => {
      loadNotes(true);
    }, 0);

    const handleFocus = () => {
      loadNotes(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [loadNotes]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    const currentTarget = observerRef.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !loading) {
          loadMoreNotes();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreNotes, loadingMore, hasMore, loading]);

  const groupedNotes = useMemo(() => {
    return groupNotesByDate(notes);
  }, [notes]);

  const handleSelectCategory = (cat: string | null) => {
    if (cat) {
      router.push(`/${cat}`);
    } else {
      router.push('/');
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'Cooking': return '🍳';
      case 'Tech': return '💻';
      case 'Learning': return '📚';
      case 'Work': return '💼';
      case 'Finance': return '💰';
      case 'Other': return '📝';
      default: return '🧠';
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <Sidebar 
        selectedCategory={category} 
        onSelectCategory={handleSelectCategory}
        unreadCounts={unreadCounts}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-[90%] max-w-[1400px] mx-auto py-16">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl shadow-sm border border-border">
                {getCategoryIcon()}
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                {category}
              </h1>
            </div>
            <p className="text-secondary-text text-lg font-medium max-w-xl">
              Everything tagged as {category}.
            </p>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading ? (
              <>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm animate-pulse h-48" />
                ))}
              </>
            ) : error ? (
              <div className="text-center py-20 border border-red-100 dark:border-red-900/20 bg-red-50/10 dark:bg-red-950/5 rounded-2xl p-8 max-w-md mx-auto col-span-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/25 text-red-500 mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Lỗi kết nối máy chủ</h3>
                <p className="text-secondary-text text-sm mb-6">
                  {error}
                </p>
                <button
                  onClick={() => loadNotes(true)}
                  className="px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  Thử lại ngay
                </button>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-border rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10 col-span-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No notes yet</h3>
                <p className="text-secondary-text max-w-xs mx-auto text-sm">
                  You don&apos;t have any notes in the {category} category.
                </p>
              </div>
            ) : (
              groupedNotes.flatMap((group) => [
                <div 
                  key={`header-${group.dateKey}`} 
                  className="col-span-full flex items-center gap-4 mt-6 first:mt-0 mb-1 select-none"
                >
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="h-[1px] flex-1 bg-zinc-200/60 dark:bg-zinc-800/40" />
                </div>,
                ...group.notes.map((note) => (
                  <NoteCard key={note.id} note={note} onOpenModal={setActiveNoteForModal} />
                ))
              ])
            )}
          </div>

          {hasMore && !error && notes.length > 0 && (
            <div ref={observerRef} className="w-full flex justify-center py-8">
              {loadingMore && (
                <div className="w-6 h-6 rounded-full border-2 border-zinc-350 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 animate-spin" />
              )}
            </div>
          )}
        </div>
      </main>

      {activeNoteForModal && (
        <NoteDetailModal
          note={activeNoteForModal}
          isOpen={!!activeNoteForModal}
          onClose={() => setActiveNoteForModal(null)}
        />
      )}
    </div>
  );
}
