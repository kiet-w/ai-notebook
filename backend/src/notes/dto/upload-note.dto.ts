import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Category } from '@prisma/client';

export class UploadNoteDto {
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
