'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { X } from 'lucide-react';
import Badge from '@/components/atoms/common/Badge';
import { api } from '@/utils/api';

export interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
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

function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#### ')) {
      return <h5 key={index} className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 mt-4 mb-2 uppercase tracking-wider">{trimmed.replace('#### ', '')}</h5>;
    }
    if (trimmed.startsWith('### ')) {
      return <h4 key={index} className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-5 mb-2.5 pb-1 border-b border-zinc-200/50 dark:border-zinc-850/40">{trimmed.replace('### ', '')}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={index} className="text-base font-semibold text-foreground mt-6 mb-3.5 tracking-tight">{trimmed.replace('## ', '')}</h3>;
    }
    if (trimmed.startsWith('- ')) {
      const bulletContent = trimmed.replace('- ', '');
      return (
        <ul key={index} className="list-disc pl-5 my-1">
          <li className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
            {parseBoldText(bulletContent)}
          </li>
        </ul>
      );
    }
    if (trimmed === '') {
      return <div key={index} className="h-2" />;
    }
    if (trimmed === '---') {
      return <hr key={index} className="my-4 border-zinc-200/50 dark:border-zinc-800/40" />;
    }
    return <p key={index} className="text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed font-medium">{parseBoldText(line)}</p>;
  });
}

