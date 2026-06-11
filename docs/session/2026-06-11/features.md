# ✨ Features Implemented — 2026-06-11

---

## FEATURE #1 — Phân tích nội dung file tự động bằng AI (MarkItDown + Gemini)

### Mục tiêu
Khi user upload file (PDF, Word, txt...), hệ thống tự động:
1. Parse file thành Markdown text bằng Microsoft MarkItDown
2. Gửi nội dung lên Gemini/Groq để phân tích
3. Điền tự động `title`, `summary`, `bullets`, `category`, `content` vào NoteCard

### Kiến trúc

```
User upload file
  → NestJS Controller (POST /notes/upload)
  → NotesService.createFromFile()
    → repository.create({ status: PROCESSING })
    → processFileNote() [async, non-blocking]
      ├─ [image/*] → AiService.analyzeImage(buffer, mimeType)
      └─ [other]   → MarkitdownService.convert(tempFilePath)
                      → AiService.analyze(markdownContent)
  → SSE event stream → Frontend cập nhật NoteCard realtime
```

### Chi tiết implementation

**`MarkitdownService`** — gọi Python CLI:
```typescript
// markitdown.service.ts
async convert(filePath: string): Promise<string> {
  const { stdout } = await execAsync(
    `${this.pythonPath} -m markitdown "${filePath}"`
  );
  return stdout;
}
```

**`NotesService.processFileNote`** — phân nhánh theo MIME type:
```typescript
if (file.mimetype.startsWith('image/')) {
  aiResult = await this.aiService.analyzeImage(file.buffer, file.mimetype);
  markdownContent = aiResult.content || `[Image: ${file.originalname}]`;
} else {
  // Ghi tạm ra /tmp, convert, xóa
  tempFilePath = join(tmpdir(), `${note.id}-${file.originalname}`);
  await fs.writeFile(tempFilePath, file.buffer);
  markdownContent = await this.markitdownService.convert(tempFilePath);
  await fs.unlink(tempFilePath);
  aiResult = await this.aiService.analyze(markdownContent);
}
```

**SSE Event stream** — frontend nhận kết quả realtime:
```typescript
// Sau khi AI phân tích xong
this.events$.next(this.toNoteUpdatedEvent(updatedNote));
// Frontend nhận qua GET /notes/events (Server-Sent Events)
```

---

## FEATURE #2 — Phân tích ảnh multimodal bằng Gemini/Groq Vision

### Mục tiêu
Khi user upload hoặc paste ảnh, AI tự động đọc nội dung trong ảnh (OCR + hiểu ngữ cảnh), trích xuất toàn bộ text, giải thích từng mục bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh.

### Method mới: `AiService.analyzeImage()`

```typescript
async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<AiAnalysis> {
  if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
    // Route sang Groq Vision (llama-4-scout)
    return this.callGroq(systemInstruction, prompt, true, { data: imageBuffer, mimeType });
  } else {
    // Route sang Gemini Multimodal
    return this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
        prompt
      ]
    });
  }
}
```

### System Prompt tối ưu cho OCR chi tiết:
```
You are a meticulous knowledge extraction assistant.
- READ EVERY WORD visible in the image
- Keep ALL technical terms in ENGLISH
- Write explanations in Vietnamese
- "content": Reproduce COMPLETE Markdown with ##/### headings, bullet points
- "bullets": List every fact with specific metrics
  (e.g., "Binary Search: O(log n), ~7 comparisons for 100 elements")
```

### AiAnalysisSchema — thêm field `content` optional:
```typescript
export const AiAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  category: z.nativeEnum(Category),
  content: z.string().optional(),  // ← THÊM cho ảnh
});
```

---

## FEATURE #3 — Ctrl+V Paste ảnh trực tiếp vào input

### Mục tiêu
Cho phép user copy ảnh từ bất kỳ đâu (screenshot, trình duyệt, file manager...) và paste thẳng vào ô input của app bằng `Ctrl+V` — không cần click nút upload.

### Implementation trong `NoteInput.tsx`:

