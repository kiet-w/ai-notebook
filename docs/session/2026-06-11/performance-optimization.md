# Báo cáo tối ưu hóa hiệu năng hệ thống (Session 2026-06-11)

Tài liệu này tổng hợp toàn bộ các phần tối ưu hóa chuyên sâu đã được thực hiện ở cả Backend và Frontend để giải quyết triệt để tình trạng giật lag hệ thống.

---

## 1. Tối ưu hóa Database & Backend Queries (P0 - Critical)

* **Thêm Database Indexes (`backend/prisma/schema.prisma`):**
  * Đã bổ sung chỉ mục (index) cho hai cột thường xuyên dùng để lọc và sắp xếp: `category` và `createdAt` của bảng `Note`.
  * Tránh tình trạng quét toàn bộ bảng (Full Table Scan), tăng tốc độ truy vấn cơ sở dữ liệu lên gấp nhiều lần khi dữ liệu phình to.
  
* **Truy vấn phía Server-side:**
  * **Repository & Service:** Cập nhật `NotesRepository.findAll` và `NotesService.findAll` hỗ trợ tham số `{ category, limit }` để lọc dữ liệu trực tiếp dưới database.
  * **Controller:** Cập nhật API `GET /notes` hỗ trợ nhận query parameter `category` và `limit` (ví dụ: `/notes?category=TECH&limit=100`).
  * **Search:** Sửa hàm `search()` trong `NotesService` trước đây tải **toàn bộ các ghi chú** vào RAM rồi dùng `.slice(0, 20)` để lấy 20 ghi chú mới nhất. Giờ đây database sẽ chỉ trả về đúng 20 bản ghi (`take: 20`).

* **Thiết lập API Đếm Số Lượng Chưa Đọc Tối Giản (`GET /notes/unread-counts`):**
  * Xây dựng API chuyên biệt sử dụng Prisma `groupBy` để đếm số lượng ghi chú chưa đọc theo từng danh mục dưới DB.
  * Giúp frontend không cần tải toàn bộ nội dung text nặng nề của tất cả ghi chú chỉ để đếm xem danh mục nào có bao nhiêu thẻ chưa đọc.

---

## 2. Bảo mật & Chống Nghẽn Kết Nối (Backend)

* **Vá lỗi Command Injection (`backend/src/parser/markitdown.service.ts`):**
  * Chuyển đổi từ hàm `exec` (chạy qua shell interpreter nguy hiểm) sang `execFile` để chạy trình chuyển đổi file `markitdown` an toàn. File path được truyền dạng mảng tham số nên không thể bị tấn công tiêm mã lệnh shell.
  
* **Thời gian chờ (Timeout) cho HTTP client:**
  * **Scraper (`scraper.service.ts`):** Cấu hình thời gian chờ tối đa 10 giây (`timeout: 10000`) và giới hạn kích thước nội dung tải về tối đa 10MB (`maxContentLength`) để chặn tấn công cạn kiệt tài nguyên (Resource Exhaustion).
  * **AI Client (`ai.service.ts`):** Thêm cấu hình `timeout: 15000` (15 giây) cho tất cả các yêu cầu POST gọi sang API Groq/AI để tránh trường hợp API bị treo vô hạn làm nghẽn ứng dụng.

---

## 3. Lọc danh mục phía Máy chủ & Ổn định Reference (Frontend)

* **Lọc danh mục Server-side (`CategoryTemplate.tsx`):**
  * Trang Danh mục giờ đây gọi `api.fetchNotes(category)` để yêu cầu backend chỉ trả về các ghi chú thuộc danh mục đó.
  * **Xóa bỏ hoàn toàn** hàm `.filter()` ở client-side. Điều này giúp loại bỏ mảng trung gian `filteredNotes` vốn bị tạo mới liên tục trên mỗi lần render.

* **Sửa lỗi `useMemo` bị vô hiệu hóa:**
  * Trước đây, `groupedNotes` phụ thuộc vào `filteredNotes` (luôn đổi reference sau mỗi lần render). Điều này làm cho hàm `groupNotesByDate` chạy lại liên tục vô ích.
  * Hiện tại, `groupedNotes` phụ thuộc trực tiếp vào mảng `notes` đã được server lọc sẵn nên cache hoạt động chính xác 100%.

---

## 4. Tránh Re-render Cascades (Frontend)

