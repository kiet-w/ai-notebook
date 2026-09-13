# 🧠 AI Notebook

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-v11-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

**AI Notebook** là ứng dụng ghi chú cá nhân hiện đại, tốc độ cao với phong cách thiết kế tối giản (Minimalist). Ứng dụng hỗ trợ quản lý ghi chú thông minh, tạo danh mục động, tìm kiếm từ khóa thời gian thực, đính kèm tệp đa định dạng, dán ảnh trực tiếp từ clipboard, hỗ trợ đa ngôn ngữ (Tiếng Việt & Tiếng Anh), xác thực an toàn nhiều lớp và đóng gói ứng dụng Desktop đa nền tảng với **Tauri v2**.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### ⚡ Ghi Chú Tốc Độ Cao & Trực Quan (Instant Note Capture)
- **Lưu ghi chú trực tiếp:** Nhập và lưu ý tưởng tức thì mà không bị trễ thời gian xử lý.
- **Tiêu đề riêng biệt & Phím tắt:** Ô nhập tiêu đề rõ ràng với đường phân cách thanh lịch, hỗ trợ phím tắt điều hướng `Enter` / `Shift+Enter` mượt mà.
- **Xem trước & Chỉnh sửa chi tiết:** Hỗ trợ xem nhanh ghi chú dạng popup / modal và cập nhật nội dung dễ dàng.

### 🏷️ Quản Lý Danh Mục Linh Hoạt (Dynamic Categories)
- **Horizontal Category Picker (`NoteCategoryPicker`):** Bộ chọn danh mục dạng Popover hiện đại, chọn nhanh hoặc hủy chọn chỉ với 1 click.
- **Tạo danh mục tùy chỉnh mọi lúc mọi nơi:** Cho phép người dùng tự tạo danh mục mới ngay trên **Sidebar** hoặc ngay tại khung nhập ghi chú (**NoteInput**).
- **Phân loại ghi chú thông minh:** Lọc nhanh danh sách ghi chú theo từng danh mục riêng biệt.

