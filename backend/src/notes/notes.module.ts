import { Module } from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { NotesGateway } from './notes.gateway';

@Module({
  imports: [],
  controllers: [NotesController],
  providers: [NotesRepository, NotesService, NotesGateway],
  exports: [NotesRepository, NotesService, NotesGateway],
})
export class NotesModule {}
