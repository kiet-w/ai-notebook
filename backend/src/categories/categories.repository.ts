import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class CategoriesRepository extends BaseRepository<
  Category,
  Prisma.CategoryCreateInput,
  Prisma.CategoryUpdateInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.category);
  }

  async findAvailableForUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findByNameForUser(
    name: string,
    userId?: string,
  ): Promise<Category | null> {
    const trimmed = name.trim();
    return this.prisma.category.findFirst({
      where: {
        OR: [
          {
            isDefault: true,
            name: { equals: trimmed, mode: 'insensitive' as const },
          },
          ...(userId
            ? [
                {
                  userId,
                  name: { equals: trimmed, mode: 'insensitive' as const },
                },
              ]
            : []),
        ],
      },
    });
  }

  async findByKey(key: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        key: { equals: key.toLowerCase(), mode: 'insensitive' as const },
      },
    });
  }

  async countDefaultCategories(): Promise<number> {
    return this.prisma.category.count({
      where: { isDefault: true },
    });
  }
}
