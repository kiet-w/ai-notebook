import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note, Status, Category } from '@prisma/client';
import { ScraperService } from '../scraper/scraper.service';
import { AiService, AiAnalysis } from '../ai/ai.service';
import { Subject, Observable } from 'rxjs';
import { NoteUpdatedEvent } from './types/sse-event.type';
import { MarkitdownService } from '../parser/markitdown.service';
import { extractBullets } from './utils/note.utils';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);
  private readonly events$ = new Subject<NoteUpdatedEvent>();

  constructor(
    private readonly repository: NotesRepository,
    private readonly scraperService: ScraperService,
    private readonly aiService: AiService,
    private readonly markitdownService: MarkitdownService,
  ) {}

  getEventStream(): Observable<NoteUpdatedEvent> {
    return this.events$.asObservable();
  }

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const url = createNoteDto.url?.trim();
    const userInput = createNoteDto.userInput?.trim();
    const category = createNoteDto.category;

    if (!url && !userInput) {
      throw new BadRequestException(
        'At least one of url or userInput must be provided',
      );
    }

    const note = await this.repository.create({
      url,
      userInput,
      category,
      userId,
    });

    setImmediate(() => {
      this.processNote(note, createNoteDto.detailLevel).catch((err: Error) => {
        this.logger.error(`Error processing note ${note.id}: ${err.message}`);
      });
    });

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

  private async processNote(note: Note, detailLevel: 'short' | 'medium' | 'long' = 'medium') {
    this.logger.log(`Starting processing for note ${note.id}`);

    try {
      const scrapeResult = note.url
        ? await this.scraperService.scrape(note.url)
        : { title: '', content: note.userInput ?? '' };

      const content = [scrapeResult.content, note.userInput]
        .filter(Boolean)
        .join('\n\n');
      
      let aiResult;
      if (note.category && note.category !== 'OTHER') {
        // If user provided a specific category, we can use the fast parallel analysis
        aiResult = await this.aiService.analyzeFast(content, detailLevel, note.category);
      } else {
        // Otherwise, wait for AI to determine category first to pick the right structure
        aiResult = await this.aiService.analyze(content, detailLevel);
      }

      const updatedNote = await this.repository.update(note.id, {
        aiTitle: scrapeResult.title || aiResult.title,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content: aiResult.content || content,
        status: Status.COMPLETED,
      });

      this.events$.next(this.toNoteUpdatedEvent(updatedNote));
      this.logger.log(`Finished processing for note ${note.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process note ${note.id}: ${message}`);
      const failedNote = await this.repository.updateStatus(
        note.id,
        Status.FAILED,
      );
      this.events$.next(this.toNoteUpdatedEvent(failedNote));
    }
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
    detailLevel: 'short' | 'medium' | 'long' = 'medium',
  ): Promise<Note> {
    const filename = basename(file.originalname);

    const note = await this.repository.create({
      userInput: `Processing file: ${filename}`,
      category,
      userId,
    });

    try {
      const uploadsDir = join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
      const filePath = join(uploadsDir, `${note.id}-${filename}`);
      await fs.writeFile(filePath, file.buffer);
      note.url = `/uploads/${note.id}-${filename}`;
      await this.repository.update(note.id, { url: note.url });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to save uploaded file locally: ${errMsg}`);
    }

    setImmediate(() => {
      this.processFileNote(note, file, detailLevel).catch((err: Error) => {
        this.logger.error(
          `Error processing file note ${note.id}: ${err.message}`,
        );
      });
    });

    return note;
  }

  private async processFileNote(note: Note, file: Express.Multer.File, detailLevel: 'short' | 'medium' | 'long' = 'medium') {
    this.logger.log(`Starting file processing for note ${note.id}`);

    let tempFilePath: string | null = null;
    try {
      let markdownContent: string;
      let aiResult: AiAnalysis;

      if (file.mimetype.startsWith('image/')) {
        this.logger.log(
          `Processing file note ${note.id} as image using multimodal Gemini`,
        );
        aiResult = await this.aiService.analyzeImage(
          file.buffer,
          file.mimetype,
        );
        markdownContent = aiResult.content || `[Image: ${file.originalname}]`;
      } else {
        const safeFilename = basename(file.originalname);
        const tempDir = tmpdir();
        tempFilePath = join(tempDir, `${note.id}-${safeFilename}`);

        // Write buffer to temporary file
        await fs.writeFile(tempFilePath, file.buffer);

        // Convert using MarkItDown
        markdownContent = await this.markitdownService.convert(tempFilePath);

        // Clean up temp file
        await fs.unlink(tempFilePath).catch((err) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Failed to delete temp file ${tempFilePath}: ${errMsg}`,
          );
        });
        tempFilePath = null;

        // Analyze the parsed markdown
        if (note.category && note.category !== 'OTHER') {
          aiResult = await this.aiService.analyzeFast(markdownContent, detailLevel, note.category);
        } else {
          aiResult = await this.aiService.analyze(markdownContent, detailLevel);
        }
      }

      // Save to database
      const safeFilename = basename(file.originalname);
      const updatedNote = await this.repository.update(note.id, {
        aiTitle: aiResult.title || safeFilename,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content: aiResult.content || markdownContent,
        status: Status.COMPLETED,
      });

      this.events$.next(this.toNoteUpdatedEvent(updatedNote));
      this.logger.log(`Finished file processing for note ${note.id}`);
    } catch (error) {
      // Ensure temp file is cleaned up if it was created
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process file note ${note.id}: ${message}`);
      const failedNote = await this.repository.updateStatus(
        note.id,
        Status.FAILED,
      );
      this.events$.next(this.toNoteUpdatedEvent(failedNote));
    }
  }

  async search(query: string, userId: string): Promise<string> {
    this.logger.log(`Searching notes for query: ${query}`);
    const notes = await this.repository.findAll({
      userId,
      limit: 20,
      selectFullFields: true,
    });
    return this.aiService.answerQuestion(query, notes);
  }
}
