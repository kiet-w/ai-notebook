import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note, Status, Category } from '@prisma/client';
import { ScraperService } from '../scraper/scraper.service';
import { AiService } from '../ai/ai.service';
import { Subject, Observable } from 'rxjs';
import { NoteUpdatedEvent } from './types/sse-event.type';
import { MarkitdownService } from '../parser/markitdown.service';
import { promises as fs } from 'fs';
import { join } from 'path';
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

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const url = createNoteDto.url?.trim();
    const userInput = createNoteDto.userInput?.trim();
    const category = createNoteDto.category;

    if (!url && !userInput) {
      throw new BadRequestException('At least one of url or userInput must be provided');
    }

    const note = await this.repository.create({
      url,
      userInput,
      category,
    });

    setImmediate(() => {
      this.processNote(note).catch((err: Error) => {
        this.logger.error(`Error processing note ${note.id}: ${err.message}`);
      });
    });

    return note;
  }

  async findAll(): Promise<Note[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<Note | null> {
    return this.repository.findById(id);
  }

  private async processNote(note: Note) {
    this.logger.log(`Starting processing for note ${note.id}`);
    
    try {
      const scrapeResult = note.url
        ? await this.scraperService.scrape(note.url)
        : { title: '', content: note.userInput ?? '' };

      const content = [scrapeResult.content, note.userInput].filter(Boolean).join('\n\n');
      const aiResult = await this.aiService.analyze(content);

      const updatedNote = await this.repository.update(note.id, {
        aiTitle: scrapeResult.title || aiResult.title,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content,
        status: Status.COMPLETED,
      });

      this.events$.next(this.toNoteUpdatedEvent(updatedNote));
      this.logger.log(`Finished processing for note ${note.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process note ${note.id}: ${message}`);
      const failedNote = await this.repository.updateStatus(note.id, Status.FAILED);
      this.events$.next(this.toNoteUpdatedEvent(failedNote));
    }
  }

  private toNoteUpdatedEvent(note: Note): NoteUpdatedEvent {
    const aiBullets = Array.isArray(note.aiBullets)
      ? note.aiBullets.filter((item): item is string => typeof item === 'string')
      : null;

    return {
      id: note.id,
      status: note.status as 'COMPLETED' | 'FAILED',
      aiTitle: note.aiTitle,
      category: note.category,
      aiSummary: note.aiSummary,
      aiBullets,
      content: note.content,
      createdAt: note.createdAt,
    };
  }

  async createFromFile(file: Express.Multer.File, category?: Category): Promise<Note> {
    const filename = file.originalname;

    // Save note with a PROCESSING state and placeholder title
    const note = await this.repository.create({
      userInput: `Processing file: ${filename}`,
      category,
    });

    try {
      const uploadsDir = join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
      const filePath = join(uploadsDir, `${note.id}-${filename}`);
      await fs.writeFile(filePath, file.buffer);
      note.url = `/uploads/${note.id}-${filename}`;
      await this.repository.update(note.id, { url: note.url });
    } catch (err) {
      this.logger.error(`Failed to save uploaded file locally: ${err.message}`);
    }

    // Process file asynchronously
    setImmediate(() => {
      this.processFileNote(note, file).catch((err: Error) => {
        this.logger.error(`Error processing file note ${note.id}: ${err.message}`);
      });
    });

    return note;
  }

  private async processFileNote(note: Note, file: Express.Multer.File) {
    this.logger.log(`Starting file processing for note ${note.id}`);
    
    let tempFilePath: string | null = null;
    try {
      let markdownContent: string;
      let aiResult: any;

      if (file.mimetype.startsWith('image/')) {
        this.logger.log(`Processing file note ${note.id} as image using multimodal Gemini`);
        aiResult = await this.aiService.analyzeImage(file.buffer, file.mimetype);
        markdownContent = aiResult.content || `[Image: ${file.originalname}]`;
      } else {
        const tempDir = tmpdir();
        tempFilePath = join(tempDir, `${note.id}-${file.originalname}`);

        // Write buffer to temporary file
        await fs.writeFile(tempFilePath, file.buffer);

        // Convert using MarkItDown
        markdownContent = await this.markitdownService.convert(tempFilePath);

        // Clean up temp file
        await fs.unlink(tempFilePath).catch((err) => {
          this.logger.warn(`Failed to delete temp file ${tempFilePath}: ${err.message}`);
        });
        tempFilePath = null;

        // Analyze the parsed markdown
        aiResult = await this.aiService.analyze(markdownContent);
      }

      // Save to database
      const updatedNote = await this.repository.update(note.id, {
        aiTitle: aiResult.title || file.originalname,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content: markdownContent,
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
      const failedNote = await this.repository.updateStatus(note.id, Status.FAILED);
      this.events$.next(this.toNoteUpdatedEvent(failedNote));
    }
  }

  async search(query: string): Promise<string> {
    this.logger.log(`Searching notes for query: ${query}`);
    const notes = await this.repository.findAll();
    const latestNotes = notes.slice(0, 20);
    return this.aiService.answerQuestion(query, latestNotes);
  }
}
