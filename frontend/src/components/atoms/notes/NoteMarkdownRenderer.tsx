import React from 'react';

export interface NoteMarkdownRendererProps {
  content?: string | null;
  className?: string;
}

export function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function NoteMarkdownRenderer({ content, className }: NoteMarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={index} className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 mt-4 mb-2 uppercase tracking-wider">
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-5 mb-2.5 pb-1 border-b border-zinc-200/50 dark:border-zinc-850/40">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className="text-base font-semibold text-foreground mt-6 mb-3.5 tracking-tight">
              {trimmed.replace('## ', '')}
            </h3>
          );
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
        return (
          <p key={index} className="text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed font-medium">
            {parseBoldText(line)}
          </p>
        );
      })}
    </div>
  );
}

export default NoteMarkdownRenderer;
