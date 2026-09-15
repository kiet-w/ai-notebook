# 🚀 Hướng Dẫn Triển Khai AI Notebook 100% Miễn Phí 0đ (KHÔNG CẦN THẺ NGÂN HÀNG)
### (Render.com + Vercel / Cloudflare Pages + Supabase Database & Storage)

Nếu bạn gặp trường hợp **Cloudflare R2 yêu cầu nhập thẻ tín dụng** để kích hoạt, đây là giải pháp **0đ TUYỆT ĐỐI - KHÔNG CẦN THẺ NGÂN HÀNG** tận dụng toàn bộ hệ thống miễn phí của Supabase, Render và Vercel.

---

## 🏗️ Tổng Quan Hệ Thống 0đ (Không Cần Thẻ Tín Dụng)

| Thành phần | Nền tảng | Yêu cầu thẻ? | Chi phí | Chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** (hoặc Cloudflare Pages) | ❌ **Không cần** | **0đ** | Giao diện Next.js 16, CDN toàn cầu, domain `*.vercel.app` |
| **Backend** | **Render.com** | ❌ **Không cần** | **0đ** | API NestJS 11, tự động build từ repo GitHub |
| **Database** | **Supabase** | ❌ **Không cần** | **0đ** | PostgreSQL Database (dự án có sẵn của bạn) |
| **Storage** | **Supabase Storage** | ❌ **Không cần** | **0đ** | 1GB lưu trữ ảnh & tệp đính kèm miễn phí có sẵn trong Supabase |

---

## 📋 Bước 1: Lấy Chuỗi Kết Nối PostgreSQL từ Supabase

