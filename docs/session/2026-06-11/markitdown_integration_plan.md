# Plan: Integrating Microsoft MarkItDown for Second Brain Data Ingestion

This plan outlines the steps to integrate `microsoft/markitdown` into the NestJS & Next.js Second Brain pipeline. It will allow uploading and processing files (PDF, Word, Excel, EPub, Images) directly into Markdown format before feeding them into our AI Service and persisting them.

---

## 1. Objectives & Prerequisites

### Objectives
- Add file upload capabilities (PDF, DOCX, XLSX, PNG, etc.) to the Next.js Frontend.
- Setup python environment with `microsoft/markitdown`.
- Create a NestJS service that invokes `markitdown` CLI on uploaded files to convert them to clean Markdown.
- Parse, index, and query the converted Markdown text.

### Prerequisites
- Python 3.10+ installed on the local system.
- `pip` or `uv` package manager.

---

## 2. Step 1: Environment Setup

We will install `markitdown` in a dedicated python environment or globally on the system:

```bash
# Verify Python version
python3 --version

# Install markitdown
pip install --user "markitdown[all]"
```
Verify the installation by running:
```bash
markitdown --help
```

---

## 3. Step 2: NestJS Backend Changes (NestJS Service & Controller)

We will modify the NestJS Backend (`backend`) to accept file uploads and parse them.

### 3.1 Create `MarkitdownService`
Create a new NestJS service (`backend/src/notes/markitdown.service.ts`) that uses Node.js `child_process` to call `markitdown` CLI:
- Input: Absolute path to a temporary file.
- Process: Execute `markitdown <temp_file>` using `exec` or `spawnSync`.
- Output: Clean Markdown string.

### 3.2 Modify `NotesController`
Update `backend/src/notes/notes.controller.ts` to add a file upload endpoint:
- Endpoint: `POST /notes/upload`
- Middleware: Use NestJS `FileInterceptor` with `Multer` to temporarily save files.
- Return: `202 Accepted` with a note ID, similar to `POST /notes`.

### 3.3 Update `NotesService`
Update `backend/src/notes/notes.service.ts` to handle file notes:
- Save new Note status as `PROCESSING`.
- Asynchronously run `MarkitdownService.parse(filePath)`.
- Use the resulting Markdown as the `content` of the Note.
- Delete the temporary uploaded file.
- Send the Markdown content to `AiService` to extract title, summary, bullets, and category.
- Save to DB and trigger the `note-updated` SSE event.

---

## 4. Step 3: Next.js Frontend Changes

We will update the Frontend (`frontend`) to support file uploads.

### 4.1 Update UI Component
- Add a file dropzone or file input element next to the existing URL/Text inputs.
- Show an uploading / processing state.

### 4.2 API Integration
- Post files to `POST /notes/upload` using `FormData`.
- Wire up the returned note ID to the Server-Sent Events (SSE) listener to update the UI once parsing is complete.

---

## 5. Verification & Testing

1. **Unit Test:** Write a test for `MarkitdownService` using a sample file (e.g. TXT or small PDF).
2. **E2E Test:** Upload a sample PDF or Image and verify it gets converted to Markdown, summarized by AI, and persisted correctly in SQLite/Prisma.
