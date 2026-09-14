import { Injectable } from '@nestjs/common';

export interface TextStructuringConfig {
  windowSize: number;
  similarityThreshold: number;
  headingScoreThreshold: number;
  maxHeadingLength: number;
  topKeywordsCount: number;
}

export const DEFAULT_TEXT_STRUCTURING_CONFIG: TextStructuringConfig = {
  windowSize: 3,
  similarityThreshold: 0.15,
  headingScoreThreshold: 0.7,
  maxHeadingLength: 50,
  topKeywordsCount: 3,
};

export interface StructureTextInput {
  text: string;
  config?: Partial<TextStructuringConfig>;
}

export interface StructuredSection {
  heading: string;
  content: string;
  keywords: string[];
}

export interface StructuredTextResult {
  markdown: string;
  sections: StructuredSection[];
}

/**
 * Common English & Vietnamese stopwords to filter out for TF-IDF keyword extraction
 */
const STOPWORDS = new Set<string>([
  // English common stopwords
  'a',
  'about',
  'above',
  'after',
  'again',
  'against',
  'all',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'below',
  'between',
  'both',
  'but',
  'by',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'during',
  'each',
  'few',
  'for',
  'from',
  'further',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'me',
  'more',
  'most',
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'now',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'with',
  'would',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',

  // Vietnamese common stopwords
  'và',
  'là',
  'của',
  'những',
  'các',
  'cho',
  'trong',
  'với',
  'khi',
  'được',
  'có',
  'này',
  'đó',
  'để',
  'một',
  'nhiều',
  'về',
  'như',
  'từ',
  'ra',
  'vào',
  'lại',
  'thì',
  'ở',
  'người',
  'cũng',
  'nếu',
  'đã',
  'sẽ',
  'đang',
  'rồi',
  'chỉ',
  'bị',
  'nên',
  'cần',
  'rất',
  'qua',
  'bởi',
  'do',
  'theo',
  'lên',
  'xuống',
  'lúc',
  'nơi',
  'tại',
  'ai',
  'gì',
  'sao',
  'thế',
  'nào',
  'vậy',
  'nhưng',
  'mà',
  'hoặc',
  'hay',
  'vì',
  'bằng',
  'trên',
  'dưới',
  'sau',
  'trước',
  'giữa',
  'cùng',
  'tới',
]);

@Injectable()
export class TextStructuringService {
  /**
   * Main entrypoint: Takes unstructured OCR/document text and formats into structured Markdown
   */
  structureText(input: StructureTextInput): StructuredTextResult {
    const rawText = input.text?.trim() || '';
    if (!rawText) {
      return { markdown: '', sections: [] };
    }

    const config: TextStructuringConfig = {
      ...DEFAULT_TEXT_STRUCTURING_CONFIG,
      ...(input.config || {}),
    };

    // Step 1: Tokenize into sentences
    const sentences = this.tokenizeSentences(rawText);
    if (sentences.length === 0) {
      return { markdown: '', sections: [] };
    }

    // Step 2: Segment text into thematic blocks (TextTiling algorithm)
    const segments = this.segmentText(
      sentences,
      config.windowSize,
      config.similarityThreshold,
    );

    // Step 3 & 4: Process each segment to extract or infer heading
    const sections: StructuredSection[] = segments.map((segmentSentences) => {
      const fullSegmentText = segmentSentences.join(' ').trim();

      // Heading detection on the first sentence or first line
      const headingCandidate = this.detectHeadingCandidate(
        fullSegmentText,
        segmentSentences[0],
      );
      const headingScore = this.scoreHeading(
        headingCandidate,
        config.maxHeadingLength,
      );

      let finalHeading = '';
      let content = fullSegmentText;

      // Extract TF-IDF keywords for the segment
      const keywords = this.extractKeywords(
        fullSegmentText,
        segments.map((s) => s.join(' ')),
        config.topKeywordsCount,
      );

      if (headingScore >= config.headingScoreThreshold) {
        // Step 3: Valid heading found
        finalHeading = headingCandidate.trim();
        // Remove heading sentence from content if heading is exactly the first sentence
        if (
          segmentSentences.length > 1 &&
          segmentSentences[0].trim() === finalHeading
        ) {
          content = segmentSentences.slice(1).join(' ').trim();
        } else {
          content = this.removeHeadingFromContent(
            fullSegmentText,
            finalHeading,
          );
        }
      } else {
        // Step 4: Fallback to keywords sorted by order of appearance in segment
        finalHeading = this.buildKeywordHeading(keywords, fullSegmentText);
      }

      return {
        heading: finalHeading,
        content: content.trim(),
        keywords,
      };
    });

    // Step 5: Format to Markdown string
    const markdown = sections
      .map((sec) => `## ${sec.heading}\n\n${sec.content}`)
      .join('\n\n');

    return {
      markdown,
      sections,
    };
  }

