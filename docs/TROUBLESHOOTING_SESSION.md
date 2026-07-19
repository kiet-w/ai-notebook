# Báo cáo: Tổng hợp Lỗi và Giải pháp (Troubleshooting Session)

Tài liệu này ghi lại toàn bộ các vấn đề (bug) đã xảy ra trong quá trình phát triển, phân tích nguyên nhân gốc rễ và cách giải quyết chi tiết để phục vụ cho việc bảo trì dự án AI Notebook.

---

## 1. Lỗi Cache React Query: "Import Note xong báo thành công nhưng không thấy Note trong Category"

### 📌 Biểu hiện
Người dùng tạo hoặc tải lên một Note mới ở trang Chủ (Home) chọn mục `Tech`. Hệ thống báo xử lý thành công (chuyển sang màu xanh), tự động chuyển hướng người dùng sang trang danh mục `/Tech`, nhưng danh sách Note ở trang `/Tech` trống trơn hoặc không hiện Note vừa tạo.

### 🔍 Nguyên nhân gốc rễ
1. Khi tạo Note ở màn hình Home, Frontend tối ưu trải nghiệm (Optimistic UI) bằng cách tự động push Note vừa tạo vào cache `['notes', 'recent']`.
2. Khi Backend xử lý AI xong, nó gửi sự kiện `note-updated` qua WebSocket với trạng thái `COMPLETED`.
3. File `QueryProvider.tsx` bắt sự kiện này và dùng hàm `queryClient.setQueriesData({ queryKey: ['notes'] })` để lặp qua **tất cả** các cache liên quan đến Note nhằm tìm và update.
4. Quá trình tìm kiếm đã phát hiện Note nằm trong cache `['notes', 'recent']`. Nó đánh dấu biến cờ `wasUpdatedInCache = true`.
5. Đoạn code cũ có logic: **Nếu đã tìm thấy và update trong cache rồi (`wasUpdatedInCache === true`) thì KHÔNG CẦN gọi `invalidateQueries` (refresh) nữa để tiết kiệm request.**
6. Hậu quả: Cache của trang danh mục (`['notes', 'category', 'Tech']`) không bao giờ được thông báo là phải làm mới. Khi chuyển sang trang `/Tech`, React Query vẫn lấy dữ liệu cũ rích ra hiển thị.

### 🛠 Cách giải quyết
Sửa đổi logic trong `frontend/src/components/providers/QueryProvider.tsx`:
Ép buộc hệ thống phải xoá cache (force refetch) đối với toàn bộ các màn hình nếu một Note vừa chạy xong trạng thái phân tích.
```typescript
// Nếu note không có sẵn trong cache HOẶC note vừa xử lý xong (COMPLETED)
// thì force refetch toàn bộ query 'notes' để category tabs được cập nhật
if (!wasUpdatedInCache || updatedNote.status === 'COMPLETED') {
  queryClient.invalidateQueries({ queryKey: ['notes'] });
}
```

---

## 2. Lỗi API 503: "Model AI từ chối phân tích nội dung"

### 📌 Biểu hiện
Khi tạo Note, quá trình trích xuất thông tin chạy rất chậm và cuối cùng trạng thái chuyển sang đỏ (`FAILED`). Trong log Backend báo lỗi `503 Service Unavailable - This model is currently experiencing high demand`.

### 🔍 Nguyên nhân gốc rễ
File cấu hình `ai.service.ts` đang ép cứng việc sử dụng model `gemini-2.5-flash-lite`. Phiên bản này của Google có thể đang trong giai đoạn giới hạn (rate-limit) hoặc máy chủ Google đang bị quá tải, dẫn đến việc request bị từ chối liên tục.

### 🛠 Cách giải quyết
Đổi trực tiếp model trong source code `ai.service.ts` từ `gemini-2.5-flash-lite` sang `gemini-1.5-flash` (phiên bản ổn định, tốc độ siêu nhanh và tỷ lệ lỗi cực thấp).

---

## 3. Chuyển đổi sang Local LLM (Ollama) để chạy Offline 100%

### 📌 Vấn đề
Mặc dù đã đổi sang `gemini-1.5-flash`, hệ thống phụ thuộc vào API của bên thứ 3 vẫn mang lại rủi ro giới hạn (rate limit) hoặc lộ dữ liệu người dùng. Người dùng muốn tự chạy một Local LLM trên máy cá nhân để thay thế.

### 🔍 Phân tích hiện trạng
- Máy của người dùng có cài đặt `Ollama` (`/usr/local/bin/ollama`), nhưng Server Ollama chưa được bật.
- `ollama list` trả về danh sách rỗng (Chưa tải model nào).
- Code `ai.service.ts` của Backend chỉ hỗ trợ gọi API lên Google Gemini hoặc Groq, chưa có tính năng đọc Local LLM.

