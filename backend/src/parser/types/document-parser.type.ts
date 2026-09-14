import { StructuredSection } from '../text-structuring.service';

export interface ParsedDocumentResult {
  rawMarkdown: string;
  structuredMarkdown: string;
  sections: StructuredSection[];
}
