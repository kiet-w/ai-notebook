export type AnnotationColor = 'amber' | 'blue' | 'emerald' | 'purple' | 'rose';

export interface NoteAnnotation {
  id: string;
  noteId: string;
  text: string;
  comment: string;
  color: AnnotationColor;
  lineIndex?: number;
  prefix?: string;
  suffix?: string;
  createdAt: string;
}
