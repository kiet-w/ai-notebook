import { Module } from '@nestjs/common';
import { NotesRepository } from './repositories/notes.repository';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { ScraperModule } from '../scraper/scraper.module';
import { ParserModule } from '../parser/parser.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ScraperModule, ParserModule, AiModule],
  controllers: [NotesController],
  providers: [NotesRepository, NotesService],
  exports: [NotesRepository, NotesService],
})
export class NotesModule {}
