# 🚀 Hướng Dẫn Triển Khai AI Notebook 24/7 Miễn Phí 0đ
### (Render.com + Cloudflare Pages + Supabase + Cloudflare R2)

Hướng dẫn chi tiết từng bước đưa ứng dụng **AI Notebook** lên internet để bạn có thể sử dụng trên điện thoại di động, máy tính bảng hoặc bất kỳ đâu với chi phí **0đ**.

---

## 🏗️ Tổng Quan Hệ Thống

| Thành phần | Nền tảng | Chi phí | Chức năng |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Cloudflare Pages** | **0đ** | Giao diện Next.js 16, CDN toàn cầu siêu tốc, domain vĩnh viễn `*.pages.dev` |
| **Backend** | **Render.com** | **0đ** | API NestJS 11, tự động build từ GitHub repo, hỗ trợ Node.js |
| **Database** | **Supabase** | **0đ** | PostgreSQL Database (đã có sẵn của bạn), lưu trữ dữ liệu an toàn |
| **Storage** | **Cloudflare R2** | **0đ** | 10GB lưu trữ ảnh & tệp đính kèm vĩnh viễn, $0 phí băng thông tải ra |

---

## 📋 Bước 1: Lấy Chuỗi Kết Nối PostgreSQL từ Supabase