```typescript
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const files = e.clipboardData.files;
  if (files && files.length > 0) {
    // Ưu tiên lấy ảnh trước, fallback sang file bất kỳ
    const file = Array.from(files).find(f => f.type.startsWith('image/')) || files[0];
    if (file && onUpload) {
      e.preventDefault();  // Ngăn paste text
      onUpload(file);       // Gọi upload handler bình thường
    }
  }
};

// Gắn vào Input component
<Input
  onPaste={handlePaste}
  placeholder="Capture a thought... (Enter to save, Ctrl+V to paste image)"
  ...
/>
```

### Luồng hoàn chỉnh:
```
User Ctrl+V ảnh
  → handlePaste() nhận ClipboardEvent
  → Trích xuất File object từ clipboardData.files
  → Gọi onUpload(file) → gọi POST /notes/upload
  → Backend nhận buffer ảnh → analyzeImage() → Groq Vision
  → SSE event → Frontend cập nhật NoteCard
```

---

## FEATURE #4 — Dual-routing AI: Groq hoặc Gemini tự động

### Mục tiêu
Hệ thống tự động phát hiện loại API key và route request đến đúng provider, không cần thay đổi code khi chuyển provider.

### Logic phát hiện:

```typescript
// Kiểm tra tiền tố của GEMINI_API_KEY
if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
  // → Groq API (openai-compatible)
} else {
  // → Google Gemini API (native SDK)
}
```

### Model mapping:

| Task | Groq key (`gsk_`) | Gemini key (`AIza`) |
|------|------------------|---------------------|
| Text/Doc analysis | `llama-3.1-8b-instant` | `gemini-2.0-flash` |
| Image/Vision | `meta-llama/llama-4-scout-17b-16e-instruct` | `gemini-2.0-flash` (multimodal) |
| Q&A | `llama-3.1-8b-instant` | `gemini-2.0-flash` |

### Groq helper method `callGroq()`:

```typescript
private async callGroq(
  systemInstruction: string,
  prompt: string,
  jsonMode = false,
  image?: { data: Buffer; mimeType: string }
): Promise<string> {
  if (image) {
    try {
      // Thử vision model
      return await groqVisionRequest(visionModel, image);
    } catch (err) {
      this.logger.warn(`Vision failed, fallback to text`);
      // Fallback sang text model
      return await groqTextRequest('llama-3.1-8b-instant');
    }
  }
  return await groqTextRequest('llama-3.1-8b-instant');
}
```

### Cấu hình `.env`:
```env
# Dùng Groq (miễn phí, reset hàng ngày 07:00 ICT)
GEMINI_API_KEY="gsk_xxxxxxxxxxxx"

# Hoặc dùng Google Gemini trực tiếp
GEMINI_API_KEY="AIzaSyxxxxxxxxxx"

# Hoặc dùng OpenRouter (proxy nhiều model)
GEMINI_API_KEY="sk-or-v1-xxxxxxxxxx"
GEMINI_API_BASE_URL=http://localhost:8081
```

---

## FEATURE #5 — `content` field được truyền End-to-End

### Mục tiêu
Nội dung đã parse từ file/ảnh được lưu vào DB, truyền qua SSE event, và hiển thị đúng trong NoteCard — không bị mất ở bất kỳ bước nào.

### Data flow hoàn chỉnh:

```
[DB] Note.content (string | null)
  ↓ controller.toResponseDto()
[API Response] NoteResponseDto.content
  ↓ GET /notes
[Frontend] ApiNote.content
  ↓ normalizeNote()
[Store] Note.content
  ↓ NoteCard render

[SSE] NoteUpdatedEvent.content
  ↓ onNoteUpdated handler
  ↓ normalizeNote()
[Store] Note.content updated realtime
```

### Key fix trong `normalizeNote`:
```typescript
// TRƯỚC (sai): bỏ qua content từ DB/SSE
content: note.userInput ?? note.url ?? '',

// SAU (đúng): ưu tiên content đã parse
content: note.content ?? note.userInput ?? note.url ?? '',
```
