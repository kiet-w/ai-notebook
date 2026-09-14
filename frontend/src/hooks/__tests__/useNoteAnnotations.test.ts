import { renderHook, act } from '@testing-library/react';
import {
  useNoteAnnotations,
  getAnnotationStorageKey,
} from '../useNoteAnnotations';

describe('useNoteAnnotations', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty annotations when storage is empty', () => {
    const { result } = renderHook(() => useNoteAnnotations('note-1'));

    expect(result.current.annotations).toEqual([]);
    expect(result.current.isLoaded).toBe(true);
  });

  it('should load existing annotations from localStorage', () => {
    const mockAnnotation = {
      id: 'ann-1',
      noteId: 'note-1',
      text: 'important quote',
      comment: 'remember this',
      color: 'amber' as const,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(
      getAnnotationStorageKey('note-1'),
      JSON.stringify([mockAnnotation]),
    );

    const { result } = renderHook(() => useNoteAnnotations('note-1'));

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.annotations[0].text).toBe('important quote');
  });

  it('should add a new annotation and persist to localStorage', () => {
    const { result } = renderHook(() => useNoteAnnotations('note-1'));

    act(() => {
      result.current.addAnnotation({
        text: 'Selected text here',
        comment: 'My personal insight',
        color: 'blue',
      });
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.annotations[0].text).toBe('Selected text here');
    expect(result.current.annotations[0].comment).toBe('My personal insight');
    expect(result.current.annotations[0].color).toBe('blue');

    const stored = JSON.parse(
      localStorage.getItem(getAnnotationStorageKey('note-1')) || '[]',
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('Selected text here');
  });

  it('should update an existing annotation', () => {
    const { result } = renderHook(() => useNoteAnnotations('note-1'));

    let createdId = '';
    act(() => {
      const created = result.current.addAnnotation({
        text: 'Text',
        comment: 'Initial comment',
        color: 'amber',
      });
      if (created) createdId = created.id;
    });

    act(() => {
      result.current.updateAnnotation(createdId, {
        comment: 'Updated comment',
        color: 'rose',
      });
    });

    expect(result.current.annotations[0].comment).toBe('Updated comment');
    expect(result.current.annotations[0].color).toBe('rose');
  });

  it('should delete an annotation and update localStorage', () => {
    const { result } = renderHook(() => useNoteAnnotations('note-1'));

    let createdId = '';
    act(() => {
      const created = result.current.addAnnotation({
        text: 'To be deleted',
        comment: 'bye',
      });
      if (created) createdId = created.id;
    });

    expect(result.current.annotations).toHaveLength(1);

    act(() => {
      result.current.deleteAnnotation(createdId);
    });

    expect(result.current.annotations).toHaveLength(0);
    const stored = JSON.parse(
      localStorage.getItem(getAnnotationStorageKey('note-1')) || '[]',
    );
    expect(stored).toHaveLength(0);
  });
});
