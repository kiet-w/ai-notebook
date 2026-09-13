import { Module } from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { NotesGateway } from './notes.gateway';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [NotesController],
  providers: [NotesRepository, NotesService, NotesGateway],
  exports: [NotesRepository, NotesService, NotesGateway],
})
export class NotesModule {}
