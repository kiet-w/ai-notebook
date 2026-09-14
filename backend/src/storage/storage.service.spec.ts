import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mkdirSpy: jest.SpyInstance;
  let writeFileSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);

    mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    writeFileSpy = jest
      .spyOn(fs.promises, 'writeFile')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveFile', () => {
    it('should successfully save a valid file and return StoredFileResult', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('hello world'),
        stream: Readable.from([Buffer.from('hello world')]),
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.saveFile(mockFile);

      expect(mkdirSpy).toHaveBeenCalledTimes(1);
      expect(mkdirSpy).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );

      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test document.pdf'),
        mockFile.buffer,
      );

      expect(result.originalName).toBe('test document.pdf');
      expect(result.size).toBe(1024);
      expect(result.fileUrl).toMatch(/^\/uploads\/\d+-test document\.pdf$/);
      expect(result.storedFilename).toMatch(/^\d+-test document\.pdf$/);
      expect(result.filePath).toContain(result.storedFilename);
    });

    it('should fallback to buffer length if file.size is undefined', async () => {
      const buffer = Buffer.from('abc');
      const mockFile = {
        originalname: 'note.txt',
        buffer,
      } as Express.Multer.File;

      const result = await service.saveFile(mockFile);

      expect(result.size).toBe(3);
      expect(result.originalName).toBe('note.txt');
    });

    it('should fallback to unknown if originalname is missing', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.saveFile(mockFile);

      expect(result.originalName).toBe('unknown');
      expect(result.storedFilename).toMatch(/^\d+-unknown$/);
    });

    it('should throw BadRequestException if file is null or undefined', async () => {
      await expect(
        service.saveFile(null as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.saveFile(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file buffer is null or empty', async () => {
      const emptyBufferFile = {
        originalname: 'empty.txt',
        buffer: Buffer.alloc(0),
        size: 0,
      } as Express.Multer.File;

      await expect(service.saveFile(emptyBufferFile)).rejects.toThrow(
        BadRequestException,
      );

      const noBufferFile = {
        originalname: 'empty.txt',
      } as Express.Multer.File;

      await expect(service.saveFile(noBufferFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file size is 0', async () => {
      const zeroSizeFile = {
        originalname: 'zero.txt',
        buffer: Buffer.from('abc'),
        size: 0,
      } as Express.Multer.File;

      await expect(service.saveFile(zeroSizeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate filesystem error if mkdir fails', async () => {
      mkdirSpy.mockRejectedValueOnce(new Error('EACCES: permission denied'));

      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('content'),
        size: 7,
      } as Express.Multer.File;

      await expect(service.saveFile(mockFile)).rejects.toThrow(
        'EACCES: permission denied',
      );
    });

    it('should propagate filesystem error if writeFile fails', async () => {
      writeFileSpy.mockRejectedValueOnce(new Error('ENOSPC: no space left'));

      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('content'),
        size: 7,
      } as Express.Multer.File;

      await expect(service.saveFile(mockFile)).rejects.toThrow(
        'ENOSPC: no space left',
      );
    });
  });
});
