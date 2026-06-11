# 5W1H Explanation & Image Analysis Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the AI parsing capabilities in the Second Brain backend to perform detailed 5W1H (Who, What, Where, When, Why, How) keyword explanations and visual diagram analysis, and display the result in a premium, collapsible Markdown view on the frontend.

**Architecture:** Update backend AI service prompts to structure the `content` output field with markdown containing 5W1H concept definitions and relationship reviews. Modify the backend notes service to save this enriched content. Create a custom inline Markdown renderer in the frontend `NoteCard` component with an expand/collapse toggle.

**Tech Stack:** NestJS, Next.js, TypeScript, Tailwind CSS, Axios.

---

### Task 1: Backend AI Prompts & Service Upgrades (5W1H & Image Analysis)

**Files:**
- Modify: `/home/baudui/Downloads/project/brain/backend/src/ai/ai.service.ts`
- Modify: `/home/baudui/Downloads/project/brain/backend/src/notes/notes.service.ts`

- [ ] **Step 1: Upgrade prompts in `ai.service.ts` for text and image analysis**

Modify `/home/baudui/Downloads/project/brain/backend/src/ai/ai.service.ts` to update the system instructions for Groq and Gemini to generate a structured markdown `content` field with 5W1H explanations and diagram analysis.

Replace lines 101 to 139 (for `analyze` Groq and Gemini instructions):
```typescript
      if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        const systemInstruction = 'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "A string representing a concise title",\n' +
          '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
          '  "bullets": ["An array of strings representing key bullet points/keywords"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
          '  "content": "A detailed Markdown document in Vietnamese explaining the core concepts. Structure it exactly as:\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who, What, Where, When, Why, How).\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích mối quan hệ\n- [Giải thích chi tiết mối quan hệ giữa các khái niệm, ví dụ tại sao vai trò này lại là sự kết hợp của các vai trò kia, hoặc cách chúng bổ trợ cho nhau]."\n' +
          '}';
        const prompt = `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`;
        cleanText = await this.callGroq(systemInstruction, prompt, true);
      } else {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`,
          config: {
            systemInstruction: 'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
              'You MUST respond with a JSON object matching the following structure:\n' +
              '{\n' +
              '  "title": "A string representing a concise title",\n' +
              '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
              '  "bullets": ["An array of strings representing key bullet points/keywords"],\n' +
              '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
              '  "content": "A detailed Markdown document in Vietnamese explaining the core concepts. Structure it exactly as:\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who, What, Where, When, Why, How).\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích mối quan hệ\n- [Giải thích chi tiết mối quan hệ giữa các khái niệm, ví dụ tại sao vai trò này lại là sự kết hợp của các vai trò kia, hoặc cách chúng bổ trợ cho nhau]."\n' +
              '}',
            responseMimeType: 'application/json',
            responseSchema: zodToJsonSchema(AiAnalysisSchema as any) as any,
          },
        });
```

Replace lines 159 to 204 (for `analyzeImage` Groq and Gemini instructions):
```typescript
      if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        const systemInstruction = 'You are a meticulous knowledge extraction assistant for a Second Brain application.\n\n' +
          'Your job is to READ EVERY WORD visible in the image and extract ALL content in full detail.\n' +
          'Rules:\n' +
          '- Keep ALL technical terms, algorithm names, framework names, and proper nouns in ENGLISH (do not translate them).\n' +
          '- Write explanations, summaries, and descriptions in Vietnamese.\n' +
          '- For the "content" field: produce a COMPLETE Markdown document in Vietnamese containing the extracted text followed by 5W1H keyword analysis and visual diagram analysis. Structure it exactly as:\n\n### 🖼️ Nội dung trích xuất từ ảnh\n[Văn bản, nhãn, số liệu chi tiết trích xuất từ ảnh]\n\n---\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who, What, Where, When, Why, How).\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích sơ đồ & Hình ảnh (Visual & Diagram Analysis)\n- [Giải thích chi tiết các mối quan hệ cấu trúc, luồng hoặc biểu đồ trong ảnh. Ví dụ: Nếu là sơ đồ Venn, giải thích chi tiết tại sao phần giao nhau lại là sự kết hợp của các vòng tròn bên ngoài, hoặc vai trò kết quả bổ sung năng lực gì từ các vai trò gốc].\n' +
          '- For the "bullets" field: list every key fact, metric, or concept shown (e.g. "Binary Search: O(log n)").\n\n' +
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "Concise title of the image content (Vietnamese ok)",\n' +
          '  "summary": "2-3 câu tóm tắt nội dung bức ảnh bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh",\n' +
          '  "bullets": ["Mỗi bullet là một thông tin CỤ THỂ trích từ ảnh"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
          '  "content": "Nội dung Markdown đầy đủ theo cấu trúc đã hướng dẫn ở trên."\n' +
          '}';
