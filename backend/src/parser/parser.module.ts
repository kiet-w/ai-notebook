import { Module } from '@nestjs/common';
import { MarkitdownService } from './markitdown.service';
import { TextStructuringService } from './text-structuring.service';
import { DocumentParserService } from './document-parser.service';

@Module({
  providers: [MarkitdownService, TextStructuringService, DocumentParserService],
  exports: [MarkitdownService, TextStructuringService, DocumentParserService],
})
export class ParserModule {}
