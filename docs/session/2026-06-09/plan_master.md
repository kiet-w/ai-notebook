# Master Plan: Secondary Brain Integration

## 1. Mục tiêu (Goal)
Tích hợp Google Gemini 2.0 Flash để làm Secondary Brain phân loại, tóm tắt và cho phép người dùng hỏi đáp (Natural Language Search) với ghi chú của mình.

## 2. Kiến trúc tổng thể
- **Backend (NestJS):** Xử lý luồng tạo Note, gọi API Gemini (`@google/genai`) qua `AiService` để lấy Structured Output (JSON). Cung cấp API `/notes/search` cho hỏi đáp.
- **Frontend (Next.js):** Giao diện hiển thị danh sách Note (Title, Summary, Bullets) và thanh tìm kiếm bằng ngôn ngữ tự nhiên.

## 3. Phân chia Sub-Plans
Chi tiết kỹ thuật và các bước triển khai đã được chia nhỏ thành 2 kế hoạch riêng biệt:
- [Kế hoạch Backend (plan_backend.md)](./plan_backend.md)
- [Kế hoạch Frontend (plan_frontend.md)](./plan_frontend.md)
