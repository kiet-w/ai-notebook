import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { join } from 'path';
import * as fs from 'fs';

@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const localPath = join(this.storageService.getUploadDir(), filename);

    // 1. Nếu file đã có sẵn trên ổ đĩa local, trả về trực tiếp
    if (fs.existsSync(localPath)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(localPath);
      return;
    }

    // 2. Nếu file không có trên ổ đĩa (do Render vừa restart/redeploy), khôi phục từ DB
    const stored = await this.storageService.getFileFromDb(filename);
    if (!stored) {
      throw new NotFoundException('File not found');
    }

    res.setHeader(
      'Content-Type',
      stored.mimeType || 'application/octet-stream',
    );
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(stored.data);
  }
}
