'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NoteInput from '@/components/molecules/NoteInput';
import NoteCard from '@/components/organisms/NoteCard';
import Sidebar from '@/components/organisms/Sidebar';
import { api, Note } from '@/utils/api';
import { useSSE } from '@/hooks/useSSE';
import { Inbox } from 'lucide-react';
// import SearchSection from '@/components/organisms/SearchSection';

interface CategoryTemplateProps {
  category: string;
}

export default function CategoryTemplate({ category }: CategoryTemplateProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const localNoteIdsRef = useRef<Set<string>>(new Set());

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      // Note arrived via SSE but wasn't in the list yet — prepend it
      return [updatedNote, ...prev];
    });
  }, []);

  useSSE(handleNoteUpdated);

  useEffect(() => {
    api.fetchNotes()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCapture = async (content: string) => {
    // Optimistic Update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticNote: Note = {
      id: tempId,
      content,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      category: category as any,
    };

    setNotes((prev) => [optimisticNote, ...prev]);

    try {
      const realNote = await api.createNote(content, category as any);
      localNoteIdsRef.current.add(realNote.id);
      setNotes((prev) =>
        prev.map((n) => (n.id === tempId ? realNote : n))
      );

      window.setTimeout(() => {
        api.fetchNotes().then(setNotes).catch(console.error);
      }, 1200);
    } catch (error) {
      console.error('Failed to capture note:', error);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === tempId ? { ...n, status: 'FAILED' } : n
        )
      );
    }
  };

  const handleUpload = async (file: File) => {
    // Optimistic Update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticNote: Note = {
      id: tempId,
      content: `Processing uploaded file: ${file.name}...`,
      title: file.name,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      category: category as any,
    };

    setNotes((prev) => [optimisticNote, ...prev]);

    try {
      const realNote = await api.uploadFile(file, category as any);
      localNoteIdsRef.current.add(realNote.id);
      // Replace optimistic note with real one
      setNotes((prev) =>
        prev.map((n) => (n.id === tempId ? realNote : n))
      );

      window.setTimeout(() => {
        api.fetchNotes().then(setNotes).catch(console.error);
      }, 1200);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === tempId ? { ...n, status: 'FAILED' } : n
        )
      );
    }
  };

  const filteredNotes = notes.filter((n) => n.category === category || n.status === 'PROCESSING' || n.status === 'FAILED' || localNoteIdsRef.current.has(n.id));

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
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:px-12">
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

          {/* <SearchSection /> */}

          <div className="sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-md mb-8">
            <NoteInput onSubmit={handleCapture} onUpload={handleUpload} />
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm animate-pulse h-40" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-border rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No notes yet</h3>
                <p className="text-secondary-text max-w-xs mx-auto text-sm">
                  You don't have any notes in the {category} category.
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
