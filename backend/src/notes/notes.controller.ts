import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Patch,
  Query,
  Req,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UploadNoteDto } from './dto/upload-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { FindAllNotesQueryDto } from './dto/find-all-notes-query.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { Note } from '@prisma/client';
import { extractBullets } from './utils/note.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string; role: string };
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.create(createNoteDto, req.user.id);
    return this.toResponseDto(note);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|png|jpeg|jpg|md)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body() uploadNoteDto: UploadNoteDto,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    if (!file) throw new BadRequestException('No file uploaded');
    const note = await this.notesService.createFromFile(
      file,
      req.user.id,
      uploadNoteDto?.category,
      uploadNoteDto?.title,
      uploadNoteDto?.content,
    );
    return this.toResponseDto(note);
  }

  @Get()
  async findAll(
    @Query() query: FindAllNotesQueryDto,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto[]> {
    const notes = await this.notesService.findAll({
      userId: req.user.id,
      category: query.category,
      limit: query.limit,
      cursor: query.cursor,
    });
    return notes.map((note) => this.toResponseDto(note));
  }

  @Get('unread-counts')
  async getUnreadCounts(
    @Req() req: AuthRequest,
  ): Promise<Record<string, number>> {
    return this.notesService.getUnreadCounts(req.user.id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Body() searchNotesDto: SearchNotesDto,
    @Req() req: AuthRequest,
  ): Promise<{ notes: NoteResponseDto[] }> {
    const notes = await this.notesService.search(
      searchNotesDto.query,
      req.user.id,
    );
    return { notes: notes.map((note) => this.toResponseDto(note)) };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.findOne(id, req.user.id);
    if (!note) throw new NotFoundException(`Note with ID ${id} not found`);
    return this.toResponseDto(note);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.markAsRead(id, req.user.id);
    return this.toResponseDto(note);
  }

  private toResponseDto(note: Note): NoteResponseDto {
    let url = note.url;
    if (url && url.startsWith('/uploads/')) {
      const baseUrl =
        process.env.BACKEND_URL ||
        `http://localhost:${process.env.PORT || '3001'}`;
      url = `${baseUrl}${url}`;
    }

    return {
      id: note.id,
      url,
      userInput: note.userInput,
      title: note.aiTitle,
      aiTitle: note.aiTitle,
      aiSummary: note.aiSummary,
      aiBullets: extractBullets(note.aiBullets),
      content: note.content,
      category: note.category,
      status: note.status,
      isRead: note.isRead,
      createdAt: note.createdAt,
    };
  }
}