### 📎 Đa Phương Tiện & Tệp Đính Kèm (Rich Attachments)
- **Dán ảnh siêu tốc từ Clipboard (`Ctrl + V`):** Tự động nhận diện ảnh chụp màn hình hoặc ảnh copy và hiển thị xem trước trước khi tạo ghi chú.
- **Tải lên tệp đa định dạng:** Hỗ trợ tải lên tài liệu và hình ảnh: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.png`, `.jpg`, `.jpeg`, `.epub`, `.txt`, `.csv`.
- **Xem trước tệp trực quan:** Component `NoteFilePreview` hỗ trợ xem hình ảnh và thông tin tệp, có nút gỡ tệp nhanh chóng.

### 🔍 Tìm Kiếm Thời Gian Thực (Keyword Search)
- **Instant Search:** Thanh tìm kiếm responsive lọc ghi chú tức thì theo tiêu đề hoặc nội dung văn bản.
- **Kết hợp bộ lọc:** Dễ dàng tìm kiếm trong toàn bộ ghi chú hoặc trong danh mục đang được chọn.

### 🌐 Đa Ngôn Ngữ Toàn Diện (Full i18n)
- Hỗ trợ chuyển đổi song ngữ **Tiếng Việt (`vi`)** và **Tiếng Anh (`en`)** linh hoạt.
- Tự động lưu lựa chọn ngôn ngữ người dùng vào `localStorage`, chuyển đổi mượt mà không cần reload trang.

### 🎨 Kiến Trúc UI Atomic Design & Design Tokens
- Tuân thủ nghiêm ngặt mô hình **Atomic Design**:
  - `atoms/`: Các thành phần cơ bản (`Button`, `Input`, `Avatar`, `Icon`,...).
  - `molecules/`: Các thành phần kết hợp (`NoteInput`, `NoteCard`, `NoteCategoryPicker`, `NoteFilePreview`,...).
  - `organisms/`: Các khối giao diện lớn (`Sidebar`, `SearchSection`, `NoteDetailModal`,...).
  - `templates/`: Cấu trúc bố cục trang (`HomeTemplate`, `LoginTemplate`,...).
- Chuẩn hóa style với **Class Variance Authority (`cva`)**, `clsx` và `tailwind-merge` (`cn`).
- Thiết kế Dark / Light mode tinh tế với **Tailwind CSS v4**.

### 🛡️ Backend Vững Chắc & Bảo Mật Cao (NestJS 11 & Prisma 7.8)
- **Kiến trúc Module sạch:** `notes`, `user`, `parser`, `scraper`, `prisma`, `common`.
- **Xác thực an toàn:** Mật khẩu được băm bằng thuật toán **Argon2**, hỗ trợ JWT lưu trong HttpOnly Cookie & Bearer Header.
- **Strict Data Validation:** Tất cả DTOs được kiểm tra đầu vào nghiêm ngặt bằng `class-validator` và `class-transformer`.
- **Global Error Handling & Toast Feedback:** Bắt lỗi tập trung với Global Exception Filter và hiển thị thông báo Toast trực quan cho người dùng.
- **Bảo mật nhiều lớp:** Rate Limiting (Throttler), Content Security Policy (CSP) Headers, CORS Whitelist.

### 🖥️ Hỗ Trợ Đa Nền Tảng (Cross-Platform)
- **Web App:** Next.js 16 (App Router) tối ưu hóa SEO và hiệu năng.
- **Desktop App:** Đóng gói ứng dụng desktop native cho macOS, Windows và Linux nhờ **Tauri v2**.

---

## 🏗️ Kiến Trúc Hệ Thống (Project Structure)

```
ai-notebook/
├── backend/                      # NestJS 11 API Backend Server
│   ├── prisma/                   # Prisma Schema & Database Migrations (PostgreSQL)
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── common/               # Filters (HttpException), Guards, Decorators, Interceptors
│   │   ├── notes/                # Module Quản lý Ghi chú (CRUD, Search, Upload, DTOs, Repo)
│   │   ├── parser/               # Trích xuất & xử lý tệp đính kèm, OCR, Audio
│   │   ├── prisma/               # Prisma Database Service Client
│   │   ├── scraper/              # Cheerio Web Scraper trích xuất nội dung liên kết
│   │   ├── user/                 # Authentication, User Management, JWT & Argon2
│   │   ├── app.module.ts         # Root AppModule
│   │   └── main.ts               # Entrypoint, CORS, Security Headers, ValidationPipe
│   ├── test/                     # Unit Tests & E2E Tests
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── frontend/                     # Next.js 16 (App Router) + Tailwind v4 + Tauri v2
│   ├── src-tauri/                # Cấu hình đóng gói Desktop App với Tauri (Rust)
│   ├── src/
│   │   ├── app/                  # Next.js App Router Pages (Trang chủ, Auth, Dynamic routes)
│   │   ├── components/           # Phân cấp Atomic Design Chuẩn mực
│   │   │   ├── atoms/            # Button, Input, Icon, Avatar, FormField,...
│   │   │   ├── molecules/        # NoteInput, NoteCard, NoteCategoryPicker, NoteFilePreview,...
│   │   │   ├── organisms/        # Sidebar, SearchSection, NoteDetailModal,...
│   │   │   └── templates/        # HomeTemplate, AuthTemplate,...
│   │   ├── context/              # React Context (AuthContext, LanguageContext,...)
│   │   ├── hooks/                # Custom React Hooks (useNotes, useI18n, useCustomCategories,...)
│   │   ├── i18n/                 # Bản dịch ngôn ngữ (locales: vi.ts, en.ts)
│   │   ├── lib/                  # UI Style tokens (cva/cn), Axios Client, Socket.io
│   │   ├── types/                # TypeScript Type Definitions & Interfaces
│   │   ├── utils/                # Helper functions, category utils, date formatters
│   │   └── middleware.ts         # Edge Middleware bảo vệ routes & security headers
│   └── public/                   # Static assets & icons
└── README.md
```

---

## 🛠️ Yêu Cầu Cài Đặt (Prerequisites)

- **Node.js:** `>= 20.x` (khuyến nghị Node 22+)
- **Package Manager:** `pnpm` (khuyến nghị `pnpm v11+`), `npm` hoặc `bun`
- **PostgreSQL:** `>= 15.x` (cài đặt trực tiếp hoặc chạy qua Docker)
- **Rust & Cargo:** *(chỉ cần khi build ứng dụng Desktop với Tauri)*

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Clone repository

```bash
git clone https://github.com/kiet-w/ai-notebook.git
cd ai-notebook
```

---

### 2. Khởi Động Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   pnpm install
   # hoặc npm install
   ```

