# Fix SSE Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bypass Next.js API rewrites for the SSE connection to prevent buffering and strict 30-second proxy timeouts.

**Architecture:** We will modify the `useSSE` hook to connect directly to the backend URL (`http://localhost:3001/notes/events`) instead of proxying through Next.js (`/api/notes/events`). The backend already has CORS configured to accept requests from the frontend, making this safe and reliable for streams.

**Tech Stack:** React, Next.js, Server-Sent Events

---

### Task 1: Update SSE URL to bypass proxy

**Files:**
- Modify: `frontend/src/hooks/useSSE.ts:1-25`

- [x] **Step 1: Write minimal implementation**

```typescript
'use client';

import { useEffect } from 'react';
import { Note, normalizeNote } from '@/utils/api';

const SSE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/notes/events` : 'http://localhost:3001/notes/events';

export function useSSE(onNoteUpdated: (note: Note) => void) {
  useEffect(() => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener('note-updated', (event) => {
      try {
        const updatedNote = normalizeNote(JSON.parse(event.data));
        onNoteUpdated(updatedNote);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.warn('SSE connection closed:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [onNoteUpdated]);
}
```

- [x] **Step 2: Run frontend build to verify syntax**

Run: `cd frontend && rtk proxy bun run build`
Expected: Successful build, no syntax errors.

- [x] **Step 3: Commit Frontend Fix**

```bash
cd frontend
git add src/hooks/useSSE.ts
git commit -m "fix: bypass next.js proxy for SSE stream to prevent idle timeouts"
```
