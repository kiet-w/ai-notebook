/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { NotesRepository } from './repositories/notes.repository';
import { Category, Status } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('NotesService', () => {
  let service: NotesService;
  let repository: NotesRepository;

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
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repository = module.get<NotesRepository>(NotesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no content, userInput or url provided', async () => {
      await expect(service.create({}, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create note with extracted title and status COMPLETED', async () => {
      const mockCreatedNote = {
        id: 'note-1',
        url: null,
        userInput: 'My first note\nMore details',
        content: 'My first note\nMore details',
        aiTitle: 'My first note',
        aiSummary: null,
        aiBullets: null,
        category: Category.OTHER,
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
      expect(result).toEqual(mockCreatedNote);
    });

    it('should use explicitly provided title when available', async () => {
      const mockCreatedNote = {
        id: 'note-2',
        url: null,
        userInput: 'Details here',
        content: 'Details here',
        aiTitle: 'Custom Title',
        aiSummary: null,
        aiBullets: null,
        category: Category.TECH,
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
          category: Category.TECH,
        },
        'user-1',
      );

      expect(jest.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Title',
          category: Category.TECH,
          status: Status.COMPLETED,
        }),
      );
      expect(result.aiTitle).toEqual('Custom Title');
    });
  });

  describe('search', () => {
    it('should call repository.search with userId and query', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'test content',
          aiTitle: 'test title',
        },
      ];
      (repository.search as jest.Mock).mockResolvedValue(mockNotes);

      const result = await service.search('keyword', 'user-1');
      expect(jest.mocked(repository.search)).toHaveBeenCalledWith(
        'user-1',
        'keyword',
      );
      expect(result).toEqual(mockNotes);
    });
  });

  describe('createFromFile', () => {
    it('should create note from uploaded file with custom title and content', async () => {
      const mockFile = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('fake image content'),
      } as Express.Multer.File;

      const mockCreated = {
        id: 'note-file-1',
        aiTitle: 'Custom Screenshot Title',
        content: 'Note description',
        url: '/uploads/123-screenshot.png',
        category: Category.WORK,
        status: Status.COMPLETED,
        userId: 'user-1',
      };

      (repository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createFromFile(
        mockFile,
        'user-1',
        Category.WORK,
        'Custom Screenshot Title',
        'Note description',
      );

      expect(jest.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Screenshot Title',
          content: 'Note description',
          category: Category.WORK,
          userId: 'user-1',
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });
});