### 🛠 Các bước cấu hình & Tích hợp
1. **Khởi động Ollama Server:** Chạy ngầm `ollama serve` ở background.
2. **Kéo Model AI:** Chạy lệnh `ollama pull llama3.2` để lấy model 3 Tỷ tham số siêu nhẹ của Meta về máy.
3. **Cập nhật Backend (`ai.service.ts`):** 
   - Viết thêm hàm `callLocalLLM` với endpoint tuân thủ chuẩn OpenAI (`/chat/completions`).
   - Cập nhật logic: Ưu tiên check biến môi trường `LOCAL_LLM_URL` trước. Nếu có, mọi request AI sẽ gửi thẳng vào Local.
4. **Cập nhật `.env`:** Thêm vào file `.env` của Backend cấu hình:
   ```env
   LOCAL_LLM_URL="http://localhost:11434/v1"
   LOCAL_LLM_MODEL="llama3.2"
   ```

*(Ghi chú: Lợi ích của việc thiết lập này là dữ liệu người dùng sẽ được giữ lại 100% trên máy tính cá nhân, quá trình phân tích không bị giới hạn số lượng token mỗi ngày).*

---

## 4. Cảnh báo "WebSocket was interrupted while the page was loading" (Firefox)

### 📌 Biểu hiện
Người dùng xem Console của Firefox thì thấy dòng chữ đỏ thông báo lỗi WebSocket bị ngắt kết nối đột ngột (Interrupted).

### 🔍 Nguyên nhân gốc rễ
Đây **KHÔNG PHẢI LỖI CODE**. Trình duyệt tự sinh ra log này khi:
1. Token của người dùng hết hạn.
2. Code Frontend chủ động đá người dùng về trang Login thông qua lệnh `window.location.href = '/auth/login'`.
3. Lúc chuyển hướng, trang web cũ bị "giết" (unload), dẫn tới trình duyệt tự động ngắt toàn bộ kết nối WebSocket đang mở. Firefox chỉ in log để thông báo sự kiện ngắt kết nối này.

### 🛠 Cách giải quyết
Không cần sửa vì đây là tính năng bảo mật của trình duyệt. 

---

## 5. Vòng lặp Vô hạn khi Hết hạn Token (Infinite Redirect Loop) - Đã fix từ trước

### 📌 Biểu hiện
Khi Access Token và Refresh Token đều hết hạn, người dùng bị kẹt vào vòng lặp tải trang vĩnh viễn ở Frontend, không thể nào quay về trang Đăng nhập.

### 🔍 Nguyên nhân gốc rễ
Trình duyệt lưu Refresh Token bằng HttpOnly Cookie. Khi Refresh Token hết hạn, API trả về `401 Unauthorized`. Frontend bắt được lỗi 401 liền gọi lệnh chuyển về `/auth/login`. Tuy nhiên, vì cookie cũ VẪN CÒN ĐÓ chưa bị xóa, nên khi vừa vào `/auth/login`, code bảo mật lại tưởng người dùng đã có token nên đá ngược lại trang chủ `/`. Vòng lặp xảy ra liên tục.

### 🛠 Cách giải quyết
1. **Backend:** Bổ sung API `POST /users/logout` có nhiệm vụ clear `HttpOnly Cookie`.
2. **Frontend (`api.ts`):** Trước khi dùng lệnh `window.location.href = '/auth/login'`, bắt buộc phải gọi API `/users/logout` để ép trình duyệt xoá cookie độc hại đó đi. Xoá xong mới nhảy trang.

---

## 6. Lỗi API 400 Bad Request: "Không thể đăng nhập do payload bị thừa dữ liệu"

### 📌 Biểu hiện
Người dùng nhập đúng email và password ở màn hình Đăng nhập nhưng khi bấm Submit, hệ thống báo lỗi đỏ (thường là lỗi 400 Bad Request ở Network Tab). Log Backend hiện mã HTTP 400 cho API `POST /users/login`.

### 🔍 Nguyên nhân gốc rễ
1. **Frontend (`api.ts`):** Trong hàm `login`, Frontend tự ý gửi thêm trường `user` (được cắt ra từ tiền tố của email) vào request payload:
   ```typescript
   const res = await apiInstance.post('/users/login', { email, password, user: email.split('@')[0] });
   ```
2. **Backend (`main.ts` & `login.dto.ts`):** Backend có thiết lập class-validator siêu chặt chẽ ở cấp toàn cầu bằng ValidationPipe:
   ```typescript
   new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
   ```
   Quy tắc này sẽ tự động chặn TẤT CẢ các request nếu phát hiện có bất kỳ trường dữ liệu lạ nào truyền lên mà không có trong DTO (Whitelist). `LoginDto` chỉ cho phép `email` và `password`, do đó sự xuất hiện của biến `user` đã bị hệ thống an ninh đá văng bằng mã `400 Bad Request`.

### 🛠 Cách giải quyết
Sửa lại hàm `login` trong `frontend/src/utils/api.ts`, bỏ đi biến `user` bị thừa:
```typescript
const res = await apiInstance.post('/users/login', { email, password });
```
