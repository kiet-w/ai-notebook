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
  createRefreshToken(data: {
    tokenHash: string;
    family: string;
    ip: string;
    userAgent: string;
    expiresAt: Date;
    userId: string;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshTokenWithUser(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  revokeTokenFamily(family: string) {
    return this.prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true },
    });
  }

  revokeAndReplaceToken(id: string, replacedByTokenId: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, replacedByTokenId },
    });
  }

  revokeToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }
}
