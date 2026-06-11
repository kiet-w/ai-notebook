# Frontend Plan: Secondary Brain

## Nhiệm vụ (Tasks)

### 1. Cập nhật UI hiển thị danh sách Ghi chú (Notes)
- Lấy dữ liệu từ Backend (`GET /notes` hoặc qua SSE).
- Hiển thị các trường dữ liệu do AI tạo ra: `aiTitle`, `aiSummary`, và danh sách `aiBullets`.
- Áp dụng phong cách thiết kế **Premium / Glassmorphism** theo đúng chuẩn dự án (UI hiện đại, dark mode, hiệu ứng mờ kính).

### 2. Xây dựng Thanh tìm kiếm Ngôn ngữ tự nhiên (Natural Language Search)
- Tạo một UI Search Bar nổi bật.
- Khi người dùng gõ câu hỏi và submit, gọi API `POST /notes/search` của Backend.
- Hiển thị phần "AI Trả lời" (Answer) sinh động.
- Cần có trạng thái Loading đẹp mắt trong lúc chờ Gemini xử lý.
