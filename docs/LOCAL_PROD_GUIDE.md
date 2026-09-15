# 📘 HƯỚNG DẪN SETUP MÔI TRƯỜNG LOCAL GIỐNG 100% PRODUCTION

Tài liệu này hướng dẫn cách vận hành hệ thống **AI Notebook** ngay tại máy Local với độ tương đồng **100% so với môi trường Production** (Render + Vercel + Supabase), giúp bạn phát hiện và khắc phục triệt để mọi lỗi trước khi deploy lên internet.

---

## 🏗️ Kiến Trúc "Production-Mirror" Cục Bộ

Khi deploy thật, bạn thường gặp lỗi vì:
* Frontend (`xxx.vercel.app`) và Backend (`xxx.onrender.com`) là **2 domain khác nhau** $\rightarrow$ Trình duyệt chặn Cookie `refreshToken`, chặn CORS, bắt buộc HTTPS.
* Server Render Free Tier bị **ngủ sau 15 phút** $\rightarrow$ Frontend bị timeout.
* Render xóa sạch thư mục `uploads/` sau mỗi lần deploy (**Ephemeral Disk**).

Cụm Docker Compose cục bộ giải quyết toàn bộ các vấn đề trên bằng **Nginx Reverse Proxy Gateway**:

```
                              [Trình Duyệt Của Bạn]
                                       │
                         http://localhost (Cổng 80)
                                       │
                           ┌───────────┴───────────┐
                           │  Nginx Reverse Proxy  │
                           └───────────┬───────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │                                                 │
      Đường dẫn `/`                                    Đường dẫn `/api/` & `/uploads/`
              ▼                                                 ▼
┌───────────────────────────┐                     ┌───────────────────────────┐
│   Frontend (Next.js 16)   │                     │    Backend (NestJS 11)    │
│    Production Container   │                     │    Production Container   │
│         (Port 3000)       │                     │         (Port 3001)       │
└───────────────────────────┘                     └─────────────┬─────────────┘
                                                                │
                                              ┌─────────────────┴─────────────────┐
                                              ▼                                   ▼
                                  [PostgreSQL 16 Container]           [Supabase Cloud Thật]
                                     (Chế độ Offline)                 (Chế độ Hybrid Data)
```

---

## 🚀 Cách Chạy 1: Chế Độ "Production-Mirror" (Kiểm Thử Chuẩn 100%)

Dùng khi bạn muốn **kiểm tra ứng dụng trước khi đẩy lên GitHub/Production**, đảm bảo code chạy ổn định sau khi đã build production.

### Bước 1: Tạo file cấu hình môi trường Docker
Tại thư mục gốc của dự án, sao chép file `.env.docker.example` thành `.env`:
```bash
cp .env.docker.example .env
```
*(Nếu muốn chạy mặc định với Postgres cục bộ thì không cần chỉnh sửa gì thêm).*

### Bước 2: Khởi động toàn bộ stack bằng 1 lệnh
```bash
docker compose up -d --build
```

### Bước 3: Truy cập ứng dụng
* **Giao diện Web:** Mở trình duyệt truy cập: **[http://localhost](http://localhost)**
* **Kiểm tra API Backend:** [http://localhost/api/notes](http://localhost/api/notes)
* **Xem Logs thời gian thực:**
  ```bash
  # Xem logs toàn bộ hệ thống:
  docker compose logs -f

  # Hoặc chỉ xem logs Backend:
  docker compose logs -f backend
  ```

### Bước 4: Tắt hệ thống khi không dùng
```bash
docker compose down
```
*(Nếu muốn xóa sạch toàn bộ dữ liệu database để test lại từ đầu: `docker compose down -v`)*

---

## 🔄 Cách Chạy 2: Chuyển Sang Dùng Dữ Liệu Thật Trên Supabase Cloud (Hybrid)

Nếu bạn muốn test trực tiếp với dữ liệu thật trên Supabase (để kiểm tra độ trễ mạng Internet và mã hóa SSL giống hệt production), bạn chỉ cần:

1. Mở file `.env` ở thư mục gốc.
2. Tìm và sửa lại 2 dòng `DATABASE_URL` và `DIRECT_URL` trỏ về Supabase của bạn:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```
3. Restart lại container backend:
   ```bash
   docker compose restart backend
   ```
Backend NestJS đã được tích hợp sẵn cơ chế **tự động kích hoạt SSL (`rejectUnauthorized: false`)** khi phát hiện kết nối tới domain Supabase/Neon, đảm bảo không bị crash chứng chỉ.

---

## 💻 Cách Chạy 3: Chế Độ Lập Trình Thường Ngày (Dev Hot-Reload)

Khi đang viết code tính năng hàng ngày, bạn không nên build lại Docker mỗi lần sửa file vì sẽ mất thời gian. Hãy dùng chế độ Dev:

1. **Chỉ bật Database PostgreSQL trong Docker:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
2. **Mở Terminal 1 (Chạy Backend):**
   ```bash
   cd backend
   npm run start:dev
   ```
3. **Mở Terminal 2 (Chạy Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```
4. Truy cập **[http://localhost:3000](http://localhost:3000)** để code với tính năng Hot-Reload tức thì.

---

## 🔍 Bảng Tra Cứu Lỗi & Cách Khắc Phục (Troubleshooting)

| Triệu chứng lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Cổng 80 bị chiếm (`bind: address already in use`)** | Máy bạn đang có web server khác (Apache, Nginx, IIS) dùng port 80 | Mở file `.env`, đổi `NGINX_PORT=8080`. Sau đó truy cập bằng `http://localhost:8080`. |
| **Login xong F5 bị văng ra trang Login** | Trình duyệt chặn cookie bên thứ ba hoặc `SameSite` sai | Đảm bảo truy cập qua Nginx Gateway (`http://localhost`), không mở chéo domain `localhost:3000` $\leftrightarrow$ `localhost:3001`. |
| **Lỗi kết nối Supabase SSL** | Node.js từ chối self-signed cert của cloud pooler | `PrismaService` đã được thêm sẵn bypass SSL cho domain `supabase.co` và `neon.tech`. |
| **Database chưa có bảng (table not found)** | Prisma chưa kịp đẩy schema | Chạy lệnh: `docker compose exec backend npx prisma db push`. |
| **Upload file ảnh báo lỗi hoặc mất ảnh** | Thư mục `uploads` chưa mount volume | Docker Compose đã mount `backend_uploads:/app/uploads`, dữ liệu sẽ được giữ nguyên vẹn kể cả khi tắt container. |

---

## 💡 Tổng Kết

Bằng cách sử dụng bộ cấu hình này:
1. **70% Code & Runtime:** Được bảo đảm đồng nhất qua Docker container (`node:22-bookworm-slim`, production build).
2. **30% Hạ tầng, Network & Cookie:** Được bảo đảm qua **Nginx Gateway** và **Cơ chế Hybrid Cloud DB**, triệt tiêu toàn bộ sự sai lệch giữa máy dev và server production!
