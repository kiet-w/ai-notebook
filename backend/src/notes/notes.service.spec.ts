/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { NotesRepository } from './repository/notes.repository';
import { CategoriesService } from '../categories/categories.service';
import { StorageService } from '../storage/storage.service';
import { EventsService } from '../events/events.service';
import { DocumentParserService } from '../parser/document-parser.service';
import { ScraperService } from '../scraper/scraper.service';
import { Category, Status } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('NotesService', () => {
  let service: NotesService;
  let repository: NotesRepository;
  let categoriesService: CategoriesService;
  let storageService: StorageService;
  let eventsService: EventsService;
  let documentParserService: DocumentParserService;
  let scraperService: ScraperService;

  const mockCategory: Category = {
    id: 'cat-other',
    name: 'Other',
    key: 'other',
    emoji: '📝',
    isDefault: true,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
            search: jest.fn(),
            getUnreadCounts: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            resolveCategoryForNote: jest
              .fn()
              .mockImplementation(
                (_userId: string, cat?: string, catId?: string) => {
                  const mockCat: Category = {
                    id: catId || (cat === 'Tech' ? 'cat-tech' : 'cat-other'),
                    name: cat || 'Other',
                    emoji: cat === 'Tech' ? '💻' : '📝',
                    key: (cat || 'other').toLowerCase(),
                    isDefault: true,
                    userId: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  return Promise.resolve(mockCat);
                },
              ),
          },
        },
        {
          provide: StorageService,
          useValue: {
            saveFile: jest
              .fn()
              .mockImplementation((file: Express.Multer.File) =>
                Promise.resolve({
                  fileUrl: `/uploads/123-${file?.originalname || 'file.png'}`,
                  filePath: `/mock/uploads/123-${file?.originalname || 'file.png'}`,
                  originalName: file?.originalname || 'file.png',
                  storedFilename: `123-${file?.originalname || 'file.png'}`,
                  size: file?.buffer?.length || 10,
                }),
              ),
          },
        },
        {
          provide: EventsService,
          useValue: {
            emit: jest.fn(),
            subscribe: jest.fn().mockReturnValue(of()),
          },
        },
        {
          provide: DocumentParserService,
          useValue: {
            parseAndStructureFile: jest.fn().mockResolvedValue({
              rawMarkdown: '',
              structuredMarkdown: '',
              sections: [],
            }),
          },
        },
        {
          provide: ScraperService,
          useValue: {
            scrape: jest.fn().mockResolvedValue({
              title: 'Scraped Title',
              content: 'Scraped Content',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repository = module.get<NotesRepository>(NotesRepository);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    storageService = module.get<StorageService>(StorageService);
    eventsService = module.get<EventsService>(EventsService);
    documentParserService = module.get<DocumentParserService>(
      DocumentParserService,
    );
    scraperService = module.get<ScraperService>(ScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(categoriesService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(eventsService).toBeDefined();
    expect(documentParserService).toBeDefined();
    expect(scraperService).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no content, userInput or url provided', async () => {
      await expect(service.create({}, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create note with extracted title and status COMPLETED and return NoteResponseDto', async () => {
      const mockCreatedNote = {
        id: 'note-1',
        url: null,
        userInput: 'My first note\nMore details',
        content: 'My first note\nMore details',
        aiTitle: 'My first note',
        aiSummary: null,
        aiBullets: null,
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        isRead: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreatedNote);

      const result = await service.create(
        { content: 'My first note\nMore details' },
        'user-1',
      );

      expect(jest.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My first note',
          content: 'My first note\nMore details',
          status: Status.COMPLETED,
          userId: 'user-1',
        }),
      );
      expect(result.id).toBe('note-1');
      expect(result.title).toBe('My first note');
      expect(result.category).toBe('Other');
      expect(result.status).toBe(Status.COMPLETED);
    });

    it('should use explicitly provided title when available', async () => {
      const mockTechCategory = {
        ...mockCategory,
        id: 'cat-tech',
        name: 'Tech',
      };
      const mockCreatedNote = {
        id: 'note-2',
        url: null,
        userInput: 'Details here',
        content: 'Details here',
        aiTitle: 'Custom Title',
        aiSummary: null,
        aiBullets: null,
        category: mockTechCategory,
        categoryId: 'cat-tech',
        status: Status.COMPLETED,
        isRead: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreatedNote);

      const result = await service.create(
        {
          title: 'Custom Title',
          userInput: 'Details here',
          category: 'Tech',
        },
        'user-1',
      );

      expect(jest.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Title',
          categoryId: 'cat-tech',
          status: Status.COMPLETED,
        }),
      );
      expect(result.title).toBe('Custom Title');
      expect(result.category).toBe('Tech');
    });
  });

  describe('findAll', () => {
    it('should find all notes and return NoteResponseDto array', async () => {
      const mockNote = {
        id: 'note-1',
        url: null,
        userInput: 'Hello',
        content: 'Hello',
        aiTitle: 'Hello',
        aiSummary: null,
        aiBullets: null,
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        isRead: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findAll as jest.Mock).mockResolvedValue([mockNote]);

      const result = await service.findAll(
        { category: 'Other', limit: 10 },
        'user-1',
      );

      expect(jest.mocked(repository.findAll)).toHaveBeenCalledWith({
        userId: 'user-1',
        category: 'Other',
        limit: 10,
        cursor: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('note-1');
      expect(result[0].category).toBe('Other');
    });
  });

  describe('findOne', () => {
    it('should return note if found and owned by user', async () => {
      const mockNote = {
        id: 'note-1',
        url: null,
        userInput: 'Hello',
        content: 'Hello',
        aiTitle: 'Hello',
        aiSummary: null,
        aiBullets: null,
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        isRead: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findById as jest.Mock).mockResolvedValue(mockNote);

      const result = await service.findOne('note-1', 'user-1');
      expect(result.id).toBe('note-1');
      expect(result.title).toBe('Hello');
    });

    it('should throw NotFoundException if note not found', async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('note-unknown', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if note belongs to another user', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'other-user',
      };

      (repository.findById as jest.Mock).mockResolvedValue(mockNote);

      await expect(service.findOne('note-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark note as read and return NoteResponseDto', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        isRead: false,
        category: mockCategory,
        status: Status.COMPLETED,
        aiTitle: 'Title',
        content: 'Content',
        createdAt: new Date(),
      };
      const mockUpdated = {
        ...mockNote,
        isRead: true,
      };

      (repository.findById as jest.Mock).mockResolvedValue(mockNote);
      (repository.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await service.markAsRead('note-1', 'user-1');
      expect(result.id).toBe('note-1');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if note does not exist', async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.markAsRead('unknown', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should call repository.search with userId and query, returning { notes: NoteResponseDto[] }', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'test content',
          aiTitle: 'test title',
          category: mockCategory,
          status: Status.COMPLETED,
          isRead: false,
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (repository.search as jest.Mock).mockResolvedValue(mockNotes);

      const result = await service.search('keyword', 'user-1');
      expect(jest.mocked(repository.search)).toHaveBeenCalledWith(
        'user-1',
        'keyword',
      );
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].id).toBe('note-1');
    });

    it('should accept SearchNotesDto object', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'test content',
          aiTitle: 'test title',
          category: mockCategory,
          status: Status.COMPLETED,
          isRead: false,
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (repository.search as jest.Mock).mockResolvedValue(mockNotes);

      const result = await service.search({ query: 'keyword' }, 'user-1');
      expect(jest.mocked(repository.search)).toHaveBeenCalledWith(
        'user-1',
        'keyword',
      );
      expect(result.notes).toHaveLength(1);
    });
  });

  describe('createFromFile', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(
        service.createFromFile(
          undefined as unknown as Express.Multer.File,
          {},
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create note from uploaded file with custom title and content using DTO', async () => {
      const mockFile = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('fake image content'),
      } as Express.Multer.File;

      const mockWorkCategory = {
        ...mockCategory,
        id: 'cat-work',
        name: 'Work',
      };

      const mockCreated = {
        id: 'note-file-1',
        aiTitle: 'Custom Screenshot Title',
        content: 'Note description',
        url: '/uploads/123-screenshot.png',
        category: mockWorkCategory,
        categoryId: 'cat-work',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createFromFile(
        mockFile,
        {
          category: 'Work',
          title: 'Custom Screenshot Title',
          content: 'Note description',
        },
        'user-1',
      );

      expect(jest.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Screenshot Title',
          content: 'Note description',
          userId: 'user-1',
        }),
      );
      expect(result.id).toBe('note-file-1');
      expect(result.category).toBe('Work');
    });

    it('should support legacy positional arguments', async () => {
      const mockFile = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('fake image content'),
      } as Express.Multer.File;

      const mockCreated = {
        id: 'note-file-2',
        aiTitle: 'Custom Screenshot Title',
        content: 'Note description',
        url: '/uploads/123-screenshot.png',
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createFromFile(
        mockFile,
        'user-1',
        'Work',
        'Custom Screenshot Title',
        'Note description',
      );

      expect(result.id).toBe('note-file-2');
    });

    it('should integrate parsed markdown into note content when DocumentParserService succeeds', async () => {
      const mockFile = {
        originalname: 'document.pdf',
        buffer: Buffer.from('fake pdf data'),
      } as Express.Multer.File;

      (
        documentParserService.parseAndStructureFile as jest.Mock
      ).mockResolvedValue({
        rawMarkdown: '# PDF Content',
        structuredMarkdown: '## Header\n\nStructured body',
        sections: [
          { heading: 'Header', content: 'Structured body', keywords: [] },
        ],
      });

      const mockCreated = {
        id: 'note-file-parsed',
        title: 'document.pdf',
        content: '## Header\n\nStructured body',
        url: '/uploads/123-document.pdf',
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createFromFile(mockFile, {}, 'user-1');

      expect(documentParserService.parseAndStructureFile).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '## Header\n\nStructured body',
        }),
      );
      expect(result.id).toBe('note-file-parsed');
    });

    it('should fallback gracefully to file link when DocumentParserService throws error', async () => {
      const mockFile = {
        originalname: 'corrupt.pdf',
        buffer: Buffer.from('corrupt data'),
      } as Express.Multer.File;

      (
        documentParserService.parseAndStructureFile as jest.Mock
      ).mockRejectedValue(new Error('Corrupt file format'));

      const mockCreated = {
        id: 'note-fallback',
        title: 'corrupt.pdf',
        content: '[Tập tin đính kèm: corrupt.pdf](/uploads/123-corrupt.pdf)',
        url: '/uploads/123-corrupt.pdf',
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createFromFile(mockFile, {}, 'user-1');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '[Tập tin đính kèm: corrupt.pdf](/uploads/123-corrupt.pdf)',
        }),
      );
      expect(result.id).toBe('note-fallback');
    });
  });

  describe('scraper integration in create', () => {
    it('should scrape URL and use scraped title and content', async () => {
      (scraperService.scrape as jest.Mock).mockResolvedValue({
        title: 'Scraped Article Title',
        content: 'Scraped article body text',
      });

      const mockCreated = {
        id: 'note-scraped-1',
        title: 'Scraped Article Title',
        aiTitle: 'Scraped Article Title',
        content: 'Scraped article body text',
        url: 'https://example.com/article',
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.create(
        { url: 'https://example.com/article' },
        'user-1',
      );

      expect(scraperService.scrape).toHaveBeenCalledWith(
        'https://example.com/article',
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Scraped Article Title',
          content: 'Scraped article body text',
        }),
      );
      expect(eventsService.emit).toHaveBeenCalled();
      expect(result.title).toBe('Scraped Article Title');
    });

    it('should gracefully fallback to raw URL when scraper fails', async () => {
      (scraperService.scrape as jest.Mock).mockRejectedValue(
        new Error('Network timeout'),
      );

      const mockCreated = {
        id: 'note-scraped-fallback',
        title: 'https://broken.com',
        content: 'https://broken.com',
        url: 'https://broken.com',
        category: mockCategory,
        categoryId: 'cat-other',
        status: Status.COMPLETED,
        userId: 'user-1',
        isRead: false,
        createdAt: new Date(),
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.create(
        { url: 'https://broken.com' },
        'user-1',
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'https://broken.com',
        }),
      );
      expect(result.id).toBe('note-scraped-fallback');
    });
  });

  describe('getUnreadCounts', () => {
    it('should delegate to repository.getUnreadCounts', async () => {
      (repository.getUnreadCounts as jest.Mock).mockResolvedValue({
        Tech: 3,
        Other: 1,
      });

      const result = await service.getUnreadCounts('user-1');
      expect(result).toEqual({ Tech: 3, Other: 1 });
      expect(repository.getUnreadCounts).toHaveBeenCalledWith('user-1');
    });
  });
});
