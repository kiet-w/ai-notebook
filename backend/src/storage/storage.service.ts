import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { basename, join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { StoredFileResult } from './types/storage.type';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string | null = null;
  private readonly publicUrl: string | null = null;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucketName = bucketName;
      this.publicUrl = publicUrl ? publicUrl.replace(/\/$/, '') : null;
      this.logger.log(
        `Cloudflare R2 Storage initialized for bucket: ${bucketName}`,
      );
    } else {
      this.logger.log(
        'Cloudflare R2 not configured. Using local disk storage fallback.',
      );
    }
  }

  async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    if (!file || !file.buffer || file.buffer.length === 0 || file.size === 0) {
      throw new BadRequestException('File is empty or not provided');
    }

    await fs.promises.mkdir(this.uploadDir, { recursive: true });

    const originalName = file.originalname || 'unknown';
    const safeBaseName = basename(originalName);
    const storedFilename = `${Date.now()}-${safeBaseName}`;
    const filePath = join(this.uploadDir, storedFilename);
    let fileUrl = `/uploads/${storedFilename}`;

    // Luôn lưu bản sao local để parser (PDF, Docx, Text) có thể đọc và trích xuất nội dung
    await fs.promises.writeFile(filePath, file.buffer);

    // Nếu Cloudflare R2 được cấu hình, upload lên Cloudflare R2 để lưu trữ vĩnh viễn
    if (this.s3Client && this.bucketName) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: storedFilename,
            Body: file.buffer,
            ContentType: file.mimetype || 'application/octet-stream',
          }),
        );

        if (this.publicUrl) {
          fileUrl = `${this.publicUrl}/${storedFilename}`;
        }
        this.logger.log(`Uploaded file ${storedFilename} to Cloudflare R2`);
      } catch (err) {
        this.logger.error(
          `Failed to upload ${storedFilename} to Cloudflare R2: ${
            err instanceof Error ? err.message : String(err)
          }. Falling back to local storage URL.`,
        );
      }
    }

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
