import { Module } from '@nestjs/common';
import { NotesRepository } from './repository/notes.repository';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { NotesGateway } from './notes.gateway';
import { CategoriesModule } from '../categories/categories.module';
import { StorageModule } from '../storage/storage.module';
import { EventsModule } from '../events/events.module';
import { ParserModule } from '../parser/parser.module';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [
    CategoriesModule,
    StorageModule,
    EventsModule,
    ParserModule,
    ScraperModule,
  ],
  controllers: [NotesController],
  providers: [NotesRepository, NotesService, NotesGateway],
  exports: [NotesRepository, NotesService, NotesGateway],
})
export class NotesModule {}
