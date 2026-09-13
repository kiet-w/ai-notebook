'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { api, Note } from '@/utils/api';
import { useI18n } from '@/hooks/useI18n';
import { useRouter } from 'next/navigation';
import Badge from '@/components/atoms/common/Badge';
import { getCategoryLabel } from '@/utils/category';

export default function SearchSection() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Note[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await api.searchNotes(query.trim());
      setResults(res.notes || []);
    } catch (error) {
      console.error('Search failed:', error);
      setErrorMessage(t('notes.aiSearchError') || 'Có lỗi xảy ra khi tìm kiếm');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    if (note.category) {
      router.push(`/${note.category}`);
    }
  };

  return (
    <div className="mb-12 w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSearch}
        className="relative group flex items-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-sm transition-all hover:shadow-md hover:bg-white/80 dark:hover:bg-zinc-900/80"
      >
        <div className="pl-4 pr-2 text-zinc-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('notes.aiSearchPlaceholder')}
          className="flex-1 bg-transparent border-none outline-none text-foreground text-lg px-2 placeholder:text-zinc-400"
          disabled={isSearching}
        />
        <button
          type="submit"
          suppressHydrationWarning
          disabled={!mounted || !query.trim() || isSearching}
          className="bg-foreground text-background p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="mt-6 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <h4 className="text-sm font-semibold text-foreground">
              Kết quả tìm kiếm ({results.length})
            </h4>
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
          </div>

          {errorMessage && (
            <p className="py-4 text-sm text-red-500 text-center">{errorMessage}</p>
          )}

          {!isSearching && results.length === 0 && !errorMessage && (
            <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              Không tìm thấy ghi chú nào phù hợp với &ldquo;{query}&rdquo;.
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 mt-1 max-h-96 overflow-y-auto">
              {results.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className="py-3 px-2 flex items-start justify-between gap-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {note.title || t('notes.untitledNote')}
                      </h5>
                      {note.content && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                          {note.content}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {note.category && (
                      <Badge
                        text={getCategoryLabel(note.category, t)}
                        className="text-[10px] px-2 py-0.5"
                      />
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
