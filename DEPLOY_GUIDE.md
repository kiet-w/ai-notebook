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

## 📋 Bước 1: Lấy Chuỗi Kết Nối PostgreSQL từ Supabase

Vì bạn đã có sẵn dự án trên **Supabase**, bạn không cần tạo database mới. Hãy lấy 2 chuỗi kết nối từ Supabase:

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) và mở project của bạn.
2. Nhấn vào **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) -> Chọn tab **Database**.
3. Kéo xuống mục **Connection string** (hoặc **Connecting to your database**):
   - Chọn chế độ **URI**.
   - **`DATABASE_URL` (Connection Pooler)**:
     - Chọn tab **Transaction** (hoặc **Session**) trên Supabase.
     - Sao chép chuỗi kết nối (port thường là `6543` hoặc `5432`), ví dụ:
       `postgresql://postgres.yourprojectref:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   - **`DIRECT_URL` (Direct Connection)**:
     - Tắt tùy chọn Pooler hoặc chọn tab **Direct connection** (port `5432`), ví dụ:
       `postgresql://postgres:[YOUR-PASSWORD]@db.yourprojectref.supabase.co:5432/postgres`
4. Thay thế `[YOUR-PASSWORD]` bằng mật khẩu cơ sở dữ liệu Supabase của bạn.
> 💡 *Mẹo:* Nếu không nhớ mật khẩu, bạn có thể nhấn nút **Reset database password** ngay tại trang Database Settings của Supabase để đặt lại mật khẩu mới.

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

## ⚙️ Bước 3: Deploy Backend 24/7 Không Bao Giờ Ngủ (Hugging Face Spaces hoặc Koyeb)

Thay vì dùng Render (bị ngủ sau 15 phút), ta dùng **Hugging Face Spaces** hoặc **Koyeb** – hoàn toàn miễn phí 0đ và **chạy liên tục 24/7 không bao giờ ngủ**, bạn mở điện thoại lúc nào cũng có kết nối ngay lập tức!

### 🌟 Lựa Chọn 1 (Khuyên Dùng Nhất): Hugging Face Spaces (Docker 24/7 Miễn Phí)
Hugging Face cung cấp miễn phí 1 container Docker với **2 vCPU và 16GB RAM**, chạy 24/7 không sleep:

1. Đăng ký/Đăng nhập tại [huggingface.co](https://huggingface.co).
2. Nhấn vào ảnh đại diện góc trên bên phải -> Chọn **New Space**.
3. Cấu hình Space:
   - **Space name**: `ai-notebook-api` (hoặc tên tùy ý).
   - **License**: `mit` hoặc `apache-2.0`.
   - **Select the Space SDK**: Chọn **Docker** (chọn template **Blank**).
   - **Space hardware**: Chọn **CPU basic · 2 vCPU · 16GB RAM · FREE**.
   - **Space visibility**: Chọn **Public** (để chạy 24/7 miễn phí).
   - Nhấn **Create Space**.
4. Kết nối mã nguồn:
   - Trong Space vừa tạo, bạn có thể đẩy code từ máy lên repo Space của Hugging Face (hoặc vào tab **Files** tải file `Dockerfile` và thư mục `backend` lên).
   - Hoặc dùng lệnh git đẩy nhanh từ máy:
     ```bash
     git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/ai-notebook-api
     git push hf main
     ```
5. Cài đặt biến môi trường bí mật (Secrets):
   - Vào tab **Settings** của Space -> Kéo xuống mục **Variables and secrets**.
   - Nhấn **New secret** và thêm các biến:
     - `DATABASE_URL`: *(Chuỗi kết nối Pooler từ Supabase)*
     - `DIRECT_URL`: *(Chuỗi kết nối Direct từ Supabase)*
     - `JWT_SECRET`: *(Chuỗi ký tự bí mật ngẫu nhiên bất kỳ)*
     - `CROSS_DOMAIN_COOKIES`: `true`
     - `FRONTEND_ORIGIN`: `https://ai-notebook.pages.dev`
     - `R2_ACCOUNT_ID`: *(Từ Bước 2)*
     - `R2_ACCESS_KEY_ID`: *(Từ Bước 2)*
     - `R2_SECRET_ACCESS_KEY`: *(Từ Bước 2)*
     - `R2_BUCKET_NAME`: `ai-notebook-storage`
     - `R2_PUBLIC_URL`: *(Từ Bước 2, ví dụ: https://pub-xxxxxx.r2.dev)*
6. Space sẽ tự động build Docker và chạy `Running`.
7. Lấy URL API:
   - Nhấn vào biểu tượng 3 chấm `...` ở góc phải trên của Space -> Chọn **Embed this Space** -> Sao chép URL ở mục **Direct URL** (dạng `https://username-ai-notebook-api.hf.space`).

---

### 🌟 Lựa Chọn 2: Koyeb (Free Tier 24/7 Không Sleep)
Nếu bạn thích kết nối thẳng qua GitHub 1 click:
1. Đăng nhập [koyeb.com](https://www.koyeb.com) bằng GitHub.
2. Nhấn **Create App** -> Chọn **GitHub**.
3. Chọn repo `kiet-w/ai-notebook`.
4. Cấu hình:
   - **Work directory**: `backend`
   - **Builder**: Chọn `Dockerfile` (hoặc `Buildpack`)
   - **Port**: `7860` (hoặc `3001`)
   - Thêm các biến môi trường tương tự như trên.
5. Nhấn **Deploy** -> Koyeb sẽ cấp URL dạng `https://ai-notebook-backend-xxx.koyeb.app`.

---

## 🌐 Bước 4: Deploy Frontend lên Cloudflare Pages

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Menu trái chọn **Workers & Pages** -> Nhấn **Create application** -> Chọn tab **Pages**.
3. Chọn **Connect to Git** -> Chọn tài khoản GitHub và chọn repo `kiet-w/ai-notebook`.
4. Cấu hình build:
   - **Project name**: `ai-notebook` (hoặc tên tùy thích).
   - **Production branch**: `main`.
   - **Framework preset**: Chọn **Next.js**.
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. Mục **Environment variables**:
   - Nhấn **Add variable**:
     - Variable name: `NEXT_PUBLIC_API_URL`
     - Value: *(URL Backend từ Hugging Face hoặc Koyeb ở Bước 3, ví dụ: `https://username-ai-notebook-api.hf.space`)*
6. Nhấn **Save and Deploy**.
7. Sau khi build xong, Cloudflare Pages sẽ cấp cho bạn một domain HTTPS miễn phí vĩnh viễn dạng `https://ai-notebook.pages.dev`!

---

## 🔄 Bước 5: Hoàn Tất Kết Nối Hai Chiều

- Quay lại Settings của **Hugging Face Space** (hoặc **Koyeb**) -> Cập nhật lại biến `FRONTEND_ORIGIN` thành đúng URL Cloudflare Pages của bạn (`https://ai-notebook.pages.dev`).
- Hệ thống sẽ tự động khởi động lại trong 10-15 giây để áp dụng CORS mới.

---

## ✨ Trải Nghiệm và Sử Dụng

1. Mở trình duyệt trên điện thoại hoặc máy tính truy cập `https://ai-notebook.pages.dev`.
2. Bấm **Đăng ký** tài khoản đầu tiên của bạn.
3. Tạo ghi chú mới, đính kèm ảnh hoặc PDF để kiểm tra tốc độ lưu lên Cloudflare R2 và Supabase.
4. Tận hưởng ứng dụng ghi chú cá nhân tốc độ cao 24/7 hoàn toàn miễn phí, không bao giờ lo bị ngủ!