export default function NoteDetailModal({ note, isOpen, onClose }: NoteDetailModalProps) {
  const [fetchedNote, setFetchedNote] = useState<Note | null>(null);
  const { id: noteId, content: noteContent } = note;
  
  const isPlaceholderContent = (content: string | null | undefined) => {
    if (!content) return true;
    return (
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('/uploads/') ||
      content.startsWith('Processing file: ')
    );
  };

  const isPlaceholder = isPlaceholderContent(noteContent);
  const [loading, setLoading] = useState(isOpen && isPlaceholder);
  const [imageAspectRatio, setImageAspectRatio] = useState<'portrait' | 'landscape' | null>(null);
  const [prevNoteId, setPrevNoteId] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayNote = fetchedNote || note;

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setIsZoomed(false);
    setImageAspectRatio(null);
    setLoading(isOpen && isPlaceholder);
    setFetchedNote(null);
  }

  useEffect(() => {
    if (!isOpen || !noteId || !isPlaceholder) {
      return;
    }

    api.fetchNoteById(noteId)
      .then((fullNote) => {
        setFetchedNote(fullNote);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch note details:', err);
        setLoading(false);
      });
  }, [noteId, isPlaceholder, isOpen]);

  const hasPortraitImage = !!(displayNote.url && isImageUrl(displayNote.url) && imageAspectRatio === 'portrait');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && displayNote.url && isImageUrl(displayNote.url)) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalHeight > img.naturalWidth) {
          setImageAspectRatio('portrait');
        } else {
          setImageAspectRatio('landscape');
        }
      };
      img.onerror = () => {
        setImageAspectRatio('portrait');
      };
      img.src = displayNote.url;
    }
  }, [displayNote.url, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex bg-black/40 dark:bg-black/60 backdrop-blur-md p-4 md:p-6 overflow-y-auto ${
        displayNote.url && isImageUrl(displayNote.url)
          ? 'flex-col lg:flex-row items-center justify-start lg:justify-center gap-6 py-8 lg:py-0' 
          : 'items-center justify-center'
      }`}
      onClick={onClose}
    >
      {/* Main Note Card */}
      <div 
        className={`${
          displayNote.url && isImageUrl(displayNote.url)
            ? 'w-full lg:w-[45%] max-w-3xl h-[80vh] lg:h-[85vh] lg:max-h-[800px]' 
            : 'w-full max-w-3xl h-[80vh] lg:h-[85vh] lg:max-h-[800px]'
        } bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-250/30 dark:border-zinc-850/40 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            <h3 className="font-semibold text-foreground text-lg md:text-xl truncate tracking-tight">
              {displayNote.title || 'Untitled Note'}
            </h3>
            {displayNote.category && (
              <Badge 
                icon={CATEGORY_ICONS[displayNote.category] || '📝'} 
                text={displayNote.category} 
              />
            )}
          </div>
          <button 
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 border border-transparent hover:border-zinc-250/20 dark:hover:border-zinc-800/30 cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${displayNote.content ? 'lg:overflow-hidden lg:flex lg:flex-col lg:p-0' : ''}`}>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full p-6 lg:p-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-7 space-y-6 animate-pulse">
                <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-4" />
                <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-4">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-2/3 mb-2" />
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-11/12" />
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-4/5" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-1/2 mt-6 mb-2" />
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-9/12" />
                </div>
              </div>
              {/* Right Column Skeleton */}
              <div className="lg:col-span-5 space-y-6 animate-pulse lg:pl-4 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-zinc-800/40">
                <div>
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-5/6" />
                  </div>
                </div>
                <div>
                  <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-250 dark:bg-zinc-800" />
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-11/12" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-250 dark:bg-zinc-800" />
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : displayNote.content ? (
            <div className="space-y-8 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-start lg:items-stretch lg:flex-1 lg:overflow-hidden h-full">
                {/* Left Column: Full Content / 5W1H Analysis */}
                <div className="lg:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:p-8 lg:pr-4">
                  {displayNote.status === 'PROCESSING' ? (
                    <div className="space-y-6 animate-pulse">
                      <div>
                        <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-4" />
                        <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-4">
                          <div className="h-5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-2/3 mb-2" />
                          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-11/12" />
                          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-4/5" />
                          
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-1/2 mt-6 mb-2" />
                          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/55 rounded w-9/12" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">Full Content & Analysis</p>
                      <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-2">
                        {renderMarkdown(displayNote.content)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Summary, Key Takeaways */}
                <div className="lg:col-span-5 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:p-8 lg:pl-4 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-zinc-800/40">
                  {displayNote.url && !isImageUrl(displayNote.url) && (
                    <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800/40 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0">📄</span>
                        <div className="min-w-0">
                          <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5 select-none">Attachment</p>
                          <p className="text-base font-semibold text-foreground truncate">
                            {displayNote.url.split('/').pop() || 'Document'}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={displayNote.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm shrink-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open File
                      </a>
                    </div>
                  )}

                  {displayNote.status === 'PROCESSING' ? (
                    <div className="space-y-6 animate-pulse">
                      <div>
                        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
                        <div className="space-y-2">
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-full" />
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-5/6" />
                        </div>
                      </div>
                      <div>
                        <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-250 dark:bg-zinc-800" />
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-11/12" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-250 dark:bg-zinc-800" />
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-800/55 rounded w-3/4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {displayNote.summary && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">Summary</p>
                          <p className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                            {displayNote.summary}
                          </p>
                        </div>
                      )}

                      {displayNote.bullets && displayNote.bullets.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-3 select-none">Key Takeaways</p>
                          <ul className="space-y-2.5">
                            {displayNote.bullets.map((bullet, i) => (
                              <li key={i} className="text-base text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-650" />
                                <span className="leading-relaxed font-medium">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {displayNote.url && !isImageUrl(displayNote.url) && (
                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">📄</span>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5 select-none">Attachment</p>
                      <p className="text-base font-semibold text-foreground truncate">
                        {displayNote.url.split('/').pop() || 'Document'}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={displayNote.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open File
                  </a>
                </div>
              )}

              {displayNote.summary && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">Summary</p>
                  <p className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {displayNote.summary}
                  </p>
                </div>
              )}

              {displayNote.bullets && displayNote.bullets.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-3 select-none">Key Takeaways</p>
                  <ul className="space-y-2.5">
                    {displayNote.bullets.map((bullet, i) => (
                      <li key={i} className="text-base text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                        <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-650" />
                        <span className="leading-relaxed font-medium">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {displayNote.createdAt && !isNaN(new Date(displayNote.createdAt).getTime()) && (
          <div className="px-8 py-4 border-t border-zinc-250/30 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-400 dark:text-zinc-505 flex items-center justify-between select-none">
            <span>Created on</span>
            <span>
              {new Date(displayNote.createdAt).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {' at '}
              {new Date(displayNote.createdAt).toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Sibling Image Card */}
      {displayNote.url && isImageUrl(displayNote.url) && (
        <div 
          className={`${
            hasPortraitImage 
              ? 'w-full lg:w-[40%] max-w-xl lg:max-w-2xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]' 
              : 'w-full lg:w-[50%] max-w-2xl lg:max-w-3xl h-[60vh] lg:h-[85vh] lg:max-h-[800px]'
          } bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-6 flex flex-col shrink-0 relative overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex items-center justify-between mb-3 shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest select-none">
              Image Attachment
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 bg-zinc-100 dark:bg-zinc-900 border border-zinc-250/20 dark:border-zinc-800/30 px-2 py-0.5 rounded-full select-none">
                {isZoomed ? 'Click to fit' : 'Click to zoom'}
              </span>
              <a 
                href={displayNote.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:text-zinc-550 dark:hover:text-zinc-250 uppercase tracking-widest hover:underline cursor-pointer select-none"
              >
                Open original
              </a>
            </div>
          </div>
          <div 
            className={`w-full flex-1 flex items-center justify-center relative min-h-0 rounded-2xl ${
              isZoomed ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={displayNote.url} 
              alt={displayNote.title || "Note attachment"} 
              className={`rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm transition-all duration-300 ${
                isZoomed 
                  ? 'max-w-none max-h-none w-auto h-auto scale-100 object-none p-4' 
                  : 'w-full h-full object-contain'
              }`}
            />
            {displayNote.status === 'PROCESSING' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="text-xs font-bold text-white tracking-widest uppercase select-none">AI analyzing image...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
