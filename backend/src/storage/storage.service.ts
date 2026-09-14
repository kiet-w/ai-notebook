import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { basename, join } from 'path';
import { StoredFileResult } from './types/storage.type';

@Injectable()
export class StorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    if (!file || !file.buffer || file.buffer.length === 0 || file.size === 0) {
      throw new BadRequestException('File is empty or not provided');
    }

    await fs.promises.mkdir(this.uploadDir, { recursive: true });

    const originalName = file.originalname || 'unknown';
    const safeBaseName = basename(originalName);
    const storedFilename = `${Date.now()}-${safeBaseName}`;
    const filePath = join(this.uploadDir, storedFilename);
    const fileUrl = `/uploads/${storedFilename}`;

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      fileUrl,
      filePath,
      originalName,
      storedFilename,
      size:
        typeof file.size === 'number' && file.size > 0
          ? file.size
          : file.buffer.length,
    };
  }
}
