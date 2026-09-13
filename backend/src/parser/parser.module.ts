import { Module } from '@nestjs/common';
import { MarkitdownService } from './markitdown.service';
import { TextStructuringService } from './text-structuring.service';

@Module({
  providers: [MarkitdownService, TextStructuringService],
  exports: [MarkitdownService, TextStructuringService],
})
export class ParserModule {}
