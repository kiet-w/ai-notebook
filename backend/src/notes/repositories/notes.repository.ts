import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Note, Prisma, Status, Category } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class NotesRepository extends BaseRepository<Note, Prisma.NoteCreateInput, Prisma.NoteUpdateInput> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.note);
  }

  async create(data: { url?: string; userInput?: string; category?: Category }): Promise<Note> {
    return super.create({
      url: data.url,
      userInput: data.userInput,
      category: data.category,
      status: Status.PROCESSING,
    });
  }

  async findAll(): Promise<Note[]> {
    return super.findAll({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: Status): Promise<Note> {
    return super.update(id, { status });
  }
}
