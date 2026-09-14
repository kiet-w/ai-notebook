import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  NotesRepository,
  NoteWithCategory,
} from './repository/notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UploadNoteDto } from './dto/upload-note.dto';
import { FindAllNotesQueryDto } from './dto/find-all-notes-query.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { NoteMapper } from './mappers/note.mapper';
import { Status } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoteUpdatedEvent } from './types/sse-event.type';
import { extractBullets } from './utils/note.utils';
import { CategoriesService } from '../categories/categories.service';
import { StorageService } from '../storage/storage.service';
import { EventsService } from '../events/events.service';
import { DocumentParserService } from '../parser/parser.service';
import { ScraperService } from '../scraper/scraper.service';
import { randomUUID } from 'crypto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly repository: NotesRepository,
    private readonly categoriesService: CategoriesService,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
    private readonly documentParserService: DocumentParserService,
    private readonly scraperService: ScraperService,
  ) {}

  getEventStream(): Observable<NoteUpdatedEvent> {
    return this.eventsService.subscribe(undefined, 'note.updated').pipe(
      map((event) => {
        const p = event.payload;
        return {
          id: p.id,
          userId: event.userId ?? null,
          status: p.status,
          aiTitle: p.aiTitle ?? null,
          category: p.category ?? 'Other',
          categoryId: p.categoryId ?? null,
          aiSummary: p.aiSummary ?? null,
          aiBullets: p.aiBullets ?? null,
          content: p.content ?? null,
          isRead: p.isRead ?? false,
          createdAt: event.timestamp,
        };
      }),
    );
  }

  async create(
    createNoteDto: CreateNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    const url = createNoteDto.url?.trim();
    const rawContent =
      createNoteDto.content?.trim() || createNoteDto.userInput?.trim();

    if (!url && !rawContent) {
      throw new BadRequestException(
        'At least one of content, userInput or url must be provided',
      );
    }

    let content = rawContent || url || '';
    let scrapedTitle: string | undefined;

    if (url) {
      try {
        const scraped = await this.scraperService.scrape(url);
        if (scraped.title && scraped.title !== 'No Title') {
          scrapedTitle = scraped.title;
        }
        if (scraped.content && scraped.content.length > 0) {
          content = rawContent
            ? `${rawContent}\n\n${scraped.content}`
            : scraped.content;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to scrape URL ${url}: ${
            err instanceof Error ? err.message : String(err)
          }. Graceful fallback to raw URL content.`,
        );
      }
    }

    let title = createNoteDto.title?.trim() || scrapedTitle;
    if (!title) {
      const firstLine = content.split('\n')[0]?.trim();
      title = firstLine ? firstLine.slice(0, 80) : 'Untitled';
    }

    const resolvedCategory =
      await this.categoriesService.resolveCategoryForNote(
        userId,
        createNoteDto.category,
        createNoteDto.categoryId,
      );

    const note = await this.repository.create({
      title,
      content,
      userInput: rawContent,
      url,
      categoryId: resolvedCategory?.id,
      status: Status.COMPLETED,
      userId,
    });

    this.safeEmitNoteUpdated(note);
    return NoteMapper.toResponseDto(note);
  }

  async findAll(
    queryOrParams:
      | FindAllNotesQueryDto
      | {
          userId: string;
          category?: string;
          limit?: number;
          cursor?: string;
        } = {},
    userId?: string,
  ): Promise<NoteResponseDto[]> {
    const resolvedUserId =
      userId ??
      ('userId' in queryOrParams && queryOrParams.userId
        ? queryOrParams.userId
        : '');

    const notes = await this.repository.findAll({
      userId: resolvedUserId,
      category: queryOrParams.category,
      limit: queryOrParams.limit,
      cursor: queryOrParams.cursor,
    });
    return NoteMapper.toResponseDtoList(notes);
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    return this.repository.getUnreadCounts(userId);
  }

  async findOne(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.repository.findById(id);
    if (!note || note.userId !== userId) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return NoteMapper.toResponseDto(note);
  }

  private safeEmitNoteUpdated(note: NoteWithCategory): void {
    const aiBullets = extractBullets(note.aiBullets);

    this.eventsService.emit({
      id: randomUUID(),
      type: 'note.updated',
      aggregateId: note.id,
      userId: note.userId || undefined,
      timestamp: note.createdAt || new Date(),
      payload: {
        id: note.id,
        status: note.status as 'COMPLETED' | 'FAILED',
        aiTitle: note.aiTitle,
        category: note.category?.name || 'Other',
        categoryId: note.categoryId,
        aiSummary: note.aiSummary,
        aiBullets,
        content: note.content,
        isRead: note.isRead,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.repository.findById(id);
    if (!note || note.userId !== userId) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    const updatedNote = await this.repository.update(id, { isRead: true });
    this.safeEmitNoteUpdated(updatedNote);
    return NoteMapper.toResponseDto(updatedNote);
  }

  async createFromFile(
    file: Express.Multer.File,
    dtoOrUserId: UploadNoteDto | string,
    userIdOrCategory?: string,
    title?: string,
    content?: string,
    categoryId?: string,
  ): Promise<NoteResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let userId: string;
    let noteCategory: string | undefined;
    let noteTitleInput: string | undefined;
    let noteContentInput: string | undefined;
    let noteCategoryId: string | undefined;

    if (typeof dtoOrUserId === 'string') {
      userId = dtoOrUserId;
      noteCategory = userIdOrCategory;
      noteTitleInput = title;
      noteContentInput = content;
      noteCategoryId = categoryId;
    } else {
      userId = userIdOrCategory || '';
      noteCategory = dtoOrUserId?.category;
      noteTitleInput = dtoOrUserId?.title;
      noteContentInput = dtoOrUserId?.content;
      noteCategoryId = dtoOrUserId?.categoryId;
    }

    // Delegate physical storage to StorageService
    const storedFile = await this.storageService.saveFile(file);

    // Delegate document parsing and text structuring to DocumentParserService
    let parsedMarkdown: string | undefined;
    try {
      const parsedResult =
        await this.documentParserService.parseAndStructureFile(
          storedFile.filePath,
        );
      if (parsedResult.structuredMarkdown?.trim().length > 0) {
        parsedMarkdown = parsedResult.structuredMarkdown;
      } else if (parsedResult.rawMarkdown?.trim().length > 0) {
        parsedMarkdown = parsedResult.rawMarkdown;
      }
    } catch (err) {
      this.logger.warn(
        `Document parsing failed for file ${storedFile.filePath}: ${
          err instanceof Error ? err.message : String(err)
        }. Graceful fallback to default file attachment link.`,
      );
    }

    const defaultFallbackContent = `[Tập tin đính kèm: ${storedFile.originalName}](${storedFile.fileUrl})`;
    let noteContent = defaultFallbackContent;

    if (noteContentInput?.trim()) {
      noteContent = parsedMarkdown
        ? `${noteContentInput.trim()}\n\n${parsedMarkdown}`
        : noteContentInput.trim();
    } else if (parsedMarkdown) {
      noteContent = parsedMarkdown;
    }

    const noteTitle = noteTitleInput?.trim() || storedFile.originalName;

    const resolvedCategory =
      await this.categoriesService.resolveCategoryForNote(
        userId,
        noteCategory,
        noteCategoryId,
      );

    const note = await this.repository.create({
      title: noteTitle,
      content: noteContent,
      userInput: noteContentInput?.trim() || storedFile.originalName,
      url: storedFile.fileUrl,
      categoryId: resolvedCategory?.id,
      status: Status.COMPLETED,
      userId,
    });

    this.safeEmitNoteUpdated(note);
    return NoteMapper.toResponseDto(note);
  }

  async search(
    queryOrDto: SearchNotesDto | string,
    userId: string,
  ): Promise<{ notes: NoteResponseDto[] }> {
    const query =
      typeof queryOrDto === 'string' ? queryOrDto : queryOrDto?.query || '';
    this.logger.log(`Searching notes for query: ${query}`);
    const notes = await this.repository.search(userId, query);
    return { notes: NoteMapper.toResponseDtoList(notes) };
  }
}
