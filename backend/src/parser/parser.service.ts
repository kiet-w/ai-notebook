import { Injectable, Logger } from '@nestjs/common';
import { MarkitdownService } from './services/markitdown.service';
import { TextStructuringService } from './services/text-structuring.service';
import { ParsedDocumentResult } from './types/document-parser.type';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  constructor(
    private readonly markitdownService: MarkitdownService,
    private readonly textStructuringService: TextStructuringService,
  ) {}

  async parseAndStructureFile(filePath: string): Promise<ParsedDocumentResult> {
    this.logger.log(`Parsing and structuring document: ${filePath}`);

    try {
      const rawMarkdown = await this.markitdownService.convert(filePath);

      if (!rawMarkdown || rawMarkdown.trim().length === 0) {
        this.logger.warn(`Extracted markdown is empty for file: ${filePath}`);
      }

      const structured = this.textStructuringService.structureText({
        text: rawMarkdown,
      });

      this.logger.log(
        `Successfully parsed and structured document: ${filePath} (${structured.sections.length} sections)`,
      );

      return {
        rawMarkdown,
        structuredMarkdown: structured.markdown,
        sections: structured.sections,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Failed to parse and structure file ${filePath}: ${error.message}`,
      );
      throw error;
    }
  }
}
