import { Test, TestingModule } from '@nestjs/testing';
import { TextStructuringService } from '../services/text-structuring.service';

describe('TextStructuringService', () => {
  let service: TextStructuringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextStructuringService],
    }).compile();

    service = module.get<TextStructuringService>(TextStructuringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tokenizeSentences', () => {
    it('should split text into sentences across Vietnamese and English punctuation', () => {
      const text =
        'Trí tuệ nhân tạo đang phát triển nhanh chóng. Liệu nó có thay đổi thế giới không? Chắc chắn là có! Máy học là một phần quan trọng.';
      const sentences = service.tokenizeSentences(text);

      expect(sentences).toHaveLength(4);
      expect(sentences[0]).toBe(
        'Trí tuệ nhân tạo đang phát triển nhanh chóng.',
      );
      expect(sentences[1]).toBe('Liệu nó có thay đổi thế giới không?');
      expect(sentences[2]).toBe('Chắc chắn là có!');
      expect(sentences[3]).toBe('Máy học là một phần quan trọng.');
    });

    it('should not split decimal numbers or protected abbreviations', () => {
      const text = 'Nhiệt độ hôm nay là 37.5 độ C. TP. Hồ Chí Minh rất đẹp.';
      const sentences = service.tokenizeSentences(text);

      expect(sentences).toHaveLength(2);
      expect(sentences[0]).toContain('37.5');
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical texts', () => {
      const text = 'lập trình hướng đối tượng';
      const sim = service.cosineSimilarity(text, text);
      expect(sim).toBeCloseTo(1, 4);
    });

    it('should return 0 for completely disjoint texts', () => {
      const textA = 'nấu ăn cơm chiên gà luộc';
      const textB = 'lập trình máy tính thuật toán';
      const sim = service.cosineSimilarity(textA, textB);
      expect(sim).toBe(0);
    });

    it('should return value between 0 and 1 for overlapping texts', () => {
      const textA = 'học lập trình python căn bản';
      const textB = 'học lập trình javascript nâng cao';
      const sim = service.cosineSimilarity(textA, textB);
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });
  });

  describe('detectHeadingCandidate and scoreHeading', () => {
    it('should identify first line as candidate if newline is present', () => {
      const text =
        'Giới thiệu tổng quan\nĐây là nội dung chi tiết về đề tài nghiên cứu.';
      const candidate = service.detectHeadingCandidate(
        text,
        'Đây là nội dung chi tiết về đề tài nghiên cứu.',
      );
      expect(candidate).toBe('Giới thiệu tổng quan');
    });

    it('should score high for short, capitalized, non-punctuated candidate', () => {
      const score = service.scoreHeading('Kiến trúc hệ thống', 50);
      expect(score).toBeGreaterThanOrEqual(0.7);
    });

    it('should score low if ending with a period or exceeding length', () => {
      const scoreWithPeriod = service.scoreHeading(
        'Đây là một câu hoàn chỉnh.',
        50,
      );
      expect(scoreWithPeriod).toBeLessThan(0.7);

      const longHeading = 'A'.repeat(60);
      const scoreTooLong = service.scoreHeading(longHeading, 50);
      expect(scoreTooLong).toBeLessThan(0.7);
    });
  });

  describe('extractKeywords and buildKeywordHeading', () => {
    it('should extract top meaningful keywords ignoring stopwords', () => {
      const segment =
        'công nghệ trí tuệ nhân tạo và học máy là xu hướng công nghệ mới';
      const allDocs = [segment, 'ẩm thực nấu ăn món ngon'];
      const keywords = service.extractKeywords(segment, allDocs, 3);

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).not.toContain('và');
      expect(keywords).not.toContain('là');
    });

    it('should sort keywords by order of first appearance in original text and capitalize first letter', () => {
      const text =
        'Hệ thống sử dụng cơ sở dữ liệu để lưu trữ thông tin người dùng.';
      // Suppose keywords are 'thông', 'hệ', 'dữ' (ordered by tf-idf)
      const keywords = ['thông', 'hệ', 'dữ'];
      const heading = service.buildKeywordHeading(keywords, text);

      // 'hệ' appears first at index 0, 'dữ' appears at 'dữ liệu', 'thông' appears at 'thông tin'
      expect(heading).toBe('Hệ, Dữ, Thông');
    });
  });

  describe('structureText (end-to-end)', () => {
    it('should return empty result for empty input', () => {
      const result = service.structureText({ text: '' });
      expect(result.markdown).toBe('');
      expect(result.sections).toHaveLength(0);
    });

    it('should treat short text as a single section', () => {
      const shortText =
        'Chào mừng bạn đến với ứng dụng. Chúc bạn một ngày tốt lành.';
      const result = service.structureText({ text: shortText });

      expect(result.sections).toHaveLength(1);
      expect(result.markdown).toContain('##');
      expect(result.markdown).toContain('Chào mừng bạn đến với ứng dụng.');
    });

    it('should detect explicit headings and separate them from content', () => {
      const input = `Chương 1
Đây là nội dung phần đầu tiên của tài liệu học tập. Nó giải thích về các khái niệm cơ bản nhất.`;
      const result = service.structureText({ text: input });

      expect(result.sections[0].heading).toBe('Chương 1');
      expect(result.sections[0].content).not.toContain('Chương 1\n');
      expect(result.markdown).toBe(
        `## Chương 1\n\nĐây là nội dung phần đầu tiên của tài liệu học tập. Nó giải thích về các khái niệm cơ bản nhất.`,
      );
    });

    it('should fallback to keywords heading when no natural heading is detected', () => {
      const input =
        'Học máy và trí tuệ nhân tạo đang thay đổi thế giới lập trình phần mềm mỗi ngày.';
      const result = service.structureText({ text: input });

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].heading).not.toBe('');
      expect(result.sections[0].keywords.length).toBeGreaterThan(0);
    });
  });
});
