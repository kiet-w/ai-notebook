# 🐛 Bug Fixes — 2026-06-11

---

## BUG #1 — `content` field bị mất sau khi SSE event hoàn thành

### Triệu chứng
Sau khi upload file và AI phân tích xong, nội dung parsed (`content`) của NoteCard bị xóa trắng — hiển thị thành chuỗi rỗng `""`.

### Nguyên nhân
**3 nguyên nhân kết hợp:**

1. **Backend DTO thiếu field `content`:** `NoteResponseDto` và `NoteUpdatedEvent` không có field `content`, nên backend không trả về nội dung đã parse dù đã lưu vào DB.

2. **Frontend `normalizeNote` ghi đè:** Khi SSE event `note-updated` đến, hàm `normalizeNote` map `content: note.userInput ?? note.url ?? ''`. Vì event không có `userInput` hay `url`, `content` bị gán thành `''`, xóa sạch nội dung optimistic đang hiển thị.

3. **`aiTitle` ưu tiên sai:** Trong `processFileNote`, code ghi `aiTitle: file.originalname || aiResult.title` — do `file.originalname` luôn có giá trị nên AI title bị bỏ qua hoàn toàn.

### Cách sửa

**Backend — thêm `content` vào DTO và SSE event:**
```typescript
// note-response.dto.ts
content: string | null;

// sse-event.type.ts
export type NoteUpdatedEvent = {
  id: string;
  status: Status;
  aiTitle: string | null;
  category: Category;
  aiSummary: string | null;
  aiBullets: string[] | null;
  content: string | null;  // ← THÊM
};
```

**Backend — đảo thứ tự ưu tiên aiTitle:**
```typescript
// notes.service.ts
aiTitle: aiResult.title || file.originalname,  // AI title được ưu tiên
```

**Frontend — fix normalizeNote:**
```typescript
// api.ts
content: note.content ?? note.userInput ?? note.url ?? '',
```

---

## BUG #2 — `Unexpected token '`', "```json..." is not valid JSON`

### Triệu chứng
```
ERROR: Gemini analysis failed: Unexpected token '`', "```json\n{..." is not valid JSON
```

### Nguyên nhân
Khi gọi API qua local proxy/OpenRouter gateway, một số model trả về JSON được bọc trong markdown code block:
````
```json
{ "title": "..." }
```
````
Hàm `JSON.parse()` không xử lý được dấu backtick nên crash.

### Cách sửa
Strip markdown wrapper trước khi parse:

```typescript
// ai.service.ts
let cleanText = responseText.trim();
if (cleanText.startsWith('```')) {
  cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
}
const analysis = JSON.parse(cleanText);
```

---

## BUG #3 — Zod validation: `title` undefined, `summary` received object, `bullets` undefined

### Triệu chứng
```
ERROR: Failed to process file note: [
  { "path": ["title"], "message": "Invalid input: expected string, received undefined" },
  { "path": ["summary"], "message": "Invalid input: expected string, received object" },
  { "path": ["bullets"], "message": "Invalid input: expected array, received undefined" }
]
```

### Nguyên nhân
Khi API request đi qua gateway/proxy trung gian, tham số `responseSchema` trong config của Gemini SDK bị **bỏ qua** trước khi gửi lên model. Model không biết cấu trúc JSON cần trả về nên tự sinh ra field tên ngẫu nhiên (vd: `description` thay vì `summary`, `keyPoints` thay vì `bullets`).

### Cách sửa
Mô tả JSON schema **trực tiếp trong `systemInstruction`** để model luôn nhận được dù proxy có strip `responseSchema`:

```typescript
systemInstruction: 'You are a knowledge parsing assistant...\n\n' +
  'You MUST respond with a JSON object matching the following structure:\n' +
  '{\n' +
  '  "title": "A string representing a concise title",\n' +
  '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
  '  "bullets": ["An array of strings representing key bullet points"],\n' +
  '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER"\n' +
  '}',
