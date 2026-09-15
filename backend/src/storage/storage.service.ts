import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import * as fs from 'fs';
import { basename, join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { StoredFileResult } from './types/storage.type';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string | null = null;
  private readonly publicUrl: string | null = null;
  private readonly supabaseUrl: string | null = null;
  private readonly supabaseKey: string | null = null;

  constructor(@Optional() private readonly prisma?: PrismaService) {
    // 1. Cấu hình Supabase Storage qua REST API (Đơn giản nhất, chỉ cần Service Role Key)
    const rawSupabaseUrl =
      process.env.SUPABASE_URL ||
      (process.env.DATABASE_URL?.match(/postgres\.([a-z0-9]+):/)?.[1]
        ? `https://${process.env.DATABASE_URL.match(/postgres\.([a-z0-9]+):/)?.[1]}.supabase.co`
        : undefined);
    const rawSupabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_KEY;

    if (rawSupabaseUrl && rawSupabaseKey) {
      this.supabaseUrl = rawSupabaseUrl.replace(/\/+$/, '');
      this.supabaseKey = rawSupabaseKey;
      this.bucketName = process.env.STORAGE_BUCKET_NAME || 'notes';
      this.logger.log(
        `Supabase Storage REST API initialized for bucket: ${this.bucketName}`,
      );
    }

    // 2. Cấu hình S3-compatible (Cloudflare R2 hoặc Supabase S3)
    const endpoint =
      process.env.STORAGE_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined);
    const accessKeyId =
      process.env.STORAGE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.STORAGE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const bucketName =
      process.env.STORAGE_BUCKET_NAME || process.env.R2_BUCKET_NAME;
    const publicUrl =
      process.env.STORAGE_PUBLIC_URL || process.env.R2_PUBLIC_URL;
    const region = process.env.STORAGE_REGION || 'auto';

    if (endpoint && accessKeyId && secretAccessKey && bucketName) {
      this.s3Client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucketName = bucketName;
      this.publicUrl = publicUrl ? publicUrl.replace(/\/$/, '') : null;
      this.logger.log(
        `Cloud Object Storage (S3 / R2) initialized for bucket: ${bucketName}`,
      );
    } else if (!this.supabaseKey) {
      this.logger.log(
        'Cloud Storage Bucket not configured. Using database backup + local disk storage.',
      );
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  async getFileFromDb(filename: string) {
    if (!this.prisma) return null;
    try {
      const stored = await this.prisma.storedFile.findUnique({
        where: { filename },
      });
      if (stored) {
        // Caching lại vào local disk để phục vụ các lần tiếp theo cực nhanh
        try {
          const localPath = join(this.uploadDir, filename);
          await fs.promises.mkdir(this.uploadDir, { recursive: true });
          await fs.promises.writeFile(localPath, stored.data);
        } catch (cacheErr) {
          this.logger.debug(
            `Could not write disk cache for ${filename}: ${String(cacheErr)}`,
          );
        }
      }
      return stored;
    } catch (err) {
      this.logger.warn(`Failed to fetch file ${filename} from DB: ${err}`);
      return null;
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

    let isUploadedToBucket = false;

    // 1. Ưu tiên Upload lên Supabase Storage qua REST API (Chuẩn nhất, không tốn DB)
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const bucket = this.bucketName || 'notes';
        const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${bucket}/${storedFilename}`;
        await axios.post(uploadUrl, file.buffer, {
          headers: {
            Authorization: `Bearer ${this.supabaseKey}`,
            'Content-Type': file.mimetype || 'application/octet-stream',
            'x-upsert': 'true',
          },
        });
        fileUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${storedFilename}`;
        isUploadedToBucket = true;
        this.logger.log(
          `Uploaded file ${storedFilename} to Supabase Storage Bucket`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to upload ${storedFilename} to Supabase Storage: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // 2. Nếu có cấu hình S3 / Cloudflare R2
    if (!isUploadedToBucket && this.s3Client && this.bucketName) {
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
        isUploadedToBucket = true;
        this.logger.log(`Uploaded file ${storedFilename} to S3/R2 Bucket`);
      } catch (err) {
        this.logger.error(
          `Failed to upload ${storedFilename} to S3/R2: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // 3. Fallback: Nếu CHƯA cấu hình bất kỳ bucket nào, lưu tạm vào DB để tránh mất file trên Render
    if (!isUploadedToBucket && this.prisma) {
      try {
        await this.prisma.storedFile.upsert({
          where: { filename: storedFilename },
          create: {
            filename: storedFilename,
            mimeType: file.mimetype || 'application/octet-stream',
            size: file.size || file.buffer.length,
            data: new Uint8Array(file.buffer),
          },
          update: {
            data: new Uint8Array(file.buffer),
            size: file.size || file.buffer.length,
          },
        });
        this.logger.log(
          `No bucket configured. Backed up file ${storedFilename} to Database fallback`,
        );
      } catch (err) {
        this.logger.warn(`Could not save file to DB backup: ${err}`);
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
