import React from 'react';
import { getRelativeImageUrl } from '@/utils/image';
import { NoteAnnotation } from '@/types/annotation';
import NoteAnnotationHighlight from './NoteAnnotationHighlight';

export interface NoteMarkdownRendererProps {
  content?: string | null;
  className?: string;
  annotations?: NoteAnnotation[];
  onAnnotationClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void;
}

export function parseInlineMarkdown(text: string) {
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = /^\[(.*?)\]\((.*?)\)$/.exec(part);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const rawHref = linkMatch[2];
      const linkHref = getRelativeImageUrl(rawHref);
      return (
        <a
          key={i}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 hover:decoration-zinc-900 dark:decoration-zinc-600 dark:hover:decoration-zinc-100 font-medium break-all"
        >
          {linkText}
        </a>
      );
    }
    return part;
  });
}

export const parseBoldText = parseInlineMarkdown;

function renderTextWithAnnotations(
  text: string,
  annotations: NoteAnnotation[] = [],
  onAnnotationClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void,
) {
  if (!annotations || annotations.length === 0 || !text) {
    return parseBoldText(text);
  }

  const matchingAnnotations = annotations.filter(
    (ann) => ann.text && text.includes(ann.text),
  );

  if (matchingAnnotations.length === 0) {
    return parseBoldText(text);
  }

  const sorted = [...matchingAnnotations].sort(
    (a, b) => text.indexOf(a.text) - text.indexOf(b.text),
  );

  const elements: React.ReactNode[] = [];
  let remainingText = text;
  let keyIdx = 0;

  for (const ann of sorted) {
    const idx = remainingText.indexOf(ann.text);
    if (idx === -1) continue;

    const before = remainingText.slice(0, idx);
    const match = remainingText.slice(idx, idx + ann.text.length);
    remainingText = remainingText.slice(idx + ann.text.length);

    if (before) {
      elements.push(
        <React.Fragment key={`text-${keyIdx++}`}>
          {parseBoldText(before)}
        </React.Fragment>,
      );
    }

    elements.push(
      <NoteAnnotationHighlight
        key={`ann-${ann.id}-${keyIdx++}`}
        annotation={ann}
        onClick={(clickedAnn, e) => onAnnotationClick?.(clickedAnn, e)}
      >
        {parseBoldText(match)}
      </NoteAnnotationHighlight>,
    );
  }

  if (remainingText) {
    elements.push(
      <React.Fragment key={`text-${keyIdx++}`}>
        {parseBoldText(remainingText)}
      </React.Fragment>,
    );
  }

  return elements;
}

export function NoteMarkdownRenderer({
  content,
  className,
  annotations = [],
  onAnnotationClick,
}: NoteMarkdownRendererProps) {
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
                {renderTextWithAnnotations(bulletContent, annotations, onAnnotationClick)}
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
            {renderTextWithAnnotations(line, annotations, onAnnotationClick)}
          </p>
        );
      })}
    </div>
  );
}

export default NoteMarkdownRenderer;
