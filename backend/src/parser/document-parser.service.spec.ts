import { Test, TestingModule } from '@nestjs/testing';
import { DocumentParserService } from './document-parser.service';
import { MarkitdownService } from './markitdown.service';
import { TextStructuringService } from './text-structuring.service';
import { ParsedDocumentResult } from './types/document-parser.type';

describe('DocumentParserService', () => {
  let service: DocumentParserService;
  let markitdownService: { convert: jest.Mock };
  let textStructuringService: { structureText: jest.Mock };

  beforeEach(async () => {
    markitdownService = {
      convert: jest.fn(),
    };

    textStructuringService = {
      structureText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentParserService,
        {
          provide: MarkitdownService,
          useValue: markitdownService,
        },
        {
          provide: TextStructuringService,
          useValue: textStructuringService,
        },
      ],
    }).compile();

    service = module.get<DocumentParserService>(DocumentParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseAndStructureFile', () => {
    it('should coordinate parsing and structuring and return ParsedDocumentResult', async () => {
      const filePath = '/path/to/sample.pdf';
      const mockRawMarkdown = '# Sample Title\n\nThis is sample content.';
      const mockStructuredResult = {
        markdown: '## Sample Title\n\nThis is sample content.',
        sections: [
          {
            heading: 'Sample Title',
            content: 'This is sample content.',
            keywords: ['sample', 'title', 'content'],
          },
        ],
      };

      markitdownService.convert.mockResolvedValue(mockRawMarkdown);
      textStructuringService.structureText.mockReturnValue(
        mockStructuredResult,
      );

      const result: ParsedDocumentResult =
        await service.parseAndStructureFile(filePath);

      expect(markitdownService.convert).toHaveBeenCalledWith(filePath);
      expect(textStructuringService.structureText).toHaveBeenCalledWith({
        text: mockRawMarkdown,
      });
      expect(result).toEqual({
        rawMarkdown: mockRawMarkdown,
        structuredMarkdown: mockStructuredResult.markdown,
        sections: mockStructuredResult.sections,
      });
    });

    it('should handle empty markdown output gracefully and warn', async () => {
      const filePath = '/path/to/empty.pdf';
      const mockRawMarkdown = '   ';
      const mockStructuredResult = {
        markdown: '',
        sections: [],
      };

      markitdownService.convert.mockResolvedValue(mockRawMarkdown);
      textStructuringService.structureText.mockReturnValue(
        mockStructuredResult,
      );

      const result: ParsedDocumentResult =
        await service.parseAndStructureFile(filePath);

      expect(markitdownService.convert).toHaveBeenCalledWith(filePath);
      expect(textStructuringService.structureText).toHaveBeenCalledWith({
        text: mockRawMarkdown,
      });
      expect(result).toEqual({
        rawMarkdown: mockRawMarkdown,
        structuredMarkdown: '',
        sections: [],
      });
    });

    it('should propagate error when markitdownService.convert throws', async () => {
      const filePath = '/path/to/corrupted.pdf';
      const mockError = new Error(
        'Failed to convert file to markdown: Command failed',
      );

      markitdownService.convert.mockRejectedValue(mockError);

      await expect(service.parseAndStructureFile(filePath)).rejects.toThrow(
        mockError,
      );
      expect(markitdownService.convert).toHaveBeenCalledWith(filePath);
      expect(textStructuringService.structureText).not.toHaveBeenCalled();
    });
  });
});
