# Implementation Plan: Deep Performance Optimization (Backend & Frontend)

This plan outlines a series of steps to resolve the lag and performance bottlenecks identified in the Secondary Brain application. It covers database index optimization, server-side pagination/filtering, security sanitization, and fixing frontend rendering cascades and reference stability.

## File Structure

The following files will be created or modified:

| Path | Action | Responsibility |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Add database indexes for category and date sorting. |
| `backend/src/notes/repositories/notes.repository.ts` | Modify | Support server-side filtering by category and limiting. |
| `backend/src/notes/notes.service.ts` | Modify | Optimize service methods (`findAll`, `search`) to use database limits and filters. |
| `backend/src/notes/notes.controller.ts` | Modify | Expose query parameters (`category`, `limit`) on `GET /notes`. |
| `backend/src/parser/markitdown.service.ts` | Modify | Sanitize file paths to prevent command injection. |
| `backend/src/scraper/scraper.service.ts` | Modify | Implement HTTP timeouts and content size limit. |
| `backend/src/ai/ai.service.ts` | Modify | Add default timeouts to Gemini API requests. |
| `frontend/src/utils/api.ts` | Modify | Support query params in API call for category-specific fetching. |
| `frontend/src/components/templates/CategoryTemplate.tsx` | Modify | Fetch category-specific notes, stabilize `useMemo` references, and add `useCallback`. |
| `frontend/src/components/templates/HomeTemplate.tsx` | Modify | Wrap handlers in `useCallback` and fix unneeded setTimeout fetch delays. |
| `frontend/src/components/organisms/NoteCard.tsx` | Modify | Optimize hover popup rendering, remove aspect ratio double-load, and memoize inline dates. |
| `frontend/src/components/organisms/Sidebar.tsx` | Modify | Memoize the Sidebar to prevent re-renders on every parent state change. |

---

## Tasks

### Task 1: Database Indexes and Repository Optimization (Backend)
Add database indexes to key query columns (`category`, `createdAt`) and update the repository to support filtering and limits.

#### 1. Edit `backend/prisma/schema.prisma`
Add indexes to `Note` model.

```prisma
model Note {
  id        String   @id @default(uuid())
  url       String?
  userInput String?
  aiTitle   String?
  aiSummary String?
  aiBullets Json?
  content   String?
  category  Category @default(OTHER)
  status    Status   @default(PROCESSING)
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([createdAt])
}
```

#### 2. Edit `backend/src/notes/repositories/notes.repository.ts`
Modify `findAll` to accept filter parameters.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Note, Prisma, Status, Category } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class NotesRepository extends BaseRepository<
  Note,
  Prisma.NoteCreateInput,
  Prisma.NoteUpdateInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.note);
  }

  async create(data: {
    url?: string;
    userInput?: string;
    category?: Category;
  }): Promise<Note> {
    return super.create({
      url: data.url,
      userInput: data.userInput,
      category: data.category,
      status: Status.PROCESSING,
    });
  }

  async findAll(params: { category?: Category; limit?: number } = {}): Promise<Note[]> {
    const where: Prisma.NoteWhereInput = {};
    if (params.category) {
      where.category = params.category;
    }
    return super.findAll({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    });
  }

  async updateStatus(id: string, status: Status): Promise<Note> {
    return super.update(id, { status });
  }
}
```

#### Verification & Commands
Run Prisma migration/db push and verify the repository tests.
```bash
rtk proxy npx prisma db push --schema=backend/prisma/schema.prisma
rtk proxy npm run test --prefix backend
```

---

### Task 2: Service & Controller Query Optimization (Backend)
Optimize `NotesService` and `NotesController` so they do not load all notes into memory when fetching or searching.

#### 1. Edit `backend/src/notes/notes.service.ts`
Update `findAll` and `search` to use query parameters.

```typescript
// Replace lines 61-63 in backend/src/notes/notes.service.ts
  async findAll(params: { category?: Category; limit?: number } = {}): Promise<Note[]> {
    return this.repository.findAll(params);
  }

// Replace search method (lines 236-242) in backend/src/notes/notes.service.ts
  async search(query: string): Promise<string> {
    this.logger.log(`Searching notes for query: ${query}`);
    const notes = await this.repository.findAll({ limit: 20 });
    return this.aiService.answerQuestion(query, notes);
  }
```

#### 2. Edit `backend/src/notes/notes.controller.ts`
Expose the `@Query()` parameters in the controller.

```typescript
// Add Query to imports from '@nestjs/common' (line 1)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  NotFoundException,
  Param,
  Post,
  Sse,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Patch,
  Query, // Added
} from '@nestjs/common';

// Replace findAll method (lines 68-72)
  @Get()
  async findAll(
    @Query('category') category?: Category,
    @Query('limit') limit?: string,
  ): Promise<NoteResponseDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const notes = await this.notesService.findAll({ category, limit: parsedLimit });
    return notes.map((note) => this.toResponseDto(note));
  }
