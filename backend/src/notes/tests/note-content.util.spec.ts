import {
  buildFileNoteContent,
  deriveNoteTitle,
  mergeScrapedContent,
} from '../utils/note-content.util';

describe('Note Content Utils', () => {
  describe('deriveNoteTitle', () => {
    it('should prioritize input title if present', () => {
      const title = deriveNoteTitle({
        inputTitle: 'My Title',
        scrapedTitle: 'Scraped Web Title',
        content: 'First line of content\nSecond line',
      });
      expect(title).toBe('My Title');
    });

    it('should use scraped title if input title is missing', () => {
      const title = deriveNoteTitle({
        scrapedTitle: 'Scraped Web Title',
        content: 'First line of content',
      });
      expect(title).toBe('Scraped Web Title');
    });

    it('should ignore "No Title" as scraped title and fallback to first line of content', () => {
      const title = deriveNoteTitle({
        scrapedTitle: 'No Title',
        content: 'First line of content\nSecond line',
      });
      expect(title).toBe('First line of content');
    });

    it('should truncate first line to 80 chars if no title provided', () => {
      const longLine = 'A'.repeat(120);
      const title = deriveNoteTitle({ content: longLine });
      expect(title).toHaveLength(80);
      expect(title).toBe('A'.repeat(80));
    });

    it('should use fallback if content is empty', () => {
      const title = deriveNoteTitle({ fallback: 'file.pdf' });
      expect(title).toBe('file.pdf');
    });

    it('should default to "Untitled" if everything is empty', () => {
      const title = deriveNoteTitle({});
      expect(title).toBe('Untitled');
    });
  });

  describe('mergeScrapedContent', () => {
    it('should combine rawContent and scrapedContent with double newline', () => {
      const merged = mergeScrapedContent({
        rawContent: 'User summary',
        scrapedContent: 'Scraped article body',
      });
      expect(merged).toBe('User summary\n\nScraped article body');
    });

    it('should return scrapedContent if rawContent is empty', () => {
      const merged = mergeScrapedContent({
        scrapedContent: 'Scraped article body',
      });
      expect(merged).toBe('Scraped article body');
    });

    it('should return rawContent or url if scrapedContent is empty', () => {
      expect(mergeScrapedContent({ rawContent: 'Raw text' })).toBe('Raw text');
      expect(mergeScrapedContent({ url: 'https://example.com' })).toBe(
        'https://example.com',
      );
    });
  });

  describe('buildFileNoteContent', () => {
    it('should combine inputContent and parsedMarkdown', () => {
      const content = buildFileNoteContent({
        inputContent: 'User remarks',
        parsedMarkdown: '# Document Title\n\nBody text',
        originalName: 'test.pdf',
        fileUrl: '/uploads/test.pdf',
      });
      expect(content).toBe('User remarks\n\n# Document Title\n\nBody text');
    });

    it('should return parsedMarkdown if inputContent is missing', () => {
      const content = buildFileNoteContent({
        parsedMarkdown: '# Markdown only',
        originalName: 'test.pdf',
        fileUrl: '/uploads/test.pdf',
      });
      expect(content).toBe('# Markdown only');
    });

    it('should fallback to attachment link if neither inputContent nor parsedMarkdown is present', () => {
      const content = buildFileNoteContent({
        originalName: 'image.png',
        fileUrl: '/uploads/image.png',
      });
      expect(content).toBe('[Tập tin đính kèm: image.png](/uploads/image.png)');
    });
  });
});
