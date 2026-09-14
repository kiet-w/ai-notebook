import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Note, Prisma, Status, Category } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';

export type NoteWithCategory = Note & {
  category?: Category | null;
};

@Injectable()
export class NotesRepository extends BaseRepository<
  NoteWithCategory,
  Prisma.NoteCreateInput,
  Prisma.NoteUpdateInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.note);
  }

  override async create(data: {
    title?: string;
    content?: string;
    url?: string;
    userInput?: string;
    categoryId?: string;
    status?: Status;
    userId: string;
  }): Promise<NoteWithCategory> {
    return this.prisma.note.create({
      data: {
        url: data.url,
        userInput: data.userInput,
        content: data.content ?? data.userInput,
        aiTitle: data.title,
        status: data.status ?? Status.COMPLETED,
        user: { connect: { id: data.userId } },
        ...(data.categoryId
          ? { category: { connect: { id: data.categoryId } } }
          : {}),
      },
      include: { category: true },
    });
  }

  override async findById(id: string): Promise<NoteWithCategory | null> {
    return this.prisma.note.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  override async update(
    id: string,
    data: Prisma.NoteUpdateInput,
  ): Promise<NoteWithCategory> {
    return this.prisma.note.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  override async findAll(params: {
    userId: string;
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<NoteWithCategory[]> {
    const where: Prisma.NoteWhereInput = { userId: params.userId };
    if (params.category) {
      const cat = params.category.trim();
      where.OR = [
        { categoryId: cat },
        { category: { name: { equals: cat, mode: 'insensitive' as const } } },
        {
          category: {
            key: { equals: cat.toLowerCase(), mode: 'insensitive' as const },
          },
        },
      ];
    }
    const limit = params.limit ?? 25;
    const queryParams: Prisma.NoteFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { category: true },
    };

    if (params.cursor) {
      queryParams.cursor = { id: params.cursor };
      queryParams.skip = 1;
    }

    return this.prisma.note.findMany(queryParams);
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    const notes = await this.prisma.note.findMany({
      where: { isRead: false, userId },
      select: {
        category: {
          select: { name: true },
        },
      },
    });
    const result: Record<string, number> = {};
    for (const note of notes) {
      const catName = note.category?.name || 'Other';
      result[catName] = (result[catName] || 0) + 1;
    }
    return result;
  }

  async updateStatus(id: string, status: Status): Promise<NoteWithCategory> {
    return this.update(id, { status });
  }

  async search(
    userId: string,
    query: string,
    limit = 20,
  ): Promise<NoteWithCategory[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return this.prisma.note.findMany({
      where: {
        userId,
        OR: [
          { aiTitle: { contains: trimmed, mode: 'insensitive' } },
          { content: { contains: trimmed, mode: 'insensitive' } },
          { userInput: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