1. Mở [Supabase Dashboard](https://supabase.com/dashboard) và chọn dự án của bạn.
2. Vào **Project Settings** (biểu tượng bánh răng góc dưới trái) -> Chọn tab **Database**.
3. Kéo xuống mục **Connection string** (chọn tab **URI**):
   - **`DATABASE_URL` (Connection Pooler):**
     - Chọn tab **Transaction** (hoặc **Session**) -> Port `6543` (hoặc `5432`), ví dụ:
       ```text
       postgresql://postgres.yourprojectref:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
       ```
   - **`DIRECT_URL` (Direct Connection):**
     - Chọn tab **Direct connection** -> Port `5432`, ví dụ:
       ```text
       postgresql://postgres:[YOUR-PASSWORD]@db.yourprojectref.supabase.co:5432/postgres
       ```
4. Thay thế `[YOUR-PASSWORD]` bằng mật khẩu database của bạn.

---

## 📦 Bước 2: Kích Hoạt Supabase Storage Miễn Phí (1GB Free - Thay Cho Cloudflare R2)

Supabase đã tích hợp sẵn 1GB lưu trữ tệp hoàn toàn miễn phí và không đòi hỏi bất kỳ thẻ ngân hàng nào:

1. Trong dashboard Supabase của bạn, chọn menu **Storage** ở thanh bên trái.
2. Nhấn **New bucket**:
   - Name: `notes`
   - Bật tùy chọn **Public bucket** (để ảnh/tệp có thể hiển thị trực tiếp).
   - Nhấn **Save**.
3. Lấy thông tin kết nối S3 từ Supabase:
   - Vào **Project Settings** -> Menu bên trái chọn **Storage**.
   - Kéo xuống mục **S3 Connection**:
     - **Endpoint**: Dạng `https://yourprojectref.supabase.co/storage/v1/s3` -> Làm `STORAGE_ENDPOINT`
     - **Region**: Khu vực của bạn (ví dụ: `ap-southeast-1`) -> Làm `STORAGE_REGION`
     - **Access Key ID**: Nhấn "Generate S3 Access Key" hoặc sao chép Access Key -> Làm `STORAGE_ACCESS_KEY_ID`
     - **Secret Access Key**: Sao chép Secret Key hiển thị -> Làm `STORAGE_SECRET_ACCESS_KEY`
4. Public URL cho tệp:
   - Dạng: `https://yourprojectref.supabase.co/storage/v1/object/public/notes` -> Làm `STORAGE_PUBLIC_URL`

*(Lưu ý: Nếu chưa muốn cấu hình storage ngay, bạn có thể bỏ qua bước này, backend sẽ tự động lưu tạm trên ổ cứng server).*

---

## ⚙️ Bước 3: Deploy Backend lên Render.com (Miễn Phí 100%)

1. Đăng nhập [render.com](https://render.com) bằng tài khoản GitHub (không cần thẻ).
2. Nhấn **New +** -> Chọn **Web Service**.
3. Chọn repository `kiet-w/ai-notebook`.
4. Cấu hình dịch vụ:
   - **Name**: `ai-notebook-backend`
   - **Region**: `Singapore` (để ping nhanh nhất về Việt Nam).
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
   - `FRONTEND_ORIGIN`: `https://ai-notebook-frontend.vercel.app` *(hoặc link Cloudflare Pages nếu dùng Pages)*
   - *(Tùy chọn nếu cấu hình Supabase Storage ở Bước 2)*:
     - `STORAGE_ENDPOINT`: `https://yourprojectref.supabase.co/storage/v1/s3`
     - `STORAGE_ACCESS_KEY_ID`: `...`
     - `STORAGE_SECRET_ACCESS_KEY`: `...`
     - `STORAGE_BUCKET_NAME`: `notes`
     - `STORAGE_PUBLIC_URL`: `https://yourprojectref.supabase.co/storage/v1/object/public/notes`
     - `STORAGE_REGION`: `ap-southeast-1`
6. Nhấn **Create Web Service**. Chờ 2-3 phút để Render build và deploy.
7. Khi thành công, sao chép URL backend (dạng: `https://ai-notebook-backend.onrender.com`).

---

## 🌐 Bước 4: Deploy Frontend Lên Vercel (Cha Đẻ Của Next.js - 100% Free Không Cần Thẻ)

Vì Next.js do chính Vercel phát triển, Vercel là nền tảng miễn phí tuyệt vời nhất cho Next.js:

1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng GitHub (hoàn toàn không hỏi thẻ).
2. Nhấn **Add New...** -> Chọn **Project**.
3. Tìm repo `kiet-w/ai-notebook` -> Nhấn **Import**.
4. Cấu hình:
   - **Root Directory**: Nhấn **Edit** và chọn thư mục `frontend`.
   - **Framework Preset**: Vercel sẽ tự động nhận diện **Next.js**.
5. Mở mục **Environment Variables** -> Thêm:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: *(URL Backend Render ở Bước 3, ví dụ: `https://ai-notebook-backend.onrender.com`)*
6. Nhấn **Deploy**.
7. Chỉ sau khoảng 1 phút, bạn sẽ nhận được một địa chỉ web HTTPS vĩnh viễn dạng `https://ai-notebook-xxx.vercel.app`!

*(Hoặc nếu bạn vẫn thích Cloudflare Pages cho Frontend: Cloudflare Pages hoàn toàn không cần thẻ, chỉ có R2 mới đòi thẻ).*

---

## 🔄 Bước 5: Cập Nhật Lại CORS Trên Render

- Quay lại dashboard **Render.com** -> Dịch vụ `ai-notebook-backend` -> Tab **Environment**.
- Cập nhật giá trị biến `FRONTEND_ORIGIN` thành đúng domain Vercel của bạn (ví dụ: `https://ai-notebook-xxx.vercel.app`).
- Render sẽ tự động redeploy để áp dụng kết nối mới.

---

## 💡 Mẹo Giữ Render Luôn Thức 24/7 (Không Bao Giờ Bị Ngủ)

Để server Render không bao giờ rơi vào trạng thái ngủ sau 15 phút:
1. Đăng ký tài khoản miễn phí tại [cron-job.org](https://cron-job.org) hoặc [uptimerobot.com](https://uptimerobot.com).
2. Tạo 1 monitor ping định kỳ **10 phút một lần** vào URL backend:
   ```text
   https://ai-notebook-backend.onrender.com/notes
   ```
3. Server sẽ luôn luôn thức 24/7, mở app trên điện thoại là dùng được ngay tức thì!
