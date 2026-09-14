import { StructuredSection } from '../services/text-structuring.service';

export interface ParsedDocumentResult {
  rawMarkdown: string;
  structuredMarkdown: string;
  sections: StructuredSection[];
}
