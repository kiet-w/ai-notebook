import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Note, Prisma, Status, Category } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class NotesRepository extends BaseRepository<
  Note,
  Prisma.NoteCreateInput,
  Prisma.NoteUpdateInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.note);
  }

  async create(data: {
    title?: string;
    content?: string;
    url?: string;
    userInput?: string;
    category?: Category;
    status?: Status;
    userId: string;
  }): Promise<Note> {
    return super.create({
      url: data.url,
      userInput: data.userInput,
      content: data.content ?? data.userInput,
      aiTitle: data.title,
      category: data.category ?? Category.OTHER,
      status: data.status ?? Status.COMPLETED,
      user: { connect: { id: data.userId } },
    });
  }

  async findAll(params: {
    userId: string;
    category?: Category;
    limit?: number;
    cursor?: string;
    selectFullFields?: boolean;
  }): Promise<Note[]> {
    const where: Prisma.NoteWhereInput = { userId: params.userId };
    if (params.category) where.category = params.category;
    const limit = params.limit ?? 25;
    const queryParams: Prisma.NoteFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    };

    if (!params.selectFullFields) {
      queryParams.select = {
        id: true,
        url: true,
        userInput: true,
        content: true,
        aiTitle: true,
        aiSummary: true,
        category: true,
        status: true,
        isRead: true,
        createdAt: true,
      };
    }

    if (params.cursor) {
      queryParams.cursor = { id: params.cursor };
      queryParams.skip = 1;
    }

    return super.findAll(queryParams);
  }

  async getUnreadCounts(userId: string): Promise<Record<Category, number>> {
    const counts = await this.prisma.note.groupBy({
      by: ['category'],
      where: { isRead: false, userId },
      _count: { _all: true },
    });
    const result = {} as Record<Category, number>;
    counts.forEach((c) => {
      result[c.category] = c._count._all;
    });
    return result;
  }

  async updateStatus(id: string, status: Status): Promise<Note> {
    return super.update(id, { status });
  }

  async search(userId: string, query: string, limit = 20): Promise<Note[]> {
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
