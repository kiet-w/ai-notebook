import { Exclude, Expose, Type } from 'class-transformer';
import { IsString, IsEmail, IsDate } from 'class-validator';

@Exclude()
export class ResponseUserDto {
  @Expose()
  @IsString()
  id!: string;

  @Expose()
  @IsString()
  user!: string;

  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @Expose()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
