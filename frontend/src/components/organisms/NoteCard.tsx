'use client';

import { useState, memo, useMemo } from 'react';
import { Note } from '@/types/note';
import { api } from '@/utils/api';
import { RefreshCw, AlertCircle } from 'lucide-react';
import Badge from '@/components/atoms/Badge';
import Image from 'next/image';
import { getRelativeImageUrl } from '@/utils/image';

interface NoteCardProps {
  note: Note;
  onOpenModal?: (note: Note) => void;
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

function NoteCard({ note, onOpenModal }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<'portrait' | 'landscape' | null>(null);
  const [localIsRead, setLocalIsRead] = useState(note.isRead);
  const [prevIsRead, setPrevIsRead] = useState(note.isRead);

  if (note.isRead !== prevIsRead) {
    setPrevIsRead(note.isRead);
    setLocalIsRead(note.isRead);
  }

  const handleMarkAsRead = async () => {
    if (localIsRead || note.status === 'PROCESSING') return;
    try {
      setLocalIsRead(true);
      await api.markAsRead(note.id);
    } catch (err) {
      console.error('Failed to mark note as read:', err);
      setLocalIsRead(false);
    }
  };

  const parsedDate = useMemo(() => {
    if (!note.createdAt) return null;
    const d = new Date(note.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }, [note.createdAt]);

  const renderDefaultCardContent = () => {
    const hasImage = note.url && isImageUrl(note.url);

    if (hasImage && imageAspectRatio === 'landscape') {
      // Landscape: 1x1 (stacked layout)
      return (
        <div className="flex flex-col gap-2 h-full w-full justify-between">
          {/* Top: Landscape Image Banner */}
          <div className="h-[65px] w-[65px] shrink-0 relative overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/45 bg-zinc-50 dark:bg-zinc-950">
            <Image 
              src={getRelativeImageUrl(note.url)} 
              alt={note.title || "Note attachment preview"} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 20vw"
            />
            {note.status === 'PROCESSING' && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center gap-1.5">
                <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="text-[8px] font-bold text-white tracking-widest uppercase select-none">AI Analyzing</span>
              </div>
            )}
            {!localIsRead && note.status !== 'PROCESSING' && (
              <span className="absolute top-2 right-2 z-10 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
              </span>
            )}
          </div>

          {/* Bottom: Text Content */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1 gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {note.status === 'PROCESSING' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-455 dark:bg-zinc-650 animate-pulse shrink-0" />
                  )}
                  <h3 className="font-semibold text-foreground leading-none text-[15px] tracking-tight truncate">
                    {note.title || 'Untitled Note'}
                  </h3>
                </div>
                {note.category && (
                  <Badge 
                    icon={CATEGORY_ICONS[note.category] || '📝'} 
                    text={note.category} 
                  />
                )}
              </div>

              {/* Show summary or content with smaller font to fit */}
              {note.summary ? (
                <p className="text-[11.5px] text-zinc-550 dark:text-zinc-400 font-medium line-clamp-1 leading-normal">
                  {note.summary}
                </p>
              ) : note.content ? (
                <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 line-clamp-1 leading-normal italic">
                  {note.content}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {parsedDate && (
                  <>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                      {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-850" />
                    <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-550">
                      {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (hasImage && imageAspectRatio === 'portrait') {
      // Portrait: 2x1 (side-by-side layout)
      return (
        <div className="flex gap-4 items-stretch h-full w-full">
          <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
            <div>
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  {note.status === 'PROCESSING' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-650 animate-pulse shrink-0" />
                  )}
                  <h3 className="font-semibold text-foreground leading-tight text-[17px] tracking-tight line-clamp-1">
                    {note.title || 'Untitled Note'}
                  </h3>
                </div>
                {note.category && (
                  <Badge 
                    icon={CATEGORY_ICONS[note.category] || '📝'} 
                    text={note.category} 
                  />
                )}
              </div>

              {note.summary ? (
                <p className="text-sm text-zinc-650 dark:text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                  {note.summary}
                </p>
              ) : note.content ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2 leading-relaxed italic">
                  {note.content}
                </p>
              ) : null}
            </div>

            <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                {parsedDate && (
                  <>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                      {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-850" />
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-550">
                      {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-20 h-full shrink-0 relative overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/45 bg-zinc-50 dark:bg-zinc-950">
            <Image 
              src={getRelativeImageUrl(note.url)} 
              alt={note.title || "Note attachment preview"} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 20vw"
            />
            {note.status === 'PROCESSING' && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                <div className="w-4 h-4 rounded-full border border-white/30 border-t-white animate-spin" />
                <span className="text-[7px] font-bold text-white tracking-wider uppercase select-none">AI...</span>
              </div>
            )}
            {!localIsRead && note.status !== 'PROCESSING' && (
              <span className="absolute top-2 right-2 z-10 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default (No image or loading ratio): Standard layout
    return (
      <div className="flex flex-col justify-between h-full w-full">
        {note.url && isImageUrl(note.url) && !imageAspectRatio && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={note.url}
            alt=""
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setImageAspectRatio('portrait');
              } else {
                setImageAspectRatio('landscape');
              }
            }}
          />
        )}
        <div>
          <div className="flex items-start justify-between mb-3 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {note.status === 'PROCESSING' && (
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-650 animate-pulse shrink-0" />
              )}
              <h3 className="font-semibold text-foreground leading-tight text-[17px] tracking-tight line-clamp-1">
                {note.title || 'Untitled Note'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!localIsRead && note.status !== 'PROCESSING' && (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
              {note.category && (
                <Badge 
                  icon={CATEGORY_ICONS[note.category] || '📝'} 
                  text={note.category} 
                />
              )}
            </div>
          </div>

          {note.summary ? (
            <p className="text-sm text-zinc-650 dark:text-zinc-400 font-medium line-clamp-2 leading-relaxed">
              {note.summary}
            </p>
          ) : note.content ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2 leading-relaxed italic">
              {note.content}
            </p>
          ) : null}
        </div>

        <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {parsedDate && (
              <>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                  {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-850" />
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-550">
                  {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (note.status === 'FAILED') {
    return (
      <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">Analysis failed</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/50 line-clamp-2 italic mb-3">&quot;{note.content}&quot;</p>
            <button 
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!localIsRead && note.status !== 'PROCESSING') {
      handleMarkAsRead();
    }
  };

  const handleCardClick = () => {
    if (!localIsRead && note.status !== 'PROCESSING') {
      handleMarkAsRead();
    }
    onOpenModal?.(note);
  };

  return (
    <div 
      className="relative w-full h-[180px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Default/Compact Card */}
      <div 
        onClick={handleCardClick}
        className="w-full h-full p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/30 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700 overflow-hidden cursor-pointer"
      >
        {renderDefaultCardContent()}
      </div>

      {/* Pop-up Card on Hover */}
      {isHovered && (
        <div 
          onClick={handleCardClick}
          className="absolute top-0 left-0 w-full z-50 p-6 rounded-2xl border border-zinc-300/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)] flex flex-col gap-4 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-foreground leading-tight text-[17px] tracking-tight">
              {note.title || 'Untitled Note'}
            </h3>
            {note.category && (
              <Badge 
                icon={CATEGORY_ICONS[note.category] || '📝'} 
                text={note.category} 
              />
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4">
            {note.url && isImageUrl(note.url) && (
              <div className="overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center relative w-full h-[350px]">
                <Image 
                  src={getRelativeImageUrl(note.url)} 
                  alt={note.title || "Note attachment"} 
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 20vw"
                />
              </div>
            )}

            {note.url && !isImageUrl(note.url) && (
              <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">📄</span>
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-0.5 select-none">Attachment</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {note.url.split('/').pop() || 'Document'}
                    </p>
                  </div>
                </div>
                <a 
                  href={note.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold text-white dark:text-zinc-900 shadow-sm shrink-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open File
                </a>
              </div>
            )}

            {note.summary && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5 select-none">Summary</p>
                <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {note.summary}
                </p>
              </div>
            )}

            {note.content && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5 select-none">Full Content / 5W1H Analysis</p>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800/30 space-y-1.5">
                  {renderMarkdown(note.content)}
                </div>
              </div>
            )}

            {note.bullets && note.bullets.length > 0 && (
              <div>
                <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest mb-2 select-none">Key Takeaways</p>
                <ul className="space-y-2">
                  {note.bullets.map((bullet, i) => (
                    <li key={i} className="text-sm text-zinc-655 dark:text-zinc-350 flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-650" />
                      <span className="leading-snug font-medium">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {parsedDate && (
                <>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                    {parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-850" />
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-550">
                    {parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(NoteCard);

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
