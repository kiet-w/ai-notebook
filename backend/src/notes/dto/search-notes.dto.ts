import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchNotesDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: 'Search query must not be empty' })
  query!: string;
}
