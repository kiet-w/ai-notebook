'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';

export default function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setAnswer(null);

    try {
      const res = await api.searchNotes(query);
      setAnswer(res.answer);
    } catch (error) {
      console.error('Search failed:', error);
      setAnswer('Sorry, something went wrong while searching.');
    } finally {
      setIsSearching(false);
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
          placeholder="Ask AI anything about your notes..."
          className="flex-1 bg-transparent border-none outline-none text-foreground text-lg px-2 placeholder:text-zinc-400"
          disabled={isSearching}
        />
        <button
          type="submit"
          suppressHydrationWarning
          disabled={!mounted || !query.trim() || isSearching}
          className="bg-foreground text-background p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      {/* AI Answer Section */}
      {(isSearching || answer) && (
        <div className="mt-6 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 backdrop-blur-xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0 pt-2">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                AI Assistant
                {isSearching && (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </h4>
              
              {isSearching ? (
                <div className="space-y-2 mt-3">
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-full animate-pulse" />
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-4/6 animate-pulse" />
                </div>
              ) : (
                <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                  {answer}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
