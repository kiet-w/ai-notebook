# Plan: Tích hợp AI Agent "Secondary Brain" với Google Gemini 2.0 Flash

## 1. Mục tiêu (Goal)
Xây dựng một tính năng "Secondary Brain" giúp tự động phân tích, phân loại, tóm tắt và trích xuất thông tin quan trọng từ dữ liệu người dùng nhập vào.
- **Sử dụng:** Google Gemini 2.0 Flash.
- **Ưu điểm:** Context window siêu lớn (1M tokens) cho phép nhồi lượng lớn ngữ cảnh/ghi chú cũ để AI hiểu sâu hơn; API hoàn toàn miễn phí (60 req/phút); tốc độ cực nhanh.

## 2. Kiến trúc & Công nghệ
- **Backend (NestJS):** Gọi Gemini API thông qua SDK `@google/genai`.
- **Database (Prisma/Supabase):** Đã có sẵn model `Note` với các trường như `aiTitle`, `aiSummary`, `aiBullets`, `category` phù hợp lưu trữ kết quả đầu ra của AI.
- **Frontend (Next.js):** Giao diện cho phép nhập "dump" mọi ý tưởng (brain dump) và hiển thị kết quả AI đã phân tích.

## 3. Các bước triển khai (Implementation Steps)

### Bước 1: Chuẩn bị môi trường & API Key
- Lấy API Key từ [Google AI Studio](https://aistudio.google.com).
- Thêm `GEMINI_API_KEY=your_api_key_here` vào file `backend/.env`.
- Cài đặt SDK chính thức của Google: `bun add @google/genai` trong thư mục backend.

### Bước 2: Xây dựng AI Agent Service (`ai.service.ts`)
- Cập nhật file `src/notes/ai.service.ts` hiện tại (đang dùng mock).
- Khởi tạo Google Gen AI client.
- Viết hàm `analyze(content: string)`:
  - **System Prompt:** Chỉ định AI đóng vai trò một "Secondary Brain" chuyên gia quản lý kiến thức.
  - **Structured Output (Khuyên dùng):** Thay vì yêu cầu AI trả về text rồi dùng Regex để bóc tách JSON (`replace(/```json/g)`), ta sẽ dùng tính năng `responseSchema` của Gemini kết hợp với `responseMimeType: "application/json"`. Nó ép AI 100% trả về JSON chuẩn xác theo Zod Schema định sẵn, không bao giờ bị lỗi parse.

### Bước 3: Tích hợp vào Quy trình tạo Ghi chú (Notes Module)
- **Cấu trúc Prisma:** Sử dụng `PrismaService` duy nhất được export từ `PrismaModule` để share toàn app, tránh connection pool leak.
- **Repository Pattern:** `NotesService` sẽ gọi `NotesRepository` (đã kế thừa `BaseRepository`) thay vì gọi trực tiếp Prisma.
- **Async Workflow:** (Đã có sẵn trong `NotesService`)
  1. `NotesService.create()` nhận request, dùng `NotesRepository` lưu note vào DB với trạng thái `PROCESSING`.
  2. Trả response ngay cho frontend để user không bị block.
  3. Dùng `setImmediate` chạy ngầm hàm `processNote()`.
  4. Trong `processNote()`, gọi `AiService.analyze()` để lấy `title`, `summary`, `bullets`, `category`.
  5. Dùng `NotesRepository.update()` cập nhật lại dữ liệu và đổi status thành `COMPLETED`.
  6. Nếu bị Rate Limit (429) hoặc lỗi, catch và update status thành `FAILED` để user thử lại sau.

### Bước 4: Xây dựng tính năng "Hỏi đáp với Secondary Brain" (Natural Language Search)
- Tạo endpoint `POST /ai/chat` hoặc `POST /notes/search`.
- Cho phép Frontend gửi câu hỏi.
- Gửi cho Gemini làm ngữ cảnh cùng với câu hỏi, và trả về câu trả lời tổng hợp.

### Bước 5: Cập nhật Frontend (Next.js)
- Thêm thanh tìm kiếm bằng ngôn ngữ tự nhiên.
- Hiển thị danh sách các notes với `aiTitle`, các gạch đầu dòng `aiBullets` và `aiSummary` thật đẹp.

## 4. Rủi ro & Lưu ý
- **Rate Limit:** Gemini Free có giới hạn 60 request/phút. Cần có cơ chế queue nhẹ (nếu gửi hàng loạt) hoặc hiển thị lỗi thân thiện với người dùng.
- **Zod to JSON Schema Conversion:** Gemini SDK yêu cầu `responseSchema` phải ở dạng JSON Schema. Bắt buộc phải dùng hàm `zodToJsonSchema(schema)` để convert Zod Schema trước khi truyền vào API, nếu truyền trực tiếp Object Zod sẽ bị lỗi parse và gây gián đoạn luồng chạy.
- **Giới hạn Context Notes (Technical Debt):** Mặc dù Gemini 2.0 Flash có cửa sổ ngữ cảnh lên tới 1M token, việc nhồi toàn bộ (ví dụ: hàng trăm) notes của người dùng vào một prompt để phân loại hoặc hỏi đáp sẽ làm tăng dung lượng token gửi đi và dễ gây nhiễu kết quả ("Lost in the middle"). Giai đoạn đầu chỉ lấy 20 notes gần nhất làm context là ổn định, nhưng về sau nên cân nhắc kết hợp Vector Database (như `pgvector`) để trích xuất những notes thực sự liên quan làm ngữ cảnh.
