import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { NotesRepository } from './repositories/notes.repository';
import { ScraperService } from '../scraper/scraper.service';
import { AiService } from '../ai/ai.service';
import { Category, Status } from '@prisma/client';
import { NoteUpdatedEvent } from './types/sse-event.type';

import { MarkitdownService } from '../parser/markitdown.service';

describe('NotesService', () => {
  let service: NotesService;
  let repository: NotesRepository;
  let scraperService: ScraperService;
  let aiService: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: NotesRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ScraperService,
          useValue: {
            scrape: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            analyze: jest.fn(),
            analyzeImage: jest.fn(),
          },
        },
        {
          provide: MarkitdownService,
          useValue: {
            convert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repository = module.get<NotesRepository>(NotesRepository);
    scraperService = module.get<ScraperService>(ScraperService);
    aiService = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processNote', () => {
    it('should emit note-updated when processing completes', (done) => {
      const noteId = 'test-id';
      const url = 'http://example.com';
      const mockScrapeResult = { title: 'Title', content: 'Content' };
      const mockAiResult = {
        title: 'AI Title',
        summary: 'Summary',
        bullets: ['One', 'Two'],
        category: Category.LEARNING,
      };
      const mockUpdatedNote = {
        id: noteId,
        url,
        userInput: null,
        aiTitle: 'Title',
        aiSummary: mockAiResult.summary,
        aiBullets: mockAiResult.bullets,
        content: mockScrapeResult.content,
        category: Category.LEARNING,
        status: Status.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (scraperService.scrape as jest.Mock).mockResolvedValue(mockScrapeResult);
      (aiService.analyze as jest.Mock).mockResolvedValue(mockAiResult);
      (repository.update as jest.Mock).mockResolvedValue(mockUpdatedNote);

      const events: NoteUpdatedEvent[] = [];
      service.getEventStream().subscribe({
        next: (event) => {
          events.push(event);
          expect(event).toEqual({
            id: noteId,
            status: Status.COMPLETED,
            aiTitle: 'Title',
            category: Category.LEARNING,
            aiSummary: 'Summary',
            aiBullets: ['One', 'Two'],
            content: 'Content',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            createdAt: expect.any(Date),
          });
          done();
        },
      });

      (repository.create as jest.Mock).mockResolvedValue({
        id: noteId,
        url,
        userInput: null,
        status: Status.PROCESSING,
      });
      void service.create({ url }, 'test-user-id');
    });

    it('should emit note-updated when processing fails', (done) => {
      const noteId = 'test-id';
      const url = 'http://example.com';
      const errorMessage = 'Scrape failed';
      const failedNote = {
        id: noteId,
        url,
        userInput: null,
        aiTitle: null,
        aiSummary: null,
        aiBullets: null,
        content: null,
        category: Category.OTHER,
        status: Status.FAILED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (scraperService.scrape as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );
      (repository.updateStatus as jest.Mock).mockResolvedValue(failedNote);

      service.getEventStream().subscribe({
        next: (event) => {
          expect(event).toEqual({
            id: noteId,
            status: Status.FAILED,
            aiTitle: null,
            category: Category.OTHER,
            aiSummary: null,
            aiBullets: null,
            content: null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            createdAt: expect.any(Date),
          });
          done();
        },
      });

      (repository.create as jest.Mock).mockResolvedValue({
        id: noteId,
        url,
        userInput: null,
        status: Status.PROCESSING,
      });
      void service.create({ url }, 'test-user-id');
    });
  });
});
