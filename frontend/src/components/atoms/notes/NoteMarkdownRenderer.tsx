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

interface MatchRange {
  start: number;
  end: number;
  annotation: NoteAnnotation;
}

function findBestMatchIndex(
  text: string,
  targetText: string,
  prefix?: string,
  suffix?: string,
  usedRanges: { start: number; end: number }[] = [],
): number {
  if (!text || !targetText) return -1;

  const candidates: number[] = [];
  let pos = 0;
  while (pos < text.length) {
    const idx = text.indexOf(targetText, pos);
    if (idx === -1) break;
    const end = idx + targetText.length;
    const overlaps = usedRanges.some(
      (r) => (idx >= r.start && idx < r.end) || (end > r.start && end <= r.end),
    );
    if (!overlaps) {
      candidates.push(idx);
    }
    pos = idx + 1;
  }

  if (candidates.length === 0) return -1;
  if (candidates.length === 1 && !prefix && !suffix) return candidates[0];

  let bestIdx = candidates[0];
  let highestScore = -1;

  for (const idx of candidates) {
    let score = 0;
    const end = idx + targetText.length;

    if (prefix) {
      const textBefore = text.slice(Math.max(0, idx - prefix.length), idx);
      for (let i = 1; i <= Math.min(prefix.length, textBefore.length); i++) {
        if (prefix.slice(-i) === textBefore.slice(-i)) {
          score += i * 2;
        }
      }
    }

    if (suffix) {
      const textAfter = text.slice(end, end + suffix.length);
      for (let i = 1; i <= Math.min(suffix.length, textAfter.length); i++) {
        if (suffix.slice(0, i) === textAfter.slice(0, i)) {
          score += i * 2;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestIdx = idx;
    }
  }

  return bestIdx;
}

function renderTextWithAnnotations(
  text: string,
  annotations: NoteAnnotation[] = [],
  onAnnotationClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void,
  currentLineIndex?: number,
) {
  if (!annotations || annotations.length === 0 || !text) {
    return parseBoldText(text);
  }

  const matchingAnnotations = annotations.filter((ann) => {
    if (!ann.text) return false;
    if (ann.lineIndex !== undefined && currentLineIndex !== undefined) {
      return ann.lineIndex === currentLineIndex && text.includes(ann.text);
    }
    return text.includes(ann.text);
  });

  if (matchingAnnotations.length === 0) {
    return parseBoldText(text);
  }

  const ranges: MatchRange[] = [];

  for (const ann of matchingAnnotations) {
    const matchIndex = findBestMatchIndex(
      text,
      ann.text,
      ann.prefix,
      ann.suffix,
      ranges,
    );

    if (matchIndex !== -1) {
      const end = matchIndex + ann.text.length;
      ranges.push({ start: matchIndex, end, annotation: ann });
    }
  }

  if (ranges.length === 0) {
    return parseBoldText(text);
  }

  ranges.sort((a, b) => a.start - b.start);

  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let keyIdx = 0;

  for (const range of ranges) {
    if (range.start > currentIndex) {
      const before = text.slice(currentIndex, range.start);
      elements.push(
        <React.Fragment key={`text-${keyIdx++}`}>
          {parseBoldText(before)}
        </React.Fragment>,
      );
    }

    const matchedText = text.slice(range.start, range.end);
    elements.push(
      <NoteAnnotationHighlight
        key={`ann-${range.annotation.id}-${keyIdx++}`}
        annotation={range.annotation}
        onClick={(clickedAnn, e) => onAnnotationClick?.(clickedAnn, e)}
      >
        {parseBoldText(matchedText)}
      </NoteAnnotationHighlight>,
    );

    currentIndex = range.end;
  }

  if (currentIndex < text.length) {
    const after = text.slice(currentIndex);
    elements.push(
      <React.Fragment key={`text-${keyIdx++}`}>
        {parseBoldText(after)}
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
          const headerContent = trimmed.replace('#### ', '');
          return (
            <h5
              key={index}
              data-line-index={index}
              className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 mt-4 mb-2 uppercase tracking-wider"
            >
              {renderTextWithAnnotations(
                headerContent,
                annotations,
                onAnnotationClick,
                index,
              )}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          const headerContent = trimmed.replace('### ', '');
          return (
            <h4
              key={index}
              data-line-index={index}
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-5 mb-2.5 pb-1 border-b border-zinc-200/50 dark:border-zinc-850/40"
            >
              {renderTextWithAnnotations(
                headerContent,
                annotations,
                onAnnotationClick,
                index,
              )}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          const headerContent = trimmed.replace('## ', '');
          return (
            <h3
              key={index}
              data-line-index={index}
              className="text-base font-semibold text-foreground mt-6 mb-3.5 tracking-tight"
            >
              {renderTextWithAnnotations(
                headerContent,
                annotations,
                onAnnotationClick,
                index,
              )}
            </h3>
          );
        }
        if (trimmed.startsWith('- ')) {
          const bulletContent = trimmed.replace('- ', '');
          return (
            <ul key={index} className="list-disc pl-5 my-1">
              <li
                data-line-index={index}
                className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium"
              >
                {renderTextWithAnnotations(
                  bulletContent,
                  annotations,
                  onAnnotationClick,
                  index,
                )}
              </li>
            </ul>
          );
        }
        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }
        if (trimmed === '---') {
          return (
            <hr
              key={index}
              className="my-4 border-zinc-200/50 dark:border-zinc-800/40"
            />
          );
        }
        return (
          <p
            key={index}
            data-line-index={index}
            className="text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed font-medium"
          >
            {renderTextWithAnnotations(
              line,
              annotations,
              onAnnotationClick,
              index,
            )}
          </p>
        );
      })}
    </div>
  );
}

export default NoteMarkdownRenderer;
