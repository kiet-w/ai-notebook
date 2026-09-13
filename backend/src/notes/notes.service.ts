import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note, Status, Category } from '@prisma/client';
import { Subject, Observable } from 'rxjs';
import { NoteUpdatedEvent } from './types/sse-event.type';
import { extractBullets } from './utils/note.utils';
import { promises as fs } from 'fs';
import { join, basename } from 'path';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);
  private readonly events$ = new Subject<NoteUpdatedEvent>();

  constructor(private readonly repository: NotesRepository) {}

  getEventStream(): Observable<NoteUpdatedEvent> {
    return this.events$.asObservable();
  }

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const url = createNoteDto.url?.trim();
    const rawContent =
      createNoteDto.content?.trim() || createNoteDto.userInput?.trim();
    const category = createNoteDto.category ?? Category.OTHER;

    if (!url && !rawContent) {
      throw new BadRequestException(
        'At least one of content, userInput or url must be provided',
      );
    }

    const content = rawContent || url || '';

    let title = createNoteDto.title?.trim();
    if (!title) {
      const firstLine = content.split('\n')[0]?.trim();
      title = firstLine ? firstLine.slice(0, 80) : 'Untitled';
    }

    const note = await this.repository.create({
      title,
      content,
      userInput: rawContent,
      url,
      category,
      status: Status.COMPLETED,
      userId,
    });

    this.events$.next(this.toNoteUpdatedEvent(note));
    return note;
  }

  async findAll(
    params: {
      userId: string;
      category?: Category;
      limit?: number;
      cursor?: string;
    } = { userId: '' },
  ): Promise<Note[]> {
    return this.repository.findAll(params);
  }

  async getUnreadCounts(userId: string): Promise<Record<Category, number>> {
    return this.repository.getUnreadCounts(userId);
  }

  async findOne(id: string, userId: string): Promise<Note | null> {
    const note = await this.repository.findById(id);
    return note?.userId === userId ? note : null;
  }

  private toNoteUpdatedEvent(note: Note): NoteUpdatedEvent {
    const aiBullets = extractBullets(note.aiBullets);

    return {
      id: note.id,
      userId: note.userId,
      status: note.status as 'COMPLETED' | 'FAILED',
      aiTitle: note.aiTitle,
      category: note.category,
      aiSummary: note.aiSummary,
      aiBullets,
      content: note.content,
      isRead: note.isRead,
      createdAt: note.createdAt,
    };
  }

  async markAsRead(id: string, userId: string): Promise<Note> {
    const note = await this.findOne(id, userId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    const updatedNote = await this.repository.update(id, { isRead: true });
    this.events$.next(this.toNoteUpdatedEvent(updatedNote));
    return updatedNote;
  }

  async createFromFile(
    file: Express.Multer.File,
    userId: string,
    category?: Category,
    title?: string,
    content?: string,
  ): Promise<Note> {
    const filename = basename(file.originalname);
    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

    const timestamp = Date.now();
    const storedFilename = `${timestamp}-${filename}`;
    const fileUrl = `/uploads/${storedFilename}`;
    const filePath = join(uploadsDir, storedFilename);
    await fs.writeFile(filePath, file.buffer);

    const noteTitle = title?.trim() || filename;
    const noteContent =
      content?.trim() || `[Tập tin đính kèm: ${filename}](${fileUrl})`;

    const note = await this.repository.create({
      title: noteTitle,
      content: noteContent,
      userInput: content?.trim() || filename,
      url: fileUrl,
      category: category ?? Category.OTHER,
      status: Status.COMPLETED,
      userId,
    });

    this.events$.next(this.toNoteUpdatedEvent(note));
    return note;
  }

  async search(query: string, userId: string): Promise<Note[]> {
    this.logger.log(`Searching notes for query: ${query}`);
    return this.repository.search(userId, query);
  }
}