```

Đồng thời thêm Zod validation error logging để debug:
```typescript
try {
  return AiAnalysisSchema.parse(analysis);
} catch (validationError) {
  this.logger.error(`Validation failed. Raw JSON: ${cleanText}`);
  throw validationError;
}
```

---

## BUG #4 — `invalid token` / `aiproxy_error` khi upload ảnh

### Triệu chứng
```
ERROR: Gemini image analysis failed: {"error":{"message":"invalid token","type":"aiproxy_error"}}
```

### Nguyên nhân
Server NestJS **đang chạy từ trước khi** file `.env` được cập nhật API key mới. Node.js cache `process.env` khi khởi động — dù `nest start --watch` tự reload code khi file `.ts` thay đổi, nó **KHÔNG** reload biến môi trường từ `.env`. Server vẫn dùng token cũ (đã hết hạn) gửi lên API proxy.

### Cách sửa
Kill toàn bộ process đang chiếm port 3001 và restart server để nạp `.env` mới:
```bash
kill -9 $(lsof -t -i :3001)
npm run start:dev
```

---

## BUG #5 — Ảnh paste vào nhưng không phân tích được (`markitdown` trả về rỗng)

### Triệu chứng
```
The request to parse the document could not be completed because no document content was provided.
```

### Nguyên nhân
`markitdown` (thư viện Python) không có OCR engine (Tesseract/EasyOCR) nên khi nhận ảnh, nó trả về chuỗi **rỗng** `""`. Khi AI nhận chuỗi rỗng, nó báo "no document content provided".

### Cách sửa
Phát hiện MIME type ảnh và **bypass markitdown hoàn toàn** — gửi Buffer ảnh trực tiếp lên Gemini/Groq multimodal API:

```typescript
// notes.service.ts
if (file.mimetype.startsWith('image/')) {
  // Gửi thẳng buffer lên multimodal AI, không qua markitdown
  aiResult = await this.aiService.analyzeImage(file.buffer, file.mimetype);
  markdownContent = aiResult.content || `[Image: ${file.originalname}]`;
} else {
  // PDF, Word, etc. → dùng markitdown như bình thường
  const markdownContent = await this.markitdownService.convert(tempFilePath);
  aiResult = await this.aiService.analyze(markdownContent);
}
```

---

## BUG #6 — Groq vision model `llama-3.2-11b-vision-preview` trả về 400 error

### Triệu chứng
```
ERROR: Image analysis failed: Request failed with status code 400
```

### Nguyên nhân
Model `llama-3.2-11b-vision-preview` **không còn available** trên Groq API (bị deprecated/removed). Gọi đến model không tồn tại → 400 Bad Request.

### Cách sửa
Kiểm tra danh sách models thực tế từ Groq:
```bash
curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $KEY"
```

Kết quả cho thấy model vision hiện tại là `meta-llama/llama-4-scout-17b-16e-instruct`. Cập nhật và thêm fallback:

```typescript
try {
  // Thử vision model mới nhất
  const visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
  // ... gọi với base64 image
  return response.data.choices[0].message.content;
} catch (visionErr) {
  this.logger.warn(`Vision failed: ${errDetail}, falling back to text`);
  // Fallback: dùng text model với prompt mô tả
  return fallbackResponse.data.choices[0].message.content;
}
```

---

## BUG #7 — `EADDRINUSE: address already in use :::3001`

### Triệu chứng
Server crash ngay khi khởi động với lỗi port đã được dùng.

### Nguyên nhân
Agent (AI assistant) đã chạy nhiều lần `npm run start:dev` dưới dạng background task, tạo ra **3 instance server** đang chạy song song, tất cả cùng cạnh tranh port 3001.

### Cách sửa
1. Kill tất cả background task của agent
2. Kill toàn bộ process trên port 3001
3. Chỉ **chạy 1 lần duy nhất** trong terminal của user:

```bash
kill -9 $(lsof -t -i :3001 2>/dev/null) 2>/dev/null
npm run start:dev
```

> ⚠️ **Bài học:** Không để agent tự khởi động server dưới dạng background task — luôn để user tự chạy trong terminal của họ.

---

## BUG #8 — Note biến mất sau khi được tạo ở trang Category

### Triệu chứng
Khi người dùng tạo note mới từ trang Category (ví dụ `/Cooking` hoặc `/Tech`):
1. Note ban đầu hiển thị dưới dạng card tạm thời (optimistic note) và note thật với `status: 'PROCESSING'`.
2. Khoảng vài giây sau, note đột ngột **biến mất hoàn toàn khỏi màn hình**.

### Nguyên nhân
**1. Filter logic ở frontend:**
Ở `CategoryTemplate.tsx`, danh sách note được lọc theo điều kiện:
```typescript
const filteredNotes = notes.filter((n) => n.category === category || n.status === 'PROCESSING' || n.status === 'FAILED');
```
*   Khi note mới được tạo, backend trả về `category: 'OTHER'` (default) và `status: 'PROCESSING'`. Do `status === 'PROCESSING'`, note thỏa mãn filter và hiển thị trên màn hình.
*   Khi AI xử lý xong, backend gửi sự kiện SSE cập nhật note thành `status: 'COMPLETED'` và gán lại `category` phù hợp (ví dụ AI gán category là `TECH` khi người dùng đang ở trang `Cooking`).
*   Lúc này, note chuyển sang `status: 'COMPLETED'` và `category: 'Tech'`. Khi so khớp với filter hiện tại ở trang `/Cooking` (`n.category === 'Cooking'`), cả 3 điều kiện đều `FALSE`. Kết quả là note bị ẩn khỏi màn hình.

**2. Sự kiện SSE thiếu trường dữ liệu (`createdAt`):**
*   SSE event `toNoteUpdatedEvent` từ backend gửi đi không chứa trường `createdAt`.
*   Khi frontend nhận sự kiện thông qua `useSSE` và xử lý cập nhật trạng thái bằng `handleNoteUpdated`, note cũ trong danh sách (đang có đầy đủ `createdAt`) bị thay thế bằng object note mới từ sự kiện SSE (vốn có `createdAt: undefined`). Điều này làm mất đi ngày tạo note ở footer của card.

### Cách sửa

1. **Backend — Bổ sung `createdAt` vào SSE Event:**
    *   Cập nhật `NoteUpdatedEvent` type tại [sse-event.type.ts](file:///home/baudui/Downloads/project/brain/backend/src/notes/types/sse-event.type.ts):
        ```typescript
        export type NoteUpdatedEvent = {
          id: string;
          status: Status;
          aiTitle: string | null;
          category: Category;
          aiSummary: string | null;
          aiBullets: string[] | null;
          content: string | null;
          createdAt: Date; // ← Thêm createdAt
        };
        ```
    *   Cập nhật phương thức `toNoteUpdatedEvent` trong [notes.service.ts](file:///home/baudui/Downloads/project/brain/backend/src/notes/notes.service.ts) để gửi kèm `createdAt`:
        ```typescript
        private toNoteUpdatedEvent(note: Note): NoteUpdatedEvent {
          const aiBullets = note.aiBullets ? (JSON.parse(note.aiBullets as string) as string[]) : null;
          return {
            id: note.id,
            status: note.status as Status,
            aiTitle: note.aiTitle,
            category: note.category,
            aiSummary: note.aiSummary,
            aiBullets,
            content: note.content,
            createdAt: note.createdAt, // ← Thêm createdAt
          };
        }
        ```

2. **Frontend — Track Note mới được tạo để bỏ qua Filter:**
    Tại [CategoryTemplate.tsx](file:///home/baudui/Downloads/project/brain/frontend/src/components/templates/CategoryTemplate.tsx), sử dụng một `useRef` hoặc `useState` để lưu trữ danh sách IDs của các note được tạo trong phiên làm việc hiện tại tại trang đó.
    *   Thêm state track `createdNoteIds`:
        ```typescript
        const [createdNoteIds, setCreatedNoteIds] = useState<Set<string>>(new Set());
        ```
    *   Khi `api.createNote()` thành công, thêm ID của note vào `createdNoteIds`:
        ```typescript
        const realNote = await api.createNote(content);
        setCreatedNoteIds((prev) => new Set([...prev, realNote.id]));
        ```
    *   Cập nhật hàm lọc để luôn hiển thị các note có ID nằm trong `createdNoteIds`:
        ```typescript
        const filteredNotes = notes.filter(
          (n) => n.category === category || 
                 n.status === 'PROCESSING' || 
                 n.status === 'FAILED' || 
                 createdNoteIds.has(n.id) // ← Giữ lại note vừa tạo
        );
        ```

---

## BUG #9 — Giao diện không tải API trừ khi Refresh trang (API Caching & Category Navigation)

### Triệu chứng
Khi truy cập trang web lần đầu hoặc chuyển hướng giữa các danh mục (Categories) ở Sidebar, dữ liệu ghi chú không tự động được tải từ API (giao diện hiển thị rỗng hoặc không đổi) cho đến khi người dùng Refresh (F5) lại trình duyệt.

### Nguyên nhân
1. **Trình duyệt Cache các request GET:** Trình duyệt tự động cache kết quả của request `GET /notes` được thực hiện thông qua Axios (bao gồm cả các lượt gọi cập nhật tự động sau 1.2s từ `window.setTimeout`). Khi không có cấu hình chống cache, trình duyệt phục vụ dữ liệu đã lưu thay vì gửi request thực sự tới backend.
2. **Next.js tái sử dụng component:** Khi chuyển hướng giữa các Category khác nhau (ví dụ: từ `/Cooking` sang `/Tech`), do Next.js App Router tái sử dụng instance của [CategoryTemplate](file:///home/baudui/Downloads/project/brain/frontend/src/components/templates/CategoryTemplate.tsx) (vì cùng chung file route `/[category]/page.tsx`), `useEffect` tải ghi chú với dependency array rỗng `[]` không được kích hoạt lại. Ngoài ra, ref `localNoteIdsRef` không được giải phóng gây rò rỉ note cũ sang danh mục mới.

### Cách sửa

1. **Backend & Frontend API Client — Vô hiệu hóa cache:**
   Tại [api.ts](file:///home/baudui/Downloads/project/brain/frontend/src/utils/api.ts), thêm các headers vô hiệu hóa cache vào Axios instance và bổ sung tham số cache-buster (timestamp `?t=${Date.now()}`) vào các API GET:
   ```typescript
   const apiInstance = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
     headers: {
       'Cache-Control': 'no-cache, no-store, must-revalidate',
       'Pragma': 'no-cache',
       'Expires': '0',
     }
   });

   // Trong api.fetchNotes()
   const res = await apiInstance.get(`/notes?t=${Date.now()}`);
   // Trong api.fetchNoteById(id)
   const res = await apiInstance.get(`/notes/${id}?t=${Date.now()}`);
   ```
2. **Frontend Router — Ép buộc Remount và cấu hình Dynamic:**
   - Tại [/[category]/page.tsx](file:///home/baudui/Downloads/project/brain/frontend/src/app/[category]/page.tsx), thêm `export const dynamic = 'force-dynamic';` và truyền `key={normalizedCategory}` vào component `CategoryTemplate` để ép buộc React hủy bỏ và tạo mới component khi chuyển danh mục.
   - Tại [/page.tsx](file:///home/baudui/Downloads/project/brain/frontend/src/app/page.tsx), thêm `export const dynamic = 'force-dynamic';`.

---

## BUG #10 — Zod validation failed: `invalid_type: expected string, received object` ở trường `content` khi phân tích ảnh

### Triệu chứng
Khi upload hình ảnh lên hệ thống để phân tích, backend báo lỗi validation của Zod và Note bị cập nhật trạng thái `FAILED`:
```
Image analysis failed: [{"expected": "string", "code": "invalid_type", "path": ["content"], "message": "Invalid input: expected string, received object"}]
```

### Nguyên nhân
Mô hình AI (đặc biệt là các model Llama qua Groq khi không có sự kiểm soát schema nghiêm ngặt ở tầng API gateway của Google) đọc được các chỉ dẫn định dạng Markdown (`###`, `####`, `-`) trong system prompt và hiểu lầm rằng trường `"content"` cần được tổ chức thành một đối tượng JSON lồng nhau (nested JSON object) thay vì một chuỗi văn bản Markdown phẳng (escaped string). Khi Zod kiểm tra kiểu dữ liệu của JSON trả về, nó phát hiện kiểu `object` sai khác với kiểu `string` trong schema và ném lỗi xác thực.

