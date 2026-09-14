/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from '../notes.controller';
import { NotesService } from '../notes.service';
import { JwtService } from '@nestjs/jwt';
import { NoteResponseDto } from '../dto/note-response.dto';
import { Status } from '@prisma/client';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockAuthReq = {
    user: { id: 'test-user-id', role: 'user' },
  } as unknown as Parameters<typeof controller.create>[1];

  const mockResponseDto: NoteResponseDto = {
    id: '123',
    url: null,
    userInput: 'Hello',
    title: 'Hello',
    aiTitle: 'Hello',
    aiSummary: null,
    aiBullets: null,
    content: 'Hello',
    category: 'Other',
    categoryId: 'cat-1',
    status: Status.COMPLETED,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: {
            create: jest.fn(),
            uploadFile: jest.fn(),
            createFromFile: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            markAsRead: jest.fn(),
            search: jest.fn(),
            getUnreadCounts: jest.fn(),
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
    it('should delegate to service.create and return the result', async () => {
      (service.create as jest.Mock).mockResolvedValue(mockResponseDto);

      const dto = { content: 'Hello' };
      const result = await controller.create(dto, mockAuthReq);

      expect(jest.mocked(service.create)).toHaveBeenCalledWith(
        dto,
        'test-user-id',
      );
      expect(result).toBe(mockResponseDto);
    });
  });

  describe('uploadFile', () => {
    it('should delegate to service.createFromFile and return the result', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('PDF CONTENT'),
        size: 11,
      } as Express.Multer.File;

      const uploadDto = { category: 'Tech' };
      (service.createFromFile as jest.Mock).mockResolvedValue(mockResponseDto);

      const result = await controller.uploadFile(
        mockFile,
        uploadDto,
        mockAuthReq,
      );

      expect(jest.mocked(service.createFromFile)).toHaveBeenCalledWith(
        mockFile,
        uploadDto,
        'test-user-id',
      );
      expect(result).toBe(mockResponseDto);
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAll and return the result', async () => {
      const query = { category: 'Tech', limit: 10 };
      (service.findAll as jest.Mock).mockResolvedValue([mockResponseDto]);

      const result = await controller.findAll(query, mockAuthReq);

      expect(jest.mocked(service.findAll)).toHaveBeenCalledWith(
        query,
        'test-user-id',
      );
      expect(result).toEqual([mockResponseDto]);
    });
  });

  describe('getUnreadCounts', () => {
    it('should delegate to service.getUnreadCounts and return counts', async () => {
      const mockCounts = { Tech: 2, Other: 1 };
      (service.getUnreadCounts as jest.Mock).mockResolvedValue(mockCounts);

      const result = await controller.getUnreadCounts(mockAuthReq);

      expect(jest.mocked(service.getUnreadCounts)).toHaveBeenCalledWith(
        'test-user-id',
      );
      expect(result).toEqual(mockCounts);
    });
  });

  describe('search', () => {
    it('should delegate to service.search and return matching notes object', async () => {
      const searchDto = { query: 'query' };
      const searchResult = { notes: [mockResponseDto] };
      (service.search as jest.Mock).mockResolvedValue(searchResult);

      const result = await controller.search(searchDto, mockAuthReq);

      expect(jest.mocked(service.search)).toHaveBeenCalledWith(
        searchDto,
        'test-user-id',
      );
      expect(result).toBe(searchResult);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne and return the note', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(mockResponseDto);

      const result = await controller.findOne('123', mockAuthReq);

      expect(jest.mocked(service.findOne)).toHaveBeenCalledWith(
        '123',
        'test-user-id',
      );
      expect(result).toBe(mockResponseDto);
    });
  });

  describe('markAsRead', () => {
    it('should delegate to service.markAsRead and return updated note', async () => {
      const updatedDto = { ...mockResponseDto, isRead: true };
      (service.markAsRead as jest.Mock).mockResolvedValue(updatedDto);

      const result = await controller.markAsRead('123', mockAuthReq);

      expect(jest.mocked(service.markAsRead)).toHaveBeenCalledWith(
        '123',
        'test-user-id',
      );
      expect(result).toBe(updatedDto);
    });
  });
});
