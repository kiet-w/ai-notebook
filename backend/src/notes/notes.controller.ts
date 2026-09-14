import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
  create(
    @Body() createNoteDto: CreateNoteDto,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(createNoteDto, req.user.id);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
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
    return this.notesService.createFromFile(file, uploadNoteDto, req.user.id);
  }

  @Get()
  findAll(
    @Query() query: FindAllNotesQueryDto,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto[]> {
    return this.notesService.findAll(query, req.user.id);
  }

  @Get('unread-counts')
  getUnreadCounts(@Req() req: AuthRequest): Promise<Record<string, number>> {
    return this.notesService.getUnreadCounts(req.user.id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(
    @Body() searchNotesDto: SearchNotesDto,
    @Req() req: AuthRequest,
  ): Promise<{ notes: NoteResponseDto[] }> {
    return this.notesService.search(searchNotesDto, req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(id, req.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.markAsRead(id, req.user.id);
  }
}