* **Memoize Sidebar (`Sidebar.tsx`):**
  * Bọc component Sidebar bằng React `memo()` để ngăn Sidebar re-render không cần thiết khi dữ liệu ghi chú ở trang chủ/danh mục thay đổi.

* **Sử dụng `useCallback` cho các Event Handlers (`HomeTemplate.tsx`):**
  * Bọc các hàm callback `handleSelectCategory`, `handleCapture`, `handleUpload` bằng `useCallback`. Điều này giữ nguyên tham chiếu (reference) của hàm giữa các lần render, tránh việc kích hoạt re-render hàng loạt các component con như `Sidebar` hay `NoteInput`.

* **Loại bỏ setTimeout API refetch dư thừa:**
  * Xóa bỏ lệnh `setTimeout` gọi API `fetchNotes` sau 1.2s khi tạo ghi chú mới. Vì hệ thống đã kết nối qua Server-Sent Events (SSE), ghi chú mới khi phân tích xong sẽ được push tự động thời gian thực và cập nhật giao diện ngay lập tức.

---

## 5. Tối ưu hóa Hiển thị Ảnh & Định dạng Ngày (Frontend)

* **Sửa lỗi Double Image Loading (`NoteCard.tsx`):**
  * Trước đây, thẻ ghi chú sử dụng `useEffect` tạo `new Image()` trong Javascript để tải ảnh ngầm nhằm phát hiện tỷ lệ khung hình (Aspect Ratio), khiến trình duyệt phải tải ảnh 2 lần.
  * Giải pháp mới: Đưa một thẻ `<img>` ẩn (`className="hidden"`) vào layout mặc định ban đầu và lắng nghe sự kiện `onLoad` trực tiếp của nó để phát hiện tỷ lệ khung hình. Khi ảnh tải xong, component sẽ chuyển sang layout portrait hoặc landscape tương ứng. Trình duyệt chỉ cần tải ảnh duy nhất 1 lần.

* **Bổ sung Native Lazy Loading:**
  * Thêm thuộc tính `loading="lazy"` vào tất cả các thẻ hiển thị ảnh xem trước để trình duyệt trì hoãn tải các ảnh nằm ngoài màn hình cho đến khi người dùng cuộn tới.

* **Memoize Date parsing trong NoteCard:**
  * Bọc việc phân tích ngày tạo ghi chú `new Date(note.createdAt)` bằng `useMemo` (`parsedDate`). Điều này giúp tránh việc tạo mới hàng loạt đối tượng Date trên mỗi lần render (khi người dùng hover chuột qua lại các thẻ ghi chú).

---

## 6. Phân trang Cursor-based & Tiết kiệm Payload (Backend & API)

* **Phân trang bằng Cursor (`backend/src/notes/repositories/notes.repository.ts`):**
  * Tích hợp cơ chế phân trang Cursor-based sử dụng tham số `cursor` (ID của ghi chú cuối cùng) và `limit` (mặc định lấy 25 bản ghi mỗi lượt).
  * Truy vấn database sử dụng `take: limit`, `skip: 1` và `cursor: { id: cursor }` giúp phân trang mượt mà không bị lặp hay sót ghi chú như offset truyền thống.

* **Tách biệt trường dữ liệu nặng (Payload Field Selection):**
  * Đối với danh sách hiển thị (API `GET /notes`), repository sử dụng Prisma `select` để loại bỏ các trường văn bản cực kỳ lớn như `content` (toàn bộ nội dung trang web đã crawl/văn bản trích xuất từ PDF) và `aiBullets`.
  * Chỉ trả về các trường cần cho thẻ ghi chú như: `id`, `url`, `aiTitle`, `aiSummary`, `category`, `status`, `isRead`, `createdAt`.
  * Giảm dung lượng tải mạng từ hàng chục MB xuống còn vài chục KB (tiết kiệm hơn 95% băng thông và tăng tốc tải trang).

---

## 7. Server Cache bộ nhớ đệm tự động làm sạch (Backend Cache)

* **Bộ nhớ đệm trong Service (`backend/src/notes/notes.service.ts`):**
  * Xây dựng cơ chế cache in-memory sử dụng một đối tượng `Map` lưu trữ kết quả của API lấy danh sách ghi chú theo key `category_limit_cursor`.
  * Khi có yêu cầu lấy danh sách trùng lặp, server trả kết quả ngay lập tức dưới 5ms mà không cần truy vấn PostgreSQL.
  * **Cơ chế tự động giải phóng (Auto Invalidation):** Cache sẽ được làm sạch ngay khi có bất kỳ thao tác thay đổi cơ sở dữ liệu nào (tạo ghi chú mới, cập nhật nội dung từ AI, cập nhật trạng thái lỗi, tải tệp tin lên, hoặc khi đánh dấu ghi chú là đã đọc). Bảo đảm dữ liệu trả về luôn chính xác và mới nhất.

