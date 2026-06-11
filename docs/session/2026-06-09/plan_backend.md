# Backend Plan: Secondary Brain

## Nhiệm vụ (Tasks)

### 1. Hoàn thiện AI Service (Đã hoàn thành phần lõi)
- Đã cài đặt `@google/genai` và `zod-to-json-schema`.
- Đã hoàn thành hàm `analyze` dùng **Structured Output**.

### 2. Tích hợp AiService vào Quy trình tạo Ghi chú
- Đảm bảo `NotesService` đang lưu Note vào DB qua `NotesRepository` (status `PROCESSING`).
- Gọi ngầm `AiService.analyze(content)`.
- Cập nhật lại dữ liệu bằng `NotesRepository.update()` (status `COMPLETED`).
- Xử lý lỗi (nếu có rate limit) -> `FAILED`.

### 3. Xây dựng API "Hỏi đáp với Secondary Brain"
- Tạo endpoint `POST /notes/search` trong `NotesController`.
- Controller nhận chuỗi query (VD: "Tuần trước tôi học gì?").
- `NotesService` sẽ lấy 20 Notes gần nhất từ Database.
- Đẩy nội dung các Notes này vào System Prompt làm Context cho Gemini.
- Trả về câu trả lời tổng hợp cho Frontend.
