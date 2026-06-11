import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { of } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

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
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('events', () => {
    it('should return an observable of MessageEvent', (done) => {
      const mockEvent = {
        id: '1',
        status: 'COMPLETED',
        aiTitle: 'Title',
        category: 'OTHER',
        aiSummary: 'Summary',
        aiBullets: ['One'],
      };
      (service.getEventStream as jest.Mock).mockReturnValue(of(mockEvent));

      controller.events().subscribe({
        next: (messageEvent) => {
          expect(messageEvent).toEqual({
            type: 'note-updated',
            data: mockEvent,
          });
          done();
        },
      });
    });
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

      const result = await controller.uploadFile(mockFile);

      expect(service.createFromFile).toHaveBeenCalledWith(mockFile, undefined);
      expect(result.id).toBe('123');
      expect(result.userInput).toBe('Processing file: test.pdf');
    });

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(controller.uploadFile(null as any)).rejects.toThrow(
        'No file uploaded',
      );
    });
  });
});
