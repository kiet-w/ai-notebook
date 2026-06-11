'use client';

import { Note } from '@/types/note';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import Badge from '@/components/atoms/Badge';

interface NoteCardProps {
  note: Note;
}

const CATEGORY_ICONS: Record<string, string> = {
  Cooking: '🍳',
  Tech: '💻',
  Learning: '📚',
  Work: '💼',
  Finance: '💰',
  Other: '📝',
};

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.startsWith('data:image/');
};

export default function NoteCard({ note }: NoteCardProps) {
  // Removed PROCESSING block so content shows immediately without skeleton

  if (note.status === 'FAILED') {
    return (
      <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">Analysis failed</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/50 line-clamp-2 italic mb-3">&quot;{note.content}&quot;</p>
            <button 
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-3 h-3" />
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3 className="font-bold text-foreground leading-tight text-lg">
          {note.title || 'Untitled Note'}
        </h3>
        {note.category && (
          <Badge 
            icon={CATEGORY_ICONS[note.category] || '📝'} 
            text={note.category} 
          />
        )}
      </div>

      {note.url && isImageUrl(note.url) && (
        <div className="mb-5 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={note.url} 
            alt={note.title || "Note attachment"} 
            className="w-full max-h-[350px] object-contain hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {note.url && !isImageUrl(note.url) && (
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">📄</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Attachment</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {note.url.split('/').pop() || 'Document'}
              </p>
            </div>
          </div>
          <a 
            href={note.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-foreground transition-all shrink-0"
          >
            Open File
          </a>
        </div>
      )}

      {note.content && (
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Original Note</p>
          <p className="text-[14px] text-foreground/90 italic leading-relaxed line-clamp-3">
            &quot;{note.content}&quot;
          </p>
        </div>
      )}
      
      {note.summary && (
        <p className="text-[15px] text-foreground/80 mb-5 leading-relaxed font-medium">
          {note.summary}
        </p>
      )}

      {note.bullets && note.bullets.length > 0 && (
        <ul className="space-y-3 mb-6">
          {note.bullets.map((bullet, i) => (
            <li key={i} className="text-sm text-foreground/70 flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="leading-snug">{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {note.createdAt && !isNaN(new Date(note.createdAt).getTime()) && (
            <>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {new Date(note.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>

  );
}