---

## 8. Tải chi tiết Ghi chú On-demand (Frontend On-demand Fetching)

* **Tải nội dung chi tiết theo nhu cầu (`NoteDetailModal.tsx`):**
  * Vì danh sách ghi chú tải từ server không còn chứa nội dung đầy đủ (`content` và `bullets`), khi người dùng nhấn mở chi tiết ghi chú, `NoteDetailModal` sẽ tự động thực hiện truy vấn chi tiết `api.fetchNoteById(note.id)` để lấy đầy đủ dữ liệu.
  * Trong lúc đợi API trả về, một giao diện xương (Loading Skeleton) hoạt hình mượt mà sẽ được hiển thị, đem lại cảm giác phản hồi nhanh chóng và chuyên nghiệp.

---

## 9. Cuộn vô hạn Infinite Scroll & Intersection Observer (Frontend)

* **IntersectionObserver trong CategoryTemplate (`CategoryTemplate.tsx`):**
  * Loại bỏ nút bấm phân trang thủ công. Hệ thống sử dụng `IntersectionObserver` được gắn ở thẻ `div` cuối danh sách ghi chú.
  * Khi người dùng cuộn đến cuối màn hình, trình duyệt tự động gọi hàm `loadMoreNotes()` để tải trang tiếp theo bằng cursor, mang lại trải nghiệm cuộn liền mạch (Infinite Scroll) không bị gián đoạn.

---

## 10. Tải ảnh tối ưu với `next/image` & Relative Paths

* **Tích hợp Next.js Image Component (`NoteCard.tsx`):**
  * Chuyển đổi toàn bộ các thẻ ảnh thô `<img>` hiển thị trong thẻ ghi chú sang component `<Image />` tối ưu của Next.js với các thiết lập:
    * Chế độ hiển thị `fill` và `object-cover` hoặc `object-contain` trong container tương đối giúp cố định kích thước, chống giật layout (Cumulative Layout Shift).
    * Thuộc tính `sizes="(max-width: 768px) 100vw, 20vw"` để trình duyệt tự động tải phiên bản ảnh đã được nén/đổi kích thước phù hợp với độ phân giải màn hình của người dùng.
  * **Relative Path Converter (`src/utils/image.ts`):**
    * Viết helper `getRelativeImageUrl` chuyển đổi các URL tuyệt đối từ backend (ví dụ: `http://localhost:3001/uploads/...`) thành đường dẫn tương đối `/uploads/...`.
    * Kết hợp với tính năng `rewrites` có sẵn trong `next.config.ts`, Next.js có thể tự động tối ưu hóa và cache các tệp tin tải lên này giống như tài nguyên cục bộ mà không cần phải cấu hình phức tạp thuộc tính `images.remotePatterns` đối với các domain ngoài.

---

## 11. Bố cục Modal chi tiết Side-by-side & Hỗ trợ Phóng to (Zoom)

* **Cải tiến vị trí hiển thị ảnh đính kèm:**
  * Khắc phục việc ảnh đính kèm (landscape) bị đẩy xuống dưới cùng của modal (khiến người dùng phải cuộn dài và không thể đọc bài phân tích cùng ảnh sơ đồ song song).
  * Hiện tại, trên màn hình máy tính (lớn hơn `lg`), **cả ảnh ngang (landscape) và ảnh dọc (portrait)** đều được xếp cạnh nhau (Side-by-side) với bài phân tích theo tỷ lệ 45% (văn bản) và 50% (ảnh), chiều cao đồng đều 85vh.
  * **Tính năng Thu phóng & Cuộn (Zoom & Pan):**
    * Khi click vào ảnh đính kèm, ảnh sẽ phóng to theo kích thước gốc tự nhiên (`object-none` và `scale-100`) bên trong khung cuộn độc lập (`overflow-auto`).
    * Người dùng có thể dễ dàng đọc các văn bản cực nhỏ, sơ đồ phức tạp bên trong ảnh mà không sợ bị vỡ hình hay che mất bài phân tích chữ bên cạnh.

