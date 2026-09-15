# 🚀 Hướng Dẫn Triển Khai AI Notebook 24/7 Miễn Phí 0đ

Hướng dẫn chi tiết từng bước đưa ứng dụng **AI Notebook** lên Cloud để bạn có thể sử dụng từ điện thoại di động, máy tính bảng hoặc máy tính cá nhân mọi lúc mọi nơi mà không tốn một đồng chi phí nào.

---

## 🏗️ Tổng Quan Kiến Trúc Miễn Phí (0đ)

| Thành phần | Nền tảng | Gói dịch vụ | Ưu điểm |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Cloudflare Pages** | Miễn phí 100% | Băng thông không giới hạn, CDN toàn cầu cực nhanh, domain miễn phí `*.pages.dev` |
| **Backend** | **Render.com** (hoặc Koyeb) | Free Web Service | Tự động build từ repo GitHub, hỗ trợ Node.js 24/7 |
| **Database** | **Neon.tech** (hoặc Supabase) | Serverless PostgreSQL | Miễn phí 0.5 GB lưu trữ hàng trăm nghìn ghi chú, tự động backup |
| **Lưu trữ Tệp** | **Cloudflare R2** | 10GB Free Storage | Không tốn phí băng thông tải ra (egress = $0), file không bị mất khi restart server |

---

## 📋 Bước 1: Tạo Database PostgreSQL Miễn Phí trên Neon.tech

1. Truy cập [neon.tech](https://neon.tech) và đăng ký tài khoản miễn phí (bằng GitHub hoặc Google).
2. Nhấn **"Create Project"**:
   - Project name: `ai-notebook`
   - Region: Chọn vùng gần bạn (ví dụ: `Singapore` hoặc `ap-southeast-1` để có tốc độ tốt nhất tại Việt Nam).
3. Sau khi tạo xong, ở màn hình **Connection Details**, sao chép chuỗi kết nối:
   - Dạng: `postgresql://neondb_owner:xxxx@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Đây chính là giá trị cho biến `DATABASE_URL` và `DIRECT_URL`.

---

## 📦 Bước 2: Tạo Bucket Lưu Trữ Ảnh/Tệp trên Cloudflare R2 (10GB Free)

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Ở thanh menu bên trái, chọn **R2 Object Storage**.
3. Nhấn **"Create bucket"**:
   - Bucket name: `ai-notebook-storage`
   - Location Hint: Chọn `Automatic` (hoặc `APAC`).
   - Nhấn **Create Bucket**.
4. Thiết lập URL truy cập công khai cho bucket:
   - Vào tab **Settings** của bucket vừa tạo.
   - Kéo xuống mục **Public Development URL** -> Nhấn **Allow Access** -> Bật URL này lên.
   - Sao chép URL đó (ví dụ: `https://pub-xxxxxx.r2.dev`). Đây là giá trị cho biến `R2_PUBLIC_URL`.
5. Tạo R2 API Token:
   - Quay lại trang chính của R2 Object Storage -> chọn **Manage R2 API Tokens** ở bên phải.
   - Nhấn **Create API token**:
     - Permissions: Chọn **Object Read & Write**.
     - Specify bucket(s): Chọn bucket `ai-notebook-storage`.
     - Nhấn **Create API Token**.
   - Sao chép lại 3 thông tin quan trọng:
     - **Account ID** (hiển thị trên trang R2) -> `R2_ACCOUNT_ID`
     - **Access Key ID** -> `R2_ACCESS_KEY_ID`
     - **Secret Access Key** -> `R2_SECRET_ACCESS_KEY`

---

## ⚙️ Bước 3: Deploy Backend lên Render.com

1. Đăng nhập [render.com](https://render.com) bằng tài khoản GitHub của bạn.
2. Nhấn **New +** -> Chọn **Web Service**.
3. Chọn repository `kiet-w/ai-notebook` (nhớ commit và push các thay đổi mới nhất lên GitHub trước).
4. Cấu hình thông tin Web Service:
   - **Name**: `ai-notebook-backend`
   - **Region**: `Singapore` (để ping nhanh nhất).
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma db push && npm run start:prod
     ```
   - **Instance Type**: Chọn **Free** ($0/month).
5. Kéo xuống mục **Environment Variables** -> Thêm các biến sau:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Dán chuỗi kết nối từ Neon ở Bước 1)*
   - `DIRECT_URL`: *(Dán chuỗi kết nối từ Neon ở Bước 1)*
   - `JWT_SECRET`: *(Chuỗi bí mật ngẫu nhiên bất kỳ dài từ 32 ký tự)*
   - `CROSS_DOMAIN_COOKIES`: `true`
   - `FRONTEND_ORIGIN`: `https://ai-notebook.pages.dev` *(sau khi tạo Cloudflare Pages ở Bước 4 sẽ cập nhật lại đúng domain)*
   - `R2_ACCOUNT_ID`: *(Từ Bước 2)*
   - `R2_ACCESS_KEY_ID`: *(Từ Bước 2)*
   - `R2_SECRET_ACCESS_KEY`: *(Từ Bước 2)*
   - `R2_BUCKET_NAME`: `ai-notebook-storage`
   - `R2_PUBLIC_URL`: *(Từ Bước 2, ví dụ: https://pub-xxxxxx.r2.dev)*
6. Nhấn **Create Web Service**. Chờ 2-3 phút để Render build và deploy.
7. Khi thành công, sao chép URL của backend (ví dụ: `https://ai-notebook-backend.onrender.com`).

---

## 🌐 Bước 4: Deploy Frontend lên Cloudflare Pages

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Menu trái chọn **Workers & Pages** -> Nhấn **Create application** -> Chọn tab **Pages**.
3. Chọn **Connect to Git** -> Chọn tài khoản GitHub và chọn repo `kiet-w/ai-notebook`.
4. Cấu hình build:
   - **Project name**: `ai-notebook` (hoặc tên tùy thích).
   - **Production branch**: `main` (hoặc branch bạn đang dùng).
   - **Framework preset**: Chọn **Next.js**.
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. Mục **Environment variables**:
   - Nhấn **Add variable**:
     - Variable name: `NEXT_PUBLIC_API_URL`
     - Value: *(URL Backend Render từ Bước 3, ví dụ: `https://ai-notebook-backend.onrender.com`)*
6. Nhấn **Save and Deploy**.
7. Sau khi build xong, Cloudflare Pages sẽ cấp cho bạn một domain HTTPS miễn phí vĩnh viễn dạng `https://ai-notebook.pages.dev`!

---

## 🔄 Bước 5: Hoàn Tất Kết Nối Hai Chiều

- Quay lại dashboard của **Render.com** -> Vào dịch vụ `ai-notebook-backend` -> Tab **Environment**.
- Cập nhật lại giá trị biến `FRONTEND_ORIGIN` thành đúng URL Cloudflare Pages của bạn (ví dụ: `https://ai-notebook.pages.dev`).
- Render sẽ tự động redeploy để áp dụng CORS mới.

---

## ✨ Trải Nghiệm và Sử Dụng

1. Mở trình duyệt trên điện thoại hoặc máy tính truy cập `https://ai-notebook.pages.dev`.
2. Bấm **Đăng ký** tài khoản đầu tiên của bạn.
3. Tạo ghi chú mới, đính kèm ảnh hoặc PDF để kiểm tra tốc độ lưu lên Cloudflare R2.
4. Tận hưởng ứng dụng ghi chú cá nhân tốc độ cao 24/7 hoàn toàn miễn phí!
