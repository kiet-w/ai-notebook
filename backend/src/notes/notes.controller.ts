import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  NotFoundException,
  Param,
  Post,
  Sse,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { Observable, map, merge, interval } from 'rxjs';
import { Note, Category } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    const dataStream$ = this.notesService.getEventStream().pipe(
      map((event) => ({
        type: 'note-updated',
        data: event,
      } as MessageEvent)),
    );

    const keepAliveStream$ = interval(15000).pipe(
      map(
        () =>
          ({
            type: 'ping',
            data: { timestamp: Date.now() },
          } as MessageEvent),
      ),
    );

    return merge(dataStream$, keepAliveStream$);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() createNoteDto: CreateNoteDto): Promise<NoteResponseDto> {
    const note = await this.notesService.create(createNoteDto);
    return this.toResponseDto(note);
  }

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: Category,
  ): Promise<NoteResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const note = await this.notesService.createFromFile(file, category);
    return this.toResponseDto(note);
  }

  @Get()
  async findAll(): Promise<NoteResponseDto[]> {
    const notes = await this.notesService.findAll();
    return notes.map((note) => this.toResponseDto(note));
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body('query') query: string): Promise<{ answer: string }> {
    if (!query) {
      return { answer: 'Please provide a query.' };
    }
    const answer = await this.notesService.search(query);
    return { answer };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<NoteResponseDto> {
    const note = await this.notesService.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return this.toResponseDto(note);
  }

  private toResponseDto(note: Note): NoteResponseDto {
    let url = note.url;
    if (url && url.startsWith('/uploads/')) {
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
      url = `${baseUrl}${url}`;
    }

    return {
      id: note.id,
      url,
      userInput: note.userInput,
      aiTitle: note.aiTitle,
      aiSummary: note.aiSummary,
      aiBullets: Array.isArray(note.aiBullets)
        ? note.aiBullets.filter((item): item is string => typeof item === 'string')
        : null,
      content: note.content,
      category: note.category,
      status: note.status,
      createdAt: note.createdAt,
    };
  }
}
