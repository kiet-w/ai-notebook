import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, IsEnum } from 'class-validator';
import { Category } from '@prisma/client';

export class CreateNoteDto {
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsUrl()
  url?: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsString()
  userInput?: string;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}
