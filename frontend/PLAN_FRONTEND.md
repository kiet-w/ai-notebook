# Frontend Implementation Plan - Secondary Brain

> **For agentic workers:** FOCUS EXCLUSIVELY on `frontend/`. Use Next.js 14+ App Router. Follow `PLAN_INTEGRATION.md`.

**Goal:** Build a responsive, real-time Notion-style dashboard with Next.js.

---

### Task 1: Foundation & Global Styles
- [ ] **Step 1: Global CSS**
    - Modify `frontend/src/app/globals.css`.
    - Define Notion-like color palette (background: #ffffff, sidebar: #f7f6f3) and typography.
- [ ] **Step 2: Root Layout**
    - Modify `frontend/src/app/layout.tsx`.
    - Setup the main flex container: Fixed Sidebar (left) and Scrollable Content (right).
- [ ] **Step 3: Commit**

### Task 2: Notion-style Sidebar
- [ ] **Step 1: Sidebar Component**
    - Create `frontend/src/components/Sidebar.tsx` using `lucide-react` icons.
    - Implement links for "All Notes" and Categories (Cooking, Tech, etc.).
- [ ] **Step 2: Sidebar State**
    - Add active state handling to highlight the current selected category.
- [ ] **Step 3: Commit**

### Task 3: API Client & Data Types
- [ ] **Step 1: Define Shared Types**
    - Create `frontend/src/types/note.ts`.
    - Define `Note`, `Category`, and `Status` types (must match `PLAN_INTEGRATION.md`).
- [ ] **Step 2: API Utility**
    - Create `frontend/src/utils/api.ts`.
    - Implement `fetchNotes()` and `createNote()`.
- [ ] **Step 3: Commit**

### Task 4: Note Capture (Optimistic UI)
- [ ] **Step 1: NoteInput Component**
    - Create `frontend/src/components/NoteInput.tsx`.
    - Use a minimalist input field (Notion-style "Type / for commands" vibe).
- [ ] **Step 2: Optimistic Logic**
    - On Submit: Call API -> Receive ID -> Immediately prepend a skeleton note with status `PROCESSING` to the state.
- [ ] **Step 3: Commit**

### Task 5: SSE Real-time Updates
- [ ] **Step 1: useSSE Hook**
    - Create `frontend/src/hooks/useSSE.ts`.
    - Connect to `GET /notes/events`. Handle auto-reconnect logic.
- [ ] **Step 2: State Binding**
    - On `note-updated` event: Find note by `id` in the local list and update its fields/status.
- [ ] **Step 3: Commit**

### Task 6: Note Card & Display States
- [x] **Step 1: NoteCard Component**
    - Create `frontend/src/components/NoteCard.tsx`.
- [x] **Step 2: Status Rendering**
    - `PROCESSING`: Show a shimmering skeleton.
    - `COMPLETED`: Show Title, Category badge, AI Summary, and Bullet points.
    - `FAILED`: Show error message with a "Retry" button.
- [x] **Step 3: Commit**

### Task 7: Feed & Category Filtering
- [x] **Step 1: Main Feed**
    - In `frontend/src/app/page.tsx`, fetch notes on mount and render the list.
- [x] **Step 2: Filter Logic**
    - Implement client-side filtering based on the Category selected in the Sidebar.
- [x] **Step 3: Commit**
