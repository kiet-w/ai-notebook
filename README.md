# 🧠 AI Notebook

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**AI Notebook** là ứng dụng ghi chú thông minh thế hệ mới, kết hợp sức mạnh của Generative AI (Google Gemini & OpenRouter LLMs) với kiến trúc Full-Stack hiện đại. Ứng dụng hỗ trợ tự động phân tích ghi chú, phân loại danh mục, trích xuất cấu trúc (5W1H, nguyên liệu & bước nấu ăn,...), hỗ trợ tệp đa phương tiện (hình ảnh, âm thanh), đồng bộ thời gian thực qua WebSocket, đa ngôn ngữ (Tiếng Việt & Tiếng Anh), cùng khả năng đóng gói ứng dụng Desktop (Tauri).

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 🤖 AI-Powered Intelligence
- **Tự động phân loại & định dạng thông minh:** AI tự động nhận diện danh mục ghi chú (`TECH`, `COOKING`, `STUDY`, `WORK`, `LIFE`,...) và cấu trúc hoá nội dung phù hợp (ví dụ: TECH theo 5W1H, COOKING theo Ingredients & Steps).
- **Tuỳ chỉnh độ sâu phân tích (Detail Level):** Lựa chọn độ dài và chi tiết của nội dung phân tích: `SHORT`, `MEDIUM`, hoặc `LONG`.
- **Đa mô hình AI (Multi-Model AI Engine):**
  - Hỗ trợ **Google Gemini** (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`).
  - Hỗ trợ **OpenRouter** (`nemotron-3-ultra-550b-a55b:free`, `deepseek`,...).
  - Cơ chế tự động fallback khi gặp sự cố quota / rate limit.
- **Xử lý song song (`analyzeFast`):** Tối ưu thời gian phản hồi bằng việc xử lý trích xuất metadata và tạo nội dung Markdown song song.
- **Xử lý đa phương tiện:** Hỗ trợ nhận diện hình ảnh và tóm tắt nội dung từ liên kết web (Web Scraping).

### 💻 Frontend & Trải Nghiệm Người Dùng (UI/UX)
- **Atomic Design Architecture:** Cấu trúc thành phần UI chuẩn mực theo phân cấp `atoms`, `molecules`, `organisms`, `templates`.
- **Đa ngôn ngữ toàn diện (i18n):** Chuyển đổi ngôn ngữ Tiếng Việt (vi) và Tiếng Anh (en) mượt mà không cần reload trang.
- **Giao diện hiện đại & Tối ưu hiệu năng:**
  - Thiết kế Dark/Light mode tinh tế với Tailwind CSS v4.
  - Tối ưu bộ nhớ đối với tệp đính kèm và preview ảnh.
  - Hiển thị tương tác dạng lưới thẻ thông minh với chi tiết xem nhanh.
- **Thời gian thực (Real-time):** Tích hợp Socket.IO client cập nhật trạng thái ghi chú tức thì.

### 🛡️ Backend & Bảo Mật (Backend & Security)
- **NestJS Architecture:** Cấu trúc module rõ ràng (`ai`, `notes`, `user`, `parser`, `scraper`, `prisma`).
- **Xác thực & Uỷ quyền an toàn:** JWT Token lưu trong HttpOnly Cookie và Authorization Bearer Header, mã hoá mật khẩu với thuật toán an toàn Argon2.
- **Strict Data Validation:** Tất cả DTOs đều được kiểm tra chặt chẽ với `class-validator` và `class-transformer`.
- **Bảo mật nhiều lớp:** Rate Limiting (Throttler), CORS an toàn, Content Security Policy (CSP), và Security Headers.
- **Structured Logging:** Ghi log định dạng chuẩn bằng Pino Logger.

### 🖥️ Hỗ Trợ Đa Nền Tảng (Cross-Platform)
- Ứng dụng Web hiện đại trên trình duyệt (Next.js 16 SSR & CSR).
- Đóng gói ứng dụng Desktop gọn nhẹ cho macOS, Windows và Linux nhờ **Tauri v2**.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```
ai-notebook/
├── backend/                  # NestJS 11 Backend API Server
│   ├── prisma/               # Schema và Migrations Database (PostgreSQL)
│   ├── src/
│   │   ├── ai/               # AI Engine (Gemini, OpenRouter, Prompt Generators)
│   │   ├── common/           # Decorators, Guards, Interceptors, Filters
│   │   ├── notes/            # Quản lý ghi chú (CRUD, Search, Processing)
│   │   ├── parser/           # File parser, OCR, Audio processing
│   │   ├── prisma/           # Prisma Service & Database Client
│   │   ├── scraper/          # Cheerio Web Scraper
│   │   ├── user/             # Authentication, Profile & JWT Management
│   │   ├── app.module.ts     # Root Application Module
│   │   └── main.ts           # Application Entry Point & Security Setup
│   └── test/                 # Unit & E2E Tests
│
├── frontend/                 # Next.js 16 (App Router) + Tauri 2
│   ├── src-tauri/            # Cấu hình Desktop App với Tauri v2 (Rust)
│   ├── src/
│   │   ├── app/              # Next.js App Router Pages & Routes
│   │   ├── components/       # Atomic Design Components
│   │   │   ├── atoms/        # Base UI elements (Button, Input, Avatar,...)
│   │   │   ├── molecules/    # Composite items (NoteCard, FilterBar,...)
│   │   │   ├── organisms/    # Complex sections (Header, Sidebar, NoteGrid,...)
│   │   │   └── templates/    # Page layouts & structure
│   │   ├── context/          # React Context (AuthContext, LanguageContext,...)
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── lib/              # API Client, Socket Client, Utilities
│   │   ├── locales/          # Tệp bản dịch i18n (vi.ts, en.ts)
│   │   └── types/            # TypeScript Interface & Type Definitions
│   └── public/               # Static assets & icons
└── README.md
```

---

## 🛠️ Yêu Cầu Cài Đặt (Prerequisites)

- **Node.js:** `>= 20.x`
- **Package Manager:** `npm`, `pnpm`, hoặc `bun`
- **PostgreSQL:** `>= 15.x` (hoặc Docker PostgreSQL container)
- **Rust & Cargo** *(chỉ cần nếu muốn build Desktop app với Tauri)*

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Clone repository

```bash
git clone https://github.com/kiet-w/ai-notebook.git
cd ai-notebook
```

---

### 2. Cấu hình & Chạy Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

3. Tạo tệp cấu hình môi trường `.env`:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_notebook?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"

   # AI Provider Keys
   GEMINI_API_KEY="your-google-gemini-api-key"
   OPENROUTER_API_KEY="your-openrouter-api-key"

   # Optional Configs
   CORS_ORIGIN="http://localhost:3000"
   ```

4. Chạy migration cơ sở dữ liệu với Prisma:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Khởi động Backend server:
   ```bash
   npm run start:dev
   ```
   > Backend sẽ chạy tại: `http://localhost:3001` (API Endpoints sẵn sàng phục vụ).

---

### 3. Cấu hình & Chạy Frontend

1. Mở terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

3. Tạo tệp `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NEXT_PUBLIC_WS_URL="http://localhost:3001"
   ```

4. Khởi động Frontend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   > Truy cập ứng dụng tại: `http://localhost:3000`

---

### 4. Chạy Desktop App (Tauri v2) *(Tùy chọn)*

Để chạy phiên bản Desktop trên máy tính:
```bash
cd frontend
npm run desktop
```

---

## 🧪 Kiểm Thử & Kiểm Tra Chất Lượng Mã Nguồn (Lint & Test)

Dự án tuân thủ nghiêm ngặt tiêu chuẩn không lỗi linter và type-checking đầy đủ:

```bash
# Kiểm tra Backend
cd backend
npm run lint
npm run test

# Kiểm tra Frontend
cd frontend
npm run lint
npm run test
npm run build
```

---

## 📡 Tổng Quan API Endpoints Chính

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/user/register` | Đăng ký tài khoản mới |
| `POST` | `/api/user/login` | Đăng nhập & cấp phát JWT token |
| `GET` | `/api/user/me` | Lấy thông tin tài khoản hiện tại |
| `GET` | `/api/notes` | Lấy danh sách ghi chú (hỗ trợ filter, pagination, search) |
| `POST` | `/api/notes` | Tạo ghi chú mới kèm phân tích AI |
| `POST` | `/api/notes/upload` | Tải lên tệp đính kèm (ảnh, audio, tài liệu) |
| `GET` | `/api/notes/:id` | Xem chi tiết ghi chú |
| `PATCH` | `/api/notes/:id` | Cập nhật ghi chú |
| `DELETE` | `/api/notes/:id` | Xoá ghi chú |

---

## 🤝 Đóng Góp (Contributing)

1. Fork dự án
2. Tạo branch tính năng (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'feat: add amazing feature'`)
4. Push branch lên remote (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép [MIT](LICENSE).
