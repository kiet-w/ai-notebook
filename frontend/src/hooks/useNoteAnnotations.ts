'use client';

import { useState, useCallback } from 'react';
import { NoteAnnotation, AnnotationColor } from '@/types/annotation';

export function getAnnotationStorageKey(noteId: string): string {
  return `note_annotations_${noteId}`;
}

function loadStoredAnnotations(noteId?: string): NoteAnnotation[] {
  if (!noteId || typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getAnnotationStorageKey(noteId));
    if (stored) {
      const parsed = JSON.parse(stored) as NoteAnnotation[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    return [];
  }
  return [];
}

export function useNoteAnnotations(noteId?: string) {
  const [prevNoteId, setPrevNoteId] = useState<string | undefined>(noteId);
  const [annotations, setAnnotations] = useState<NoteAnnotation[]>(() =>
    loadStoredAnnotations(noteId),
  );

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setAnnotations(loadStoredAnnotations(noteId));
  }

  const saveToStorage = useCallback(
    (newAnnotations: NoteAnnotation[]) => {
      if (!noteId) return;
      try {
        localStorage.setItem(
          getAnnotationStorageKey(noteId),
          JSON.stringify(newAnnotations),
        );
      } catch (err) {
        console.error('Failed to save annotations to localStorage:', err);
      }
    },
    [noteId],
  );

  const addAnnotation = useCallback(
    (data: {
      text: string;
      comment: string;
      color?: AnnotationColor;
      lineIndex?: number;
      prefix?: string;
      suffix?: string;
    }) => {
      if (!noteId || !data.text.trim()) return null;

      const newAnnotation: NoteAnnotation = {
        id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        noteId,
        text: data.text.trim(),
        comment: data.comment.trim(),
        color: data.color || 'amber',
        lineIndex: data.lineIndex,
        prefix: data.prefix,
        suffix: data.suffix,
        createdAt: new Date().toISOString(),
      };

      setAnnotations((prev) => {
        const next = [newAnnotation, ...prev];
        saveToStorage(next);
        return next;
      });

      return newAnnotation;
    },
    [noteId, saveToStorage],
  );

  const updateAnnotation = useCallback(
    (id: string, data: { comment?: string; color?: AnnotationColor }) => {
      setAnnotations((prev) => {
        const next = prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              comment: data.comment !== undefined ? data.comment.trim() : item.comment,
              color: data.color || item.color,
            };
          }
          return item;
        });
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage],
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      setAnnotations((prev) => {
        const next = prev.filter((item) => item.id !== id);
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage],
  );

  return {
    annotations,
    isLoaded: true,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
}