### Cách sửa
1. **Backend Prompt — Thắt chặt chỉ định kiểu dữ liệu:**
   Bổ sung dòng lưu ý rõ ràng vào system prompt cho cả Groq và Gemini tại [ai.service.ts](file:///home/baudui/Downloads/project/brain/backend/src/ai/ai.service.ts):
   `IMPORTANT: The "content" field MUST be a single raw text string containing Markdown. It MUST NOT be a JSON object or JSON array.`
2. **Backend Code — Cơ chế tự phục hồi dữ liệu (Self-Healing Parser):**
   Tại [ai.service.ts](file:///home/baudui/Downloads/project/brain/backend/src/ai/ai.service.ts), viết hàm đệ quy `convertObjectToMarkdown` để chuyển đổi tự động bất kỳ JSON object nào thành Markdown phẳng nếu AI lỡ trả về đối tượng, và chèn kiểm tra phòng vệ trước khi Zod validate:
   ```typescript
   const analysis = JSON.parse(cleanText);
   if (analysis && typeof analysis.content === 'object' && analysis.content !== null) {
     analysis.content = convertObjectToMarkdown(analysis.content);
   }
   return AiAnalysisSchema.parse(analysis);
   ```

---

## BUG #11 — Giao diện kẹt khung xương (skeletons) khi máy tính ngủ hoặc mất mạng tạm thời

### Triệu chứng
Nếu để mở trang web trong thời gian dài (máy tính ngủ hoặc mất mạng tạm thời rồi kết nối lại), giao diện sẽ bị treo vĩnh viễn ở trạng thái hiển thị 3 khối khung xương (skeleton loaders) mà không tự động khôi phục dữ liệu, bắt buộc phải tải lại trang (Refresh).

### Nguyên nhân
1. **Thiếu Axios Timeout:** Request GET gửi lên máy chủ bị ngắt nửa chừng (half-open) do chế độ ngủ của hệ điều hành. Do không cấu hình `timeout`, request bị treo vĩnh viễn ở trạng thái `pending`, khiến Promise của request không bao giờ resolve hay reject. Dẫn tới callback `.finally(() => setLoading(false))` không được gọi và màn hình bị kẹt ở trạng thái loading.
2. **Không tự động refetch khi có kết nối lại:** Thiết bị mất mạng tạm thời hoặc tab bị ngủ không tự động tải lại dữ liệu nền khi tab được kích hoạt lại (window focus) hoặc mạng kết nối lại (online status).

### Cách sửa
1. **Cấu hình timeout cho Axios:**
   Thêm `timeout: 10000` (10 giây) vào Axios config ở [api.ts](file:///home/baudui/Downloads/project/brain/frontend/src/utils/api.ts).
2. **Tự động Refetch trên Window Focus/Online và bổ sung giao diện Báo lỗi:**
   - Tại [HomeTemplate.tsx](file:///home/baudui/Downloads/project/brain/frontend/src/components/templates/HomeTemplate.tsx) và [CategoryTemplate.tsx](file:///home/baudui/Downloads/project/brain/frontend/src/components/templates/CategoryTemplate.tsx), thêm lắng nghe các sự kiện `focus` và `online` trên `window` để tự động làm mới dữ liệu dưới nền (silent background refresh) giúp ứng dụng tự hồi phục dữ liệu.
   - Thêm state `error` và hiển thị một panel báo lỗi kết nối trực quan kèm nút **"Thử lại ngay"** khi request thất bại (thay vì kẹt vô hạn ở skeletons loader).