```
*(And make equivalent updates for the Gemini block under analyzeImage starting around line 190)*

- [ ] **Step 2: Update `notes.service.ts` to save the AI-generated `content` field**

In `/home/baudui/Downloads/project/brain/backend/src/notes/notes.service.ts`:
Modify the database save logic in `processNote` and `processFileNote` to store `aiResult.content` instead of just the raw original content.

Modify lines 73-80:
```typescript
      const updatedNote = await this.repository.update(note.id, {
        aiTitle: scrapeResult.title || aiResult.title,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content: aiResult.content || content,
        status: Status.COMPLETED,
      });
```

Modify lines 172-179:
```typescript
      const updatedNote = await this.repository.update(note.id, {
        aiTitle: aiResult.title || file.originalname,
        aiSummary: aiResult.summary,
        aiBullets: aiResult.bullets,
        category: note.category !== 'OTHER' ? note.category : aiResult.category,
        content: aiResult.content || markdownContent,
        status: Status.COMPLETED,
      });
```

- [ ] **Step 3: Commit backend changes**

Run:
```bash
git add backend/src/ai/ai.service.ts backend/src/notes/notes.service.ts
git commit -m "feat: upgrade backend prompts and service to support 5W1H explanation and diagram analysis"
```

---

### Task 2: Frontend Collapsible Markdown Reader

**Files:**
- Modify: `/home/baudui/Downloads/project/brain/frontend/src/components/organisms/NoteCard.tsx`

- [ ] **Step 1: Upgrade `NoteCard.tsx` component with Markdown rendering and expand toggle**

Modify `/home/baudui/Downloads/project/brain/frontend/src/components/organisms/NoteCard.tsx`:
1. Add state `const [isExpanded, setIsExpanded] = useState(false);`
2. Add a simple custom Markdown parsing renderer function `renderMarkdown(text)` and bold text parser `parseBoldText(text)`.
3. Swap the static `note.content` rendering block for the expandable UI panel.

Replace the content block in `NoteCard.tsx` (lines 95 to 102):
```typescript
      {note.content && (
        <div className="mb-4">
          {!isExpanded ? (
            <div>
              <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Preview</p>
                <p className="text-[14px] text-foreground/90 italic leading-relaxed line-clamp-2">
                  {note.content}
                </p>
              </div>
              <button 
                onClick={() => setIsExpanded(true)}
                className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <span>Xem giải thích 5W1H & Nội dung đầy đủ</span>
                <span>↓</span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nội dung chi tiết & Giải thích 5W1H</p>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  Thu gọn ↑
                </button>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                {renderMarkdown(note.content)}
              </div>
            </div>
          )}
        </div>
      )}
```

Also add the state import at the top of the file:
```typescript
import { useState } from 'react';
```
And add the helper parsing functions `renderMarkdown` and `parseBoldText` at the bottom of `NoteCard.tsx` (or before the default export):
```typescript
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#### ')) {
      return <h5 key={index} className="text-xs font-extrabold text-foreground mt-4 mb-1.5 uppercase tracking-wider">{trimmed.replace('#### ', '')}</h5>;
    }
    if (trimmed.startsWith('### ')) {
      return <h4 key={index} className="text-sm font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">{trimmed.replace('### ', '')}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={index} className="text-base font-bold text-foreground mt-6 mb-3">{trimmed.replace('## ', '')}</h3>;
    }
    if (trimmed.startsWith('- ')) {
      const bulletContent = trimmed.replace('- ', '');
      return (
        <ul key={index} className="list-disc pl-5 my-1">
          <li className="text-sm text-foreground/80 leading-relaxed">
            {parseBoldText(bulletContent)}
          </li>
        </ul>
      );
    }
    if (trimmed === '') {
      return <div key={index} className="h-2" />;
    }
    if (trimmed === '---') {
      return <hr key={index} className="my-4 border-border" />;
    }
    return <p key={index} className="text-sm text-foreground/80 my-1 leading-relaxed">{parseBoldText(line)}</p>;
  });
}
```

- [ ] **Step 2: Commit frontend changes**

Run:
```bash
git add frontend/src/components/organisms/NoteCard.tsx
git commit -m "feat: add collapsible markdown renderer to NoteCard with 5W1H support"
```

- [ ] **Step 3: Build & verify whole application compiles without errors**

Run:
```bash
cd frontend && npm run build && cd ../backend && npm run build
```
Expected: Frontend and Backend both compile successfully with exit code 0.