3. Tạo tệp `.env` cấu hình môi trường:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_notebook?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   CORS_ORIGIN="http://localhost:3000"
   ```

4. Chạy migration và sinh Prisma Client:
   ```bash
   pnpm dlx prisma migrate dev
   pnpm dlx prisma generate
   ```

5. Khởi động Backend server (chế độ phát triển):
   ```bash
   pnpm run start:dev
   ```
   > Backend API sẽ sẵn sàng tại: `http://localhost:3001`

---

### 3. Khởi Động Frontend

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   pnpm install
   # hoặc npm install
   ```

3. Tạo tệp cấu hình `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NEXT_PUBLIC_WS_URL="http://localhost:3001"
   ```

4. Khởi động Frontend ở chế độ phát triển:
   ```bash
   pnpm run dev
   ```
   > Truy cập ứng dụng tại: `http://localhost:3000`

---

### 4. Chạy Desktop App (Tauri v2) *(Tùy chọn)*

Để chạy ứng dụng native trên máy tính (macOS, Windows, Linux):

```bash
cd frontend
pnpm run desktop
```

---

## 📡 Danh Sách API Endpoints Chính

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/user/register` | Đăng ký tài khoản người dùng mới |
| `POST` | `/api/user/login` | Đăng nhập tài khoản, thiết lập HttpOnly cookie & trả về JWT Token |
| `POST` | `/api/user/logout` | Đăng xuất và xóa Cookie phiên làm việc |
| `GET` | `/api/user/me` | Lấy thông tin tài khoản hiện tại |
| `GET` | `/api/notes` | Lấy danh sách ghi chú (hỗ trợ lọc theo `category`, tìm kiếm `keyword`, phân trang `page`/`limit`) |
| `POST` | `/api/notes` | Tạo mới ghi chú (tiêu đề, nội dung, danh mục) |
| `POST` | `/api/notes/upload` | Tải lên tệp đính kèm / ảnh cho ghi chú |
| `GET` | `/api/notes/:id` | Xem chi tiết 1 ghi chú theo ID |
| `PATCH` | `/api/notes/:id` | Cập nhật ghi chú (tiêu đề, nội dung, danh mục, trạng thái ghim/lưu trữ) |
| `DELETE` | `/api/notes/:id` | Xóa ghi chú |

---

## 🧪 Kiểm Thử & Kiểm Tra Chất Lượng Mã Nguồn (Quality Assurance)

Dự án áp dụng quy chuẩn nghiêm ngặt: **Zero Linter Warnings / Zero TypeScript Errors**.

```bash
# Kiểm tra & Build Backend
cd backend
pnpm run lint
pnpm run test
pnpm run build

# Kiểm tra & Build Frontend
cd frontend
pnpm run lint
pnpm run test
pnpm run build
```

---

## 🤝 Đóng Góp Phát Triển (Contributing)

1. Fork dự án về tài khoản của bạn.
2. Tạo branch tính năng mới: `git checkout -b feat/ten-tinh-nang`.
3. Commit các thay đổi với quy ước Conventional Commits: `git commit -m 'feat: them tinh nang moi'`.
4. Push lên GitHub: `git push origin feat/ten-tinh-nang`.
5. Mở Pull Request để được review và merge.

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **[MIT](LICENSE)**.
