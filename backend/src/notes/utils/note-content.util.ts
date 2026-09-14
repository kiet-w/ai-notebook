export function deriveNoteTitle(params: {
  inputTitle?: string;
  scrapedTitle?: string;
  content?: string;
  fallback?: string;
}): string {
  const input = params.inputTitle?.trim();
  if (input) return input;

  const scraped = params.scrapedTitle?.trim();
  if (scraped && scraped !== 'No Title') return scraped;

  if (params.content) {
    const firstLine = params.content.split('\n')[0]?.trim();
    if (firstLine) {
      return firstLine.slice(0, 80);
    }
  }

  return params.fallback?.trim() || 'Untitled';
}

export function mergeScrapedContent(params: {
  rawContent?: string;
  scrapedContent?: string;
  url?: string;
}): string {
  const raw = params.rawContent?.trim();
  const scraped = params.scrapedContent?.trim();

  if (raw && scraped) {
    return `${raw}\n\n${scraped}`;
  }
  if (scraped) {
    return scraped;
  }
  return raw || params.url?.trim() || '';
}

export function buildFileNoteContent(params: {
  inputContent?: string;
  parsedMarkdown?: string;
  originalName: string;
  fileUrl: string;
}): string {
  const fallback = `[Tập tin đính kèm: ${params.originalName}](${params.fileUrl})`;
  const input = params.inputContent?.trim();
  const parsed = params.parsedMarkdown?.trim();

  if (input) {
    return parsed ? `${input}\n\n${parsed}` : input;
  }
  if (parsed) {
    return parsed;
  }
  return fallback;
}