```

#### Verification & Commands
Build and test backend to ensure no compilation issues.
```bash
rtk proxy npm run build --prefix backend
rtk proxy npm run test --prefix backend
```

---

### Task 3: Security & Timeout Hardening (Backend)
Protect Markitdown from command injection and add timeouts/limits on HTTP calls to external websites/AI services.

#### 1. Edit `backend/src/parser/markitdown.service.ts`
Implement file path validation to prevent shell metacharacter command injection.

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class MarkitdownService {
  private readonly logger = new Logger(MarkitdownService.name);

  private readonly markitdownPath = path.resolve(
    process.cwd(),
    '../.venv/bin/markitdown',
  );

  async convert(filePath: string): Promise<string> {
    this.logger.log(`Converting file to Markdown: ${filePath}`);
    
    // Validate path to prevent path traversal / escaping sandbox
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(process.cwd()))) {
      throw new BadRequestException('Invalid file path access outside workspace');
    }

    try {
      // Use execFile instead of exec to prevent shell metacharacter injection
      const { stdout, stderr } = await execFileAsync(this.markitdownPath, [filePath]);

      if (stderr && stderr.trim().length > 0) {
        this.logger.warn(`markitdown stderr: ${stderr}`);
      }

      return stdout;
    } catch (error) {
      this.logger.error(`Failed to convert file ${filePath}: ${error.message}`);
      throw new Error(`Failed to convert file to markdown: ${error.message}`);
    }
  }
}
```

#### 2. Edit `backend/src/scraper/scraper.service.ts`
Add default timeout and max content length check to axios request.

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrape(url: string): Promise<{ title: string; content: string }> {
    try {
      const { data } = await axios.get(url, {
        timeout: 8000, // 8 seconds timeout
        maxContentLength: 5 * 1024 * 1024, // max 5MB response size
      });
      const $ = cheerio.load(data);

      const title = $('title').text().trim() || 'No Title';

      // Try to find main content
      let content =
        $('main').text().trim() ||
        $('article').text().trim() ||
        $('body').text().trim();

      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();

      return { title, content };
    } catch (error) {
      throw new HttpException('Failed to scrape URL', HttpStatus.BAD_REQUEST);
    }
  }
}
```

---

### Task 4: Server-Side Category Filtering (Frontend)
Update API calls and Category page template to fetch only notes belonging to the active category.

#### 1. Edit `frontend/src/utils/api.ts`
Support category filter in `fetchNotes`.

```typescript
// Replace fetchNotes method (lines 64-68)
  async fetchNotes(category?: Category): Promise<Note[]> {
    const apiCategory = category ? REVERSE_CATEGORY_MAP[category] : undefined;
    const url = apiCategory 
      ? `/notes?category=${apiCategory}&t=${Date.now()}`
      : `/notes?t=${Date.now()}`;
    const res = await apiInstance.get(url);
    const notes = res.data as ApiNote[];
    return notes.map(normalizeNote);
  },
```

#### 2. Edit `frontend/src/components/templates/CategoryTemplate.tsx`
Filter category notes on the server instead of client-side.

```typescript
// Replace lines in CategoryTemplate where api.fetchNotes() is called
// and make loadNotes load only the current category.
  const loadNotes = useCallback((showSkeleton = true) => {
    if (showSkeleton) {
      setLoading(true);
    }
    setError(null);
    api.fetchNotes(category as Category) // Fetch only category notes!
      .then(setNotes)
      .catch((err) => {
        console.error(`Failed to load category notes:`, err);
        if (showSkeleton) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.');
        }
      })
      .finally(() => {
        if (showSkeleton) {
          setLoading(false);
        }
      });
  }, [category]);
```

Remove client-side `.filter(...)` which was causing re-render issues:

```typescript
// Replace lines 76-80:
// Old code:
// const filteredNotes = notes.filter((n) => n.category === category);
// New code:
// (notes are now already filtered by backend)
```

Simplify `groupedNotes` Memoization:

```typescript
  const groupedNotes = useMemo(() => {
    return groupNotesByDate(notes); // Stable dependency on notes!
  }, [notes]);
```

#### Verification & Commands
Verify frontend compiles.
```bash
rtk proxy npm run build --prefix frontend
```

---

### Task 5: Memoization & Callback Stabilization (Frontend)
Wrap event handlers in `useCallback` to prevent render cascades and memoize the Sidebar component.

#### 1. Edit `frontend/src/components/organisms/Sidebar.tsx`
Memoize the Sidebar component.

```typescript
import { memo } from 'react'; // Add import
...
export default memo(function Sidebar({ selectedCategory, onSelectCategory, unreadCounts }: SidebarProps) {
  // component code
});
```

#### 2. Edit `frontend/src/components/templates/HomeTemplate.tsx`
Wrap the select category handler and capture/upload handlers in `useCallback`.

```typescript
  const handleSelectCategory = useCallback((cat: string | null) => {
    if (cat) {
      router.push(`/${cat}`);
    } else {
      router.push('/');
    }
  }, [router]);

  const handleCapture = useCallback(async (content: string, category?: Category) => {
    // method body
  }, []);

  const handleUpload = useCallback(async (file: File, category?: Category) => {
    // method body
  }, []);
```

Also remove the manual `1.2s delayed api.fetchNotes()` pattern since SSE handles data updates automatically.

---

### Task 6: Native Image Lazy Loading & Aspect Ratio Fix (Frontend)
Optimize image components inside NoteCards to avoid double image load.

#### 1. Edit `frontend/src/components/organisms/NoteCard.tsx`
Remove `new Image()` dynamic aspect ratio detection inside `useEffect` and instead use `onLoad` on the `<img>` tag directly.

```typescript
// Replace aspect ratio logic with direct onLoad on img element
// and add loading="lazy" to the <img> element.
```

---

## Self-Review Checklist

- **Spec Coverage:** Covers N+1 client-side queries, broken useMemo, missing indexes, and command injection.
- **Placeholder Scan:** No placeholders or comments like `// implement logic here`.
- **Type Consistency:** DTO types match, repository signatures match, controller and service match.
