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

export interface InlineToken {
  type: 'text' | 'bold' | 'link';
  text: string;
  href?: string;
}

export function parseMarkdownTokens(raw: string): InlineToken[] {
  if (!raw) return [];

  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g;
  const parts = raw.split(tokenRegex);
  const tokens: InlineToken[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      tokens.push({
        type: 'bold',
        text: part.slice(2, -2),
      });
    } else {
      const linkMatch = /^\[(.*?)\]\((.*?)\)$/.exec(part);
      if (linkMatch) {
        tokens.push({
          type: 'link',
          text: linkMatch[1],
          href: getRelativeImageUrl(linkMatch[2]),
        });
      } else {
        tokens.push({
          type: 'text',
          text: part,
        });
      }
    }
  }

  return tokens;
}

function renderFormattedPiece(
  text: string,
  type: 'text' | 'bold' | 'link',
  href?: string,
  key?: string | number,
) {
  if (!text) return null;
  if (type === 'bold') {
    return (
      <strong key={key} className="font-semibold text-foreground">
        {text}
      </strong>
    );
  }
  if (type === 'link') {
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 hover:decoration-zinc-900 dark:decoration-zinc-600 dark:hover:decoration-zinc-100 font-medium break-all"
      >
        {text}
      </a>
    );
  }
  return <React.Fragment key={key}>{text}</React.Fragment>;
}

export function parseInlineMarkdown(text: string) {
  const tokens = parseMarkdownTokens(text);
  return tokens.map((token, i) =>
    renderFormattedPiece(token.text, token.type, token.href, i),
  );
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
  rawText: string,
  annotations: NoteAnnotation[] = [],
  onAnnotationClick?: (annotation: NoteAnnotation, e: React.MouseEvent) => void,
  currentLineIndex?: number,
) {
  if (!rawText) return null;

  const tokens = parseMarkdownTokens(rawText);
  const fullVisibleText = tokens.map((t) => t.text).join('');

  if (!annotations || annotations.length === 0 || !fullVisibleText) {
    return tokens.map((token, i) =>
      renderFormattedPiece(token.text, token.type, token.href, i),
    );
  }

  const matchingAnnotations = annotations.filter((ann) => {
    if (!ann.text) return false;
    if (ann.lineIndex !== undefined && currentLineIndex !== undefined) {
      return (
        ann.lineIndex === currentLineIndex && fullVisibleText.includes(ann.text)
      );
    }
    return fullVisibleText.includes(ann.text);
  });

  if (matchingAnnotations.length === 0) {
    return tokens.map((token, i) =>
      renderFormattedPiece(token.text, token.type, token.href, i),
    );
  }

  const ranges: MatchRange[] = [];

  for (const ann of matchingAnnotations) {
    const matchIndex = findBestMatchIndex(
      fullVisibleText,
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
    return tokens.map((token, i) =>
      renderFormattedPiece(token.text, token.type, token.href, i),
    );
  }

  const elements: React.ReactNode[] = [];
  let currentOffset = 0;
  let keyIdx = 0;

  for (const token of tokens) {
    const tokenStart = currentOffset;
    const tokenEnd = currentOffset + token.text.length;
    currentOffset = tokenEnd;

    const cutSet = new Set<number>([tokenStart, tokenEnd]);
    for (const r of ranges) {
      if (r.start > tokenStart && r.start < tokenEnd) cutSet.add(r.start);
      if (r.end > tokenStart && r.end < tokenEnd) cutSet.add(r.end);
    }
    const cuts = Array.from(cutSet).sort((a, b) => a - b);

    for (let i = 0; i < cuts.length - 1; i++) {
      const segStart = cuts[i];
      const segEnd = cuts[i + 1];
      const relStart = segStart - tokenStart;
      const relEnd = segEnd - tokenStart;
      const subText = token.text.slice(relStart, relEnd);
      if (!subText) continue;

      const coveringRange = ranges.find(
        (r) => segStart >= r.start && segEnd <= r.end,
      );

      if (coveringRange) {
        elements.push(
          <NoteAnnotationHighlight
            key={`ann-${coveringRange.annotation.id}-${keyIdx++}`}
            annotation={coveringRange.annotation}
            onClick={(clickedAnn, e) => onAnnotationClick?.(clickedAnn, e)}
          >
            {renderFormattedPiece(subText, token.type, token.href)}
          </NoteAnnotationHighlight>,
        );
      } else {
        elements.push(
          renderFormattedPiece(
            subText,
            token.type,
            token.href,
            `tok-${keyIdx++}`,
          ),
        );
      }
    }
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