  /**
   * 1. Tokenize text into sentences (supports Vietnamese and English punctuation, handles abbreviations & numbers)
   */
  tokenizeSentences(text: string): string[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Protect decimal numbers (e.g. 3.14)
    let protectedText = normalized.replace(/(\d+)\.(\d+)/g, '$1__DECIMAL__$2');

    // Protect common abbreviations
    protectedText = protectedText.replace(
      /\b(TP|ThS|TS|BS|PGS|GS|Dr|Mr|Mrs|Ms|Prof|vs|etc|i\.e|e\.g)\./gi,
      '$1__DOT__',
    );

    // Split on sentence-ending punctuation (.?!…) followed by space or newline boundaries
    const rawTokens = protectedText.split(
      /(?<=[.?!…])\s+(?=[A-ZÀ-Ỹ0-9"“'‘])|\n+/,
    );

    return rawTokens
      .map((s) =>
        s
          .replace(/__DOT__/g, '.')
          .replace(/__DECIMAL__/g, '.')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter((s) => s.length > 0);
  }

  /**
   * 2. Text segmentation using TextTiling with Cosine Similarity between adjacent sliding sentence windows
   */
  segmentText(
    sentences: string[],
    windowSize: number,
    similarityThreshold: number,
  ): string[][] {
    // If total sentences is within windowSize or cannot form two windows, keep as single section
    if (sentences.length <= windowSize || sentences.length < 2) {
      return [sentences];
    }

    const boundaries: number[] = [];

    // Sliding window: window left [i - windowSize + 1 ... i], window right [i + 1 ... i + windowSize]
    for (let i = windowSize - 1; i < sentences.length - windowSize; i++) {
      const leftWindow = sentences
        .slice(Math.max(0, i - windowSize + 1), i + 1)
        .join(' ');
      const rightWindow = sentences.slice(i + 1, i + 1 + windowSize).join(' ');

      const sim = this.cosineSimilarity(leftWindow, rightWindow);
      if (sim < similarityThreshold) {
        boundaries.push(i);
        // Advance past current window to avoid excessive fragmentation
        i += windowSize - 1;
      }
    }

    if (boundaries.length === 0) {
      return [sentences];
    }

    const segments: string[][] = [];
    let startIdx = 0;
    for (const bIdx of boundaries) {
      segments.push(sentences.slice(startIdx, bIdx + 1));
      startIdx = bIdx + 1;
    }
    if (startIdx < sentences.length) {
      segments.push(sentences.slice(startIdx));
    }

    return segments.filter((s) => s.length > 0);
  }

  /**
   * Calculates cosine similarity between two text blocks based on word frequency vectors
   */
  cosineSimilarity(textA: string, textB: string): number {
    const wordsA = this.extractWordTokens(textA);
    const wordsB = this.extractWordTokens(textB);

    if (wordsA.length === 0 || wordsB.length === 0) {
      return 0;
    }

    const freqA = new Map<string, number>();
    for (const w of wordsA) freqA.set(w, (freqA.get(w) || 0) + 1);

    const freqB = new Map<string, number>();
    for (const w of wordsB) freqB.set(w, (freqB.get(w) || 0) + 1);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const count of freqA.values()) {
      normA += count * count;
    }
    for (const count of freqB.values()) {
      normB += count * count;
    }

    for (const [w, countA] of freqA.entries()) {
      const countB = freqB.get(w);
      if (countB) {
        dotProduct += countA * countB;
      }
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 3. Detect candidate heading (first sentence or first line)
   */
  detectHeadingCandidate(segmentText: string, firstSentence: string): string {
    const firstLine = segmentText.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0 && firstLine !== segmentText) {
      return firstLine;
    }
    return firstSentence || '';
  }

  /**
   * 3. Scores heading likelihood: < 50 chars, no ending punctuation, starts with uppercase
   */
  scoreHeading(candidate: string, maxLength: number): number {
    const trimmed = candidate.trim();
    if (!trimmed) return 0;

    // Headings should NOT end with sentence-terminating punctuation (. ? !)
    if (/[.?!…]$/.test(trimmed)) {
      return 0;
    }

    let score = 0;

    // Condition 1: Length within bounds (< maxLength)
    if (trimmed.length > 0 && trimmed.length <= maxLength) {
      score += 0.4;
    }

    // Condition 2: Starts with capital letter (Latin & Vietnamese accented uppercase)
    const startsWithCapital = /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ]/.test(trimmed);
    if (startsWithCapital) {
      score += 0.4;
    }

    // Condition 3: Conciseness bonus
    if (trimmed.length <= 30) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * 4. Keyword extraction using TF-IDF across all segments
   */
  extractKeywords(
    segmentText: string,
    allSegments: string[],
    topK = 3,
  ): string[] {
    const segmentWords = this.extractWordTokens(segmentText);
    if (segmentWords.length === 0) return [];

    // Filter non-stopwords
    const meaningfulWords = segmentWords.filter(
      (w) => !STOPWORDS.has(w) && w.length > 1,
    );
    if (meaningfulWords.length === 0) return [];

    // Term frequency (TF)
    const tfMap = new Map<string, number>();
    for (const w of meaningfulWords) {
      tfMap.set(w, (tfMap.get(w) || 0) + 1);
    }

    // Inverse Document Frequency (IDF) based on presence in allSegments
    const totalDocs = allSegments.length;
    const scores: Array<{ word: string; score: number }> = [];

    for (const [word, count] of tfMap.entries()) {
      const tf = count / meaningfulWords.length;
      let docsWithWord = 0;
      for (const seg of allSegments) {
        if (seg.toLowerCase().includes(word)) {
          docsWithWord++;
        }
      }
      const idf = Math.log(1 + totalDocs / (1 + docsWithWord));
      scores.push({ word, score: tf * idf });
    }

    // Sort by TF-IDF score descending to pick the top K words
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).map((item) => item.word);
  }

  /**
   * Builds heading from top keywords sorted by order of first appearance in the original text,
   * capitalized and joined by comma.
   */
  buildKeywordHeading(keywords: string[], originalText: string): string {
    if (keywords.length === 0) {
      return 'Nội dung';
    }

    const lowerOriginal = originalText.toLowerCase();

    // Sort keywords by first appearance index in original text
    const sortedKeywords = [...keywords].sort((a, b) => {
      const idxA = lowerOriginal.indexOf(a);
      const idxB = lowerOriginal.indexOf(b);
      const safeA = idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA;
      const safeB = idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB;
      return safeA - safeB;
    });

    // Capitalize first letter of each keyword
    const capitalized = sortedKeywords.map(
      (kw) => kw.charAt(0).toUpperCase() + kw.slice(1),
    );

    return capitalized.join(', ');
  }

  /**
   * Helper: removes detected heading from segment text so it is not repeated in content
   */
  private removeHeadingFromContent(
    segmentText: string,
    heading: string,
  ): string {
    const trimmedHeading = heading.trim();
    const trimmedText = segmentText.trim();

    if (trimmedText.startsWith(trimmedHeading)) {
      const remaining = trimmedText.slice(trimmedHeading.length).trim();
      return remaining.length > 0 ? remaining : trimmedText;
    }

    return segmentText;
  }

  /**
   * Helper: tokenizes text into lowercased clean words
   */
  private extractWordTokens(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }
}
