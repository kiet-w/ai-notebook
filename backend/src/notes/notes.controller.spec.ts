/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { JwtService } from '@nestjs/jwt';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockAuthReq = {
    user: { id: 'test-user-id', role: 'user' },
  } as unknown as Parameters<typeof controller.create>[1];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: {
            getEventStream: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            createFromFile: jest.fn(),
            search: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a note directly and return NoteResponseDto with COMPLETED status', async () => {
      const mockNote = {
        id: '123',
        url: null,
        userInput: 'Hello',
        aiTitle: 'Hello',
        aiSummary: null,
        aiBullets: null,
        content: 'Hello',
        category: 'OTHER' as const,
        status: 'COMPLETED' as const,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (service.create as jest.Mock).mockResolvedValue(mockNote);

      const result = await controller.create({ content: 'Hello' }, mockAuthReq);

      expect(jest.mocked(service.create)).toHaveBeenCalledWith(
        { content: 'Hello' },
        'test-user-id',
      );
      expect(result.id).toBe('123');
      expect(result.title).toBe('Hello');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('search', () => {
    it('should search notes and return matching notes array', async () => {
      const mockNote = {
        id: '123',
        url: null,
        userInput: 'Note with query',
        aiTitle: 'Note with query',
        aiSummary: null,
        aiBullets: null,
        content: 'Note with query',
        category: 'OTHER' as const,
        status: 'COMPLETED' as const,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (service.search as jest.Mock).mockResolvedValue([mockNote]);

      const result = await controller.search({ query: 'query' }, mockAuthReq);

      expect(jest.mocked(service.search)).toHaveBeenCalledWith(
        'query',
        'test-user-id',
      );
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].id).toBe('123');
    });
  });

  describe('uploadFile', () => {
    it('should upload a file and return the completed note', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('PDF CONTENT'),
        size: 11,
      } as Express.Multer.File;

      const mockNote = {
        id: '123',
        url: '/uploads/test.pdf',
        userInput: 'test.pdf',
        aiTitle: 'test.pdf',
        aiSummary: null,
        aiBullets: null,
        content: 'Tập tin đính kèm: test.pdf',
        category: 'OTHER' as const,
        status: 'COMPLETED' as const,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (service.createFromFile as jest.Mock).mockResolvedValue(mockNote);

      const result = await controller.uploadFile(mockFile, {}, mockAuthReq);

      expect(jest.mocked(service.createFromFile)).toHaveBeenCalledWith(
        mockFile,
        'test-user-id',
        undefined,
        undefined,
        undefined,
      );
      expect(result.id).toBe('123');
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(
        controller.uploadFile(
          undefined as unknown as Express.Multer.File,
          {},
          mockAuthReq,
        ),
      ).rejects.toThrow('No file uploaded');
    });
  });
});
