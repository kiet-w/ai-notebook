import { Module } from '@nestjs/common';
import { MarkitdownService } from './services/markitdown.service';
import { TextStructuringService } from './services/text-structuring.service';
import { DocumentParserService } from './parser.service';

@Module({
  providers: [MarkitdownService, TextStructuringService, DocumentParserService],
  exports: [MarkitdownService, TextStructuringService, DocumentParserService],
})
export class ParserModule {}
