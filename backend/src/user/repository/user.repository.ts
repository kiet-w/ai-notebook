import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly prisma: PrismaService) {
    // ponytail: delegate trực tiếp model prisma vào BaseRepository
    super(prisma.user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(user: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { user } });
  }
  createRefreshToken(data: any) {
    return this.prisma.refreshToken.create({ data });
  }
}

