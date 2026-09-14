import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { Category, Status } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoteUpdatedEvent } from './types/sse-event.type';
import { CategoriesService } from '../categories/categories.service';
import { StorageService } from '../storage/storage.service';
import { EventsService } from '../events/events.service';
import { DocumentParserService } from '../parser/parser.service';
import { ScraperService } from '../scraper/scraper.service';
import {
  buildFileNoteContent,
  deriveNoteTitle,
  mergeScrapedContent,
} from './utils/note-content.util';
import {
  createNoteUpdatedDomainEvent,
  mapDomainEventToSseEvent,
} from './utils/note-event.util';
import { ensureNoteOwnership } from './policies/note.policy';

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
    return this.eventsService
      .subscribe(undefined, 'note.updated')
      .pipe(map((event) => mapDomainEventToSseEvent(event)));
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

    let scrapedTitle: string | undefined;
    let scrapedContent: string | undefined;

    if (url) {
      try {
        const scraped = await this.scraperService.scrape(url);
        if (scraped.title && scraped.title !== 'No Title') {
          scrapedTitle = scraped.title;
        }
        if (scraped.content && scraped.content.length > 0) {
          scrapedContent = scraped.content;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to scrape URL ${url}: ${
            err instanceof Error ? err.message : String(err)
          }. Graceful fallback to raw URL content.`,
        );
      }
    }

    const content = mergeScrapedContent({
      rawContent,
      scrapedContent,
      url,
    });

    const title = deriveNoteTitle({
      inputTitle: createNoteDto.title,
      scrapedTitle,
      content,
    });

    const resolvedCategory: Category | null =
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
    query: FindAllNotesQueryDto,
    userId: string,
  ): Promise<NoteResponseDto[]> {
    const notes = await this.repository.findAll({
      userId,
      category: query.category,
      limit: query.limit,
      cursor: query.cursor,
    });
    return NoteMapper.toResponseDtoList(notes);
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    return this.repository.getUnreadCounts(userId);
  }

  async findOne(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.repository.findById(id);
    ensureNoteOwnership(note, userId, id);
    return NoteMapper.toResponseDto(note);
  }

  async markAsRead(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.repository.findById(id);
    ensureNoteOwnership(note, userId, id);

    const updatedNote = await this.repository.update(id, { isRead: true });
    this.safeEmitNoteUpdated(updatedNote);
    return NoteMapper.toResponseDto(updatedNote);
  }

  async createFromFile(
    file: Express.Multer.File,
    dto: UploadNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
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

    const noteContent = buildFileNoteContent({
      inputContent: dto.content,
      parsedMarkdown,
      originalName: storedFile.originalName,
      fileUrl: storedFile.fileUrl,
    });

    const noteTitle = deriveNoteTitle({
      inputTitle: dto.title,
      fallback: storedFile.originalName,
    });

    const resolvedCategory: Category | null =
      await this.categoriesService.resolveCategoryForNote(
        userId,
        dto.category,
        dto.categoryId,
      );

    const note = await this.repository.create({
      title: noteTitle,
      content: noteContent,
      userInput: dto.content?.trim() || storedFile.originalName,
      url: storedFile.fileUrl,
      categoryId: resolvedCategory?.id,
      status: Status.COMPLETED,
      userId,
    });

    this.safeEmitNoteUpdated(note);
    return NoteMapper.toResponseDto(note);
  }

  async search(
    dto: SearchNotesDto,
    userId: string,
  ): Promise<{ notes: NoteResponseDto[] }> {
    const query = dto.query || '';
    this.logger.log(`Searching notes for query: ${query}`);
    const notes = await this.repository.search(userId, query);
    return { notes: NoteMapper.toResponseDtoList(notes) };
  }

  private safeEmitNoteUpdated(note: NoteWithCategory): void {
    const event = createNoteUpdatedDomainEvent(note);
    this.eventsService.emit(event);
  }
}
