import { NoteWithCategory } from '../repository/notes.repository';
import { NoteResponseDto } from '../dto/note-response.dto';
import { extractBullets } from '../utils/note.utils';

export class NoteMapper {
  static toResponseDto(note: NoteWithCategory): NoteResponseDto {
    let url = note.url;
    if (url && url.startsWith('/uploads/')) {
      const baseUrl =
        process.env.BACKEND_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        `http://localhost:${process.env.PORT || '3001'}`;
      url = `${baseUrl}${url}`;
    }

    return {
      id: note.id,
      url,
      userInput: note.userInput,
      title: note.aiTitle,
      aiTitle: note.aiTitle,
      aiSummary: note.aiSummary,
      aiBullets: extractBullets(note.aiBullets),
      content: note.content,
      category: note.category?.name || 'Other',
      categoryId: note.categoryId ?? null,
      status: note.status,
      isRead: note.isRead,
      createdAt: note.createdAt,
    };
  }

  static toResponseDtoList(notes: NoteWithCategory[]): NoteResponseDto[] {
    return notes.map((note) => this.toResponseDto(note));
  }
}