1. Mở [Supabase Dashboard](https://supabase.com/dashboard) và chọn dự án của bạn.
2. Vào **Project Settings** (biểu tượng bánh răng góc dưới trái) -> Chọn tab **Database**.
3. Kéo xuống mục **Connection string** (chọn chế độ **URI**):
   - **`DATABASE_URL` (Connection Pooler):**
     - Chọn tab **Transaction** (hoặc **Session**) -> Port thường là `6543` hoặc `5432`, dạng:
       ```text
       postgresql://postgres.yourprojectref:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
       ```
   - **`DIRECT_URL` (Direct Connection):**
     - Chọn tab **Direct connection** -> Port `5432`, dạng:
       ```text
       postgresql://postgres:[YOUR-PASSWORD]@db.yourprojectref.supabase.co:5432/postgres
       ```
4. Thay thế `[YOUR-PASSWORD]` bằng mật khẩu database của bạn.

---

## 📦 Bước 2: Tạo Bucket Lưu Trữ Ảnh/Tệp trên Cloudflare R2 (10GB Free)

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Ở thanh menu bên trái, chọn **R2 Object Storage**.
3. Nhấn **"Create bucket"**:
   - Bucket name: `ai-notebook-storage`
   - Location Hint: Chọn `Automatic` (hoặc `APAC`).
   - Nhấn **Create Bucket**.
4. Thiết lập URL truy cập công khai cho bucket:
   - Vào tab **Settings** của bucket vừa tạo.
   - Kéo xuống mục **Public Development URL** -> Nhấn **Allow Access** -> Bật URL này lên.
   - Sao chép URL hiển thị (ví dụ: `https://pub-xxxxxx.r2.dev`) -> Lưu lại làm `R2_PUBLIC_URL`.
5. Tạo R2 API Token:
   - Quay lại menu **R2 Object Storage** -> Chọn **Manage R2 API Tokens** ở bên phải.
   - Nhấn **Create API token**:
     - Permissions: Chọn **Object Read & Write**.
     - Specify bucket(s): Chọn bucket `ai-notebook-storage`.
     - Nhấn **Create API Token**.
   - Sao chép lại 3 thông tin:
     - **Account ID** (hiển thị trên trang R2) -> `R2_ACCOUNT_ID`
     - **Access Key ID** -> `R2_ACCESS_KEY_ID`
     - **Secret Access Key** -> `R2_SECRET_ACCESS_KEY`

---

## ⚙️ Bước 3: Deploy Backend lên Render.com

1. Đăng nhập [render.com](https://render.com) bằng tài khoản GitHub.
2. Nhấn **New +** -> Chọn **Web Service**.
3. Chọn repository `kiet-w/ai-notebook`.
4. Cấu hình dịch vụ:
   - **Name**: `ai-notebook-backend`
   - **Region**: `Singapore` (để kết nối nhanh nhất về Việt Nam).
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma db push && npm run start:prod
     ```
   - **Instance Type**: Chọn **Free** ($0/month).
5. Kéo xuống phần **Environment Variables** -> Thêm các biến sau:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Dán chuỗi Pooler từ Supabase ở Bước 1)*
   - `DIRECT_URL`: *(Dán chuỗi Direct từ Supabase ở Bước 1)*
   - `JWT_SECRET`: *(Một chuỗi ký tự ngẫu nhiên dài từ 32 ký tự)*
   - `CROSS_DOMAIN_COOKIES`: `true`
   - `FRONTEND_ORIGIN`: `https://ai-notebook.pages.dev`
   - `R2_ACCOUNT_ID`: *(Từ Bước 2)*
   - `R2_ACCESS_KEY_ID`: *(Từ Bước 2)*
   - `R2_SECRET_ACCESS_KEY`: *(Từ Bước 2)*
   - `R2_BUCKET_NAME`: `ai-notebook-storage`
   - `R2_PUBLIC_URL`: *(Từ Bước 2, ví dụ: https://pub-xxxxxx.r2.dev)*
6. Nhấn **Create Web Service**. Chờ 2-3 phút để Render build và deploy.
7. Khi thành công, sao chép URL backend (dạng: `https://ai-notebook-backend.onrender.com`).

---

## 🌐 Bước 4: Deploy Frontend lên Cloudflare Pages

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Menu trái chọn **Workers & Pages** -> Nhấn **Create application** -> Chọn tab **Pages**.
3. Chọn **Connect to Git** -> Chọn tài khoản GitHub và chọn repo `kiet-w/ai-notebook`.
4. Cấu hình build:
   - **Project name**: `ai-notebook` (hoặc tên tùy ý).
   - **Production branch**: `main`.
   - **Framework preset**: Chọn **Next.js**.
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. Mục **Environment variables**:
   - Nhấn **Add variable**:
     - Variable name: `NEXT_PUBLIC_API_URL`
     - Value: *(URL Backend Render từ Bước 3, ví dụ: `https://ai-notebook-backend.onrender.com`)*
6. Nhấn **Save and Deploy**.
7. Sau khi build xong, bạn sẽ có link HTTPS dạng `https://ai-notebook.pages.dev`!

---

## 🔄 Bước 5: Cập Nhật Lại CORS Trên Render

- Quay lại dashboard **Render.com** -> Dịch vụ `ai-notebook-backend` -> Tab **Environment**.
- Cập nhật lại giá trị biến `FRONTEND_ORIGIN` thành đúng domain Cloudflare Pages của bạn (`https://ai-notebook.pages.dev`).
- Render sẽ tự động redeploy để áp dụng CORS mới.

---

## 💡 Mẹo Giữ Render Luôn Thức 24/7 (Không Bao Giờ Bị Ngủ)

Gói Render Free sẽ tạm ngủ nếu không có request sau 15 phút (khiến lần mở đầu tiên phải đợi 30s). Để server **luôn luôn thức 24/7**:
1. Đăng ký tài khoản miễn phí tại [cron-job.org](https://cron-job.org) hoặc [uptimerobot.com](https://uptimerobot.com).
2. Tạo 1 monitor ping định kỳ **10 phút một lần** vào URL backend:
   ```text
   https://ai-notebook-backend.onrender.com/notes
   ```
3. Như vậy Render sẽ luôn coi server đang hoạt động và không bao giờ đưa vào trạng thái ngủ!

---

## ✨ Trải Nghiệm và Sử Dụng

1. Mở trình duyệt trên điện thoại truy cập `https://ai-notebook.pages.dev`.
2. Bấm **Đăng ký** tài khoản đầu tiên.
3. Tạo ghi chú, đính kèm ảnh hoặc PDF để kiểm tra lưu trữ Supabase và Cloudflare R2.
4. Tận hưởng ứng dụng ghi chú cá nhân tốc độ cao 24/7 hoàn toàn miễn phí!
