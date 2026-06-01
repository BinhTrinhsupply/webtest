# Kế hoạch xây Backend BinhTrinhAcademy

Giao diện trang ngoài hiện tại được **giữ nguyên 100%**. Chỉ thêm logic backend + các trang nội bộ mới (`/login`, `/register`, `/my-courses`, `/learn/$courseId/$lessonId`, `/checkout/$courseId`, `/admin/*`).

---

## PHA 1 — Nền tảng (thực hiện ngay trong turn này)

Đây là phần mọi thứ khác phụ thuộc vào, nên phải làm chắc trước.

### 1.1 Database (migration)
- `profiles` (id ↔ auth.users, full_name, phone, created_at)
- `user_roles` (user_id, role enum: `admin` | `student`) — bảng riêng theo best practice, KHÔNG nhét role vào profiles
- `courses` (slug, title, short_desc, long_desc, thumbnail_url, price, sale_price, is_published)
- `chapters` (course_id, title, order_index)
- `lessons` (chapter_id, title, content_type: video/text/file, video_url, text_content, attachment_url, tags text[], order_index)
- `orders` (user_id, course_id, bump_product_id nullable, total_amount, payment_method, status: pending/completed/cancelled, sepay_ref, paid_at)
- `order_items` (order_id, product_type, product_id, amount) — cho Order Bump
- `progress` (user_id, lesson_id, completed_at) — unique (user_id, lesson_id)
- `bump_products` (title, description, price, sale_price) — sản phẩm Upsell
- `site_settings` (singleton: facebook_pixel_id, ga_id, sepay_bank, sepay_account_number, sepay_account_name)

### 1.2 Bảo mật
- RLS bật trên TẤT cả bảng
- Hàm SECURITY DEFINER `has_role(_uid, _role)` để tránh recursion
- Học viên chỉ xem được order/progress của chính mình
- Học viên chỉ xem được lesson nếu đã mua khóa (qua hàm `user_has_course_access`)
- Admin (qua `has_role`) full quyền
- Trigger tự tạo profile khi user signup
- Trigger tự gán role `student` cho user mới
- **Seed**: tự động cấp role `admin` cho email `trinhdinhbinh2k@gmail.com` khi tài khoản này signup lần đầu (qua trigger check email)

### 1.3 Auth
- `/register` — email + password + họ tên + SĐT
- `/login` — email + password, redirect theo role (admin → `/admin`, student → `/my-courses`)
- Root listener `onAuthStateChange` → invalidate router
- `_authenticated` layout (bảo vệ /my-courses, /learn, /checkout)
- `_admin` layout (bảo vệ /admin/*, check `has_role('admin')`)

### 1.4 Header cập nhật
- Thêm nút "Tài khoản"/avatar khi đăng nhập, dropdown: Lớp học của tôi / Đăng xuất
- Nút "Đăng nhập" hiện tại → link `/login`

---

## PHA 2 — Admin Dashboard + Student Portal (turn tiếp theo)

### Admin (`/admin`)
- Tab **Khóa học**: cây Course → Chapter → Lesson; thêm/sửa/xóa; ô tag input (Enter để thêm chip màu)
- Tab **Học viên**: bảng users + khóa đã mua; click → xem progress bar; nút "Kích hoạt nhanh" (tạo order completed thủ công) và "Khóa tài khoản"
- Tab **Doanh thu**: biểu đồ recharts từ orders completed
- Tab **Cài đặt**: Pixel ID, GA ID, SePay bank info

### Student
- `/my-courses`: cards các khóa đã mua + progress bar
- `/learn/$courseId/$lessonId`: sidebar dọc (chapters + lessons với checkmark), khung video iframe đa nguồn, nội dung text, nút tải tài liệu, nút "Đã hoàn thành & học tiếp"

---

## PHA 3 — Checkout, SePay, Email, Tracking (turn thứ 3)

### Checkout
- `/checkout/$courseId`: form thông tin + Order Bump box (tích chọn cộng thêm tiền)
- Tạo order `pending` → hiện trang QR SePay với mã ref unique
- Polling status order mỗi 3s

### SePay webhook
- `/api/public/webhooks/sepay` server route
- Verify signature, parse số tiền + nội dung CK chứa ref
- Match order → set `completed` → mở khóa truy cập → enqueue email + fire Purchase event qua client

### Email (Lovable Email)
- Setup email domain (sẽ ask)
- Templates: Welcome (signup), Course Activated (order completed)

### Tracking
- Component `<Tracking>` đọc settings từ DB, inject Pixel + GA snippet ở __root
- Hook `useFbPixel()` với `track('ViewContent' | 'InitiateCheckout' | 'Purchase', {...})`
- Gọi ở 3 vị trí tương ứng

---

## Chi tiết kỹ thuật

- **Server functions**: tất cả CRUD đi qua `createServerFn` với `requireSupabaseAuth` (không gọi `supabase.from()` trực tiếp trong loader cho data nhạy cảm)
- **Admin-only mutations**: kiểm tra `has_role(userId, 'admin')` bên trong handler trước khi mutation
- **Player video**: regex detect YouTube/Vimeo/Bunny → render iframe phù hợp
- **SePay**: dùng signature HMAC + IP whitelist; ref order = `BTA{order_id_short}`
- **Type safety**: TanStack Query + Zod validators trên mọi serverFn

---

## Sau khi tôi build Pha 1, bạn cần:
1. Vào `/register` và đăng ký với email `trinhdinhbinh2k@gmail.com` → tự động thành Admin
2. Confirm để tôi tiếp tục Pha 2

Bấm "Approve" để tôi bắt đầu Pha 1 ngay.