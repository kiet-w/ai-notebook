'use client';

import { useEffect, useRef } from 'react';
import { Note, normalizeNote } from '@/utils/api';

const SSE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/notes/events` : 'http://localhost:3001/notes/events';

export function useSSE(onNoteUpdated: (note: Note) => void) {
  const onNoteUpdatedRef = useRef(onNoteUpdated);
  onNoteUpdatedRef.current = onNoteUpdated;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let delay = 1000; // Start with 1 second delay

    function connect() {
      // Clean up previous event source if active
      if (eventSource) {
        eventSource.close();
      }

      console.log('Connecting to SSE events...');
      const es = new EventSource(SSE_URL);
      eventSource = es;

      es.addEventListener('note-updated', (event) => {
        try {
          const updatedNote = normalizeNote(JSON.parse(event.data));
          onNoteUpdatedRef.current(updatedNote);
          delay = 1000; // Reset delay on successful message receipt
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      });

      es.onopen = () => {
        console.log('SSE connection successfully established.');
        delay = 1000; // Reset backoff delay on successful connection
      };

      es.onerror = (error) => {
        console.warn('SSE connection error or closed, scheduling reconnect:', error);
        es.close();

        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
        }

        reconnectTimeoutId = setTimeout(() => {
          // Exponential backoff capped at 30 seconds
          delay = Math.min(delay * 2, 30000);
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
    };
  }, []);
}

