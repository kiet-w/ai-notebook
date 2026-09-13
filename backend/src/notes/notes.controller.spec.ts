import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { MessageEvent } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

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

  describe('uploadFile', () => {
    it('should upload a file and return the processing note', async () => {
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
        url: null,
        userInput: 'Processing file: test.pdf',
        aiTitle: null,
        aiSummary: null,
        aiBullets: null,
        category: 'OTHER',
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (service.createFromFile as jest.Mock).mockResolvedValue(mockNote);

      const result = await controller.uploadFile(
        mockFile,
        undefined,
        undefined,
        {
          user: { id: 'test-user-id', role: 'user' },
        } as unknown as Parameters<typeof controller.uploadFile>[3],
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createFromFile).toHaveBeenCalledWith(
        mockFile,
        'test-user-id',
        undefined,
        undefined,
      );
      expect(result.id).toBe('123');
      expect(result.userInput).toBe('Processing file: test.pdf');
    });

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(
        controller.uploadFile(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          null as any,
          undefined,
          undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          {
            user: { id: 'test-user-id', role: 'user' },
          } as any,
        ),
      ).rejects.toThrow('No file uploaded');
    });
  });
});
