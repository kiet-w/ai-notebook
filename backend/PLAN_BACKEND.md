# Backend Implementation Plan - Secondary Brain

> **For agentic workers:** FOCUS EXCLUSIVELY on `backend/`. Use TDD. Follow `PLAN_INTEGRATION.md`. Use Repository pattern and DTOs.

**Goal:** Build a robust, scalable NestJS API with clean architecture.

---

### Task 1: Database (Supabase) & Constants
- [ ] **Step 1: Setup Supabase Project**
    - Create a new project on [Supabase](https://supabase.com/).
    - Get the **Connection String** (PostgreSQL) and **Direct Connection String** for Prisma.
    - Set `DATABASE_URL` and `DIRECT_URL` in `backend/.env`.
- [ ] **Step 2: Define Constants**
    - Create `backend/src/notes/constants.ts`.
    - Export `Category` and `Status` enums.
- [ ] **Step 3: Define Schema**
    - Modify `backend/prisma/schema.prisma`.
    - Add `enum Category`, `enum Status`, and `model Note`.
- [ ] **Step 4: Run Migration to Supabase**
    - Run: `npx prisma migrate dev --name init_secondary_brain`
- [ ] **Step 5: Commit**

### Task 2: Scraper Service (TDD)
- [ ] **Step 1: Write Scraper Test (Mocked)**
    - Create `backend/src/notes/scraper.service.spec.ts`.
    - Use `jest.mock('axios')`. No real network calls.
- [ ] **Step 2: Implement Scraper**
    - Create `backend/src/notes/scraper.service.ts` using Axios and Cheerio.
- [ ] **Step 3: Commit**

### Task 3: AI Service (TDD + Zod)
- [ ] **Step 1: Define Zod Schema**
    - Create `backend/src/notes/dto/ai-response.schema.ts`.
    - **Note:** Ensure categories match `constants.ts`.
- [ ] **Step 2: Write AI Service Test**
    - Mock AI response (including markdown blocks) and verify Zod parsing.
- [ ] **Step 3: Implement AI Service**
- [ ] **Step 4: Commit**

### Task 4: DTOs & Global Pipes
- [ ] **Step 1: Create Input DTO**
    - Create `backend/src/notes/dto/create-note.dto.ts`.
    - Use `class-validator` (@IsUrl, @IsString, @IsOptional).
- [ ] **Step 2: Create Response DTO**
    - Create `backend/src/notes/dto/note-response.dto.ts` to shape API output.
- [ ] **Step 3: Setup Global Pipes**
    - Modify `backend/src/main.ts`: Enable `CORS` and add `ValidationPipe({ whitelist: true, transform: true })`.
- [ ] **Step 4: Commit**

### Task 5: Repository Layer
- [ ] **Step 1: Create NotesRepository**
    - Create `backend/src/notes/notes.repository.ts`.
    - Implement: `create`, `findAll`, `findById`, `updateStatus`.
- [ ] **Step 2: Update Module**
    - Provide `NotesRepository` in `NotesModule`.
- [ ] **Step 3: Commit**

### Task 6: API Core (Controller & Service)
- [ ] **Step 1: Implement Controller**
    - Use `CreateNoteDto` for input and `NoteResponseDto` for output.
    - Implement `findAll` and `create`.
- [ ] **Step 2: Implement Service**
    - Inject `NotesRepository`.
    - `findAll` calls `repository.findAll`.
    - `create` calls `repository.create` then triggers `setImmediate`.
- [ ] **Step 3: Commit**

### Task 4: Async Processing (Robust Flow)
- [ ] **Step 1: Implement processNote**
    - Add to `NotesService`.
    - Flow: Scrape -> AI -> `repository.updateStatus` -> `repository.findById` -> SSE Emit.
    - Wrap in `try/catch`. On failure: `repository.updateStatus(id, FAILED)` -> SSE Emit.
- [ ] **Step 2: Commit**

### Task 8: SSE Implementation (Typed & Broadcast)
- [ ] **Step 1: Define Event Type**
    - Create `backend/src/notes/types/sse-event.type.ts`.
- [ ] **Step 2: Implement SSE Endpoint**
    - Create `GET /notes/events` using `@Sse()`.
    - Use a shared `Subject` or `EventEmitter2` for broadcast.
- [ ] **Step 3: Commit**
