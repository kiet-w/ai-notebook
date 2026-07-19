import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, IsEnum, IsIn } from 'class-validator';
import { Category } from '@prisma/client';

export class CreateNoteDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsUrl()
  url?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsString()
  userInput?: string;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsIn(['short', 'medium', 'long'])
  detailLevel?: 'short' | 'medium' | 'long';
}
