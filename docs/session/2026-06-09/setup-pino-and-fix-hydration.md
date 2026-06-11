# Fix Hydration Error and Setup Pino Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Next.js hydration mismatch on the Search button and configure `nestjs-pino` as the central logger for the NestJS backend.

**Architecture:** We use a simple `mounted` state pattern in React to ensure the client matches the server during initial hydration for the disabled state of the search button. For the backend, we inject `nestjs-pino` into the global Nest application context to replace the default logger, buffering initial bootstrap logs until Pino is ready.

**Tech Stack:** React, Next.js, NestJS, pino, nestjs-pino

---

### Task 1: Fix Next.js Hydration Mismatch

**Files:**
- Modify: `frontend/src/components/organisms/SearchSection.tsx`

- [ ] **Step 1: Update SearchSection to use mounted state**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';

export default function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setAnswer(null);

    try {
      const res = await api.searchNotes(query);
      setAnswer(res.answer);
    } catch (error) {
      console.error('Search failed:', error);
      setAnswer('Sorry, something went wrong while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mb-12 w-full max-w-3xl mx-auto">
      <form 
        onSubmit={handleSearch} 
        className="relative group flex items-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-sm transition-all hover:shadow-md hover:bg-white/80 dark:hover:bg-zinc-900/80"
      >
        <div className="pl-4 pr-2 text-zinc-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI anything about your notes..."
          className="flex-1 bg-transparent border-none outline-none text-foreground text-lg px-2 placeholder:text-zinc-400"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={!mounted ? true : (!query.trim() || isSearching)}
          className="bg-foreground text-background p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      {/* AI Answer Section */}
      {(isSearching || answer) && (
        <div className="mt-6 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 backdrop-blur-xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0 pt-2">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                AI Assistant
                {isSearching && (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </h4>
              
              {isSearching ? (
                <div className="space-y-2 mt-3">
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-full animate-pulse" />
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-4/6 animate-pulse" />
                </div>
              ) : (
                <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                  {answer}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run frontend build to verify syntax**

Run: `cd frontend && rtk proxy bun run build`
Expected: Successful build, no syntax errors.

- [ ] **Step 3: Commit Frontend Fix**

```bash
cd frontend
git add src/components/organisms/SearchSection.tsx
git commit -m "fix: resolve hydration mismatch on search button disabled state"
```

### Task 2: Setup Pino in Backend

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Install Pino packages**

Run: `cd backend && rtk proxy bun add nestjs-pino pino-http pino-pretty`
Expected: Packages install successfully.

- [ ] **Step 2: Update AppModule**

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    PrismaModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Update main.ts to use Pino Logger**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

- [ ] **Step 4: Run backend build to verify**

Run: `cd backend && rtk proxy bun run build`
Expected: Successful build.

- [ ] **Step 5: Commit Backend Setup**

```bash
cd backend
git add package.json bun.lockb src/app.module.ts src/main.ts
git commit -m "chore: setup nestjs-pino for structured logging"
```
