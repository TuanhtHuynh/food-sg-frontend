# FOOD-SG FE — BUSINESS OVERVIEW

> Mô hình nghiệp vụ của **trang quản trị** Food-SG (React + TypeScript + Vite): ai dùng, dùng để làm gì, các module màn hình.
> Nguồn: `src/**`, `API_ROUTES.txt`, tài liệu backend `docs/`. Cập nhật: 2026-10-24.

| Tài liệu liên quan | Nội dung |
|---|---|
| [MODEL.md](MODEL.md) | Các type dữ liệu FE dùng & quan hệ với resource API |
| [FLOWS.md](FLOWS.md) | Luồng màn hình: product → store → mgr |
| [RULE.md](RULE.md) | Quy tắc riêng của FE (validate, token, cache, phân trang) |
| [PERMISS.md](PERMISS.md) | Ma trận quyền thao tác theo vai trò |
| [GLOSSARY.md](GLOSSARY.md) | Thuật ngữ giải thích cho MODEL |

---

## 0. Tổng quan 1 dòng

Food-SG FE là **trang quản trị nội bộ** (admin panel) của hệ thống Food SG: quản lý danh mục món ăn
và **tồn kho theo từng cửa hàng**. FE **không** phục vụ khách hàng (trang menu công khai) — phần đó
là một dự án FE khác; FE này chỉ dùng **endpoint có token**.

- Stack: React 19 · TypeScript · Vite 8 · TanStack Query 5 · TanStack Table 9 · React Hook Form 7 + Zod 4 · Tailwind CSS 4 · React Router 7
- Backend: Laravel 13 (`/api`), auth JWT
- Base URL API: `VITE_API_URL` (mặc định `/api`, dev proxy → `http://localhost:8000`)

---

## 1. Ai dùng hệ thống

| Actor | Vai trò trong hệ thống | Nhận diện | Nhiệm vụ chính | Phạm vi dữ liệu |
|---|---|---|---|---|
| **Guest** | Khách ẩn danh | Không đăng nhập | ❌ Không có màn hình nào; FE chỉ gọi endpoint guest để lấy *danh mục* sản phẩm, *danh sách cửa hàng* phục vụ bộ lọc/kho | Toàn hệ thống (chỉ đọc) |
| **Sales** — Bán hàng | Nhân viên tại quầy, thuộc 1 cửa hàng | `staff.role.slug = sales` | Xem tồn kho **cửa hàng của mình** (chỉ đọc) | Chỉ cửa hàng của mình |
| **Warehouse** — Quản kho | Nhân viên kho, giữ tồn của món | `staff.role.slug = warehouse` | Xem + **ghi tồn kho cửa hàng của mình** | Chỉ cửa hàng của mình |
| **Mgr** — Quản trị (admin) | Quản lý vận hành toàn hệ thống | `staff.role.slug = admin` | CRUD master data, vòng đời sản phẩm, quản lý tồn kho mọi cửa hàng | Toàn hệ thống |

### 1.1. Tài khoản ↔ hồ sơ nhân viên

FE đọc vai trò từ chuỗi `user.staff.role.slug` trả về bởi `GET /api/auth/me`:

```
User (đăng nhập) ──1:1──► Staff ──N:1──► Store   (cửa hàng = phạm vi quyền kho)
                            └──N:1──► Role    (admin | warehouse | sales)
```

- `user.staff === null` ⇒ đăng nhập được nhưng **không có quyền** (BE trả 403 mọi route cần role) → FE chặn ngay tại `RequireStaff`.
- `user.staff.role.slug` ngoài `admin|warehouse|sales` ⇒ **vai trò lạ** → FE không cấp menu nào, hiện thông báo "Vai trò ... chưa được hỗ trợ" (danh sách hợp lệ: `STAFF_ROLE_SLUGS` trong `src/api/types.ts`).
- Tài khoản demo: `admin@food-sg.test` · `warehouse1@food-sg.test` · `warehouse2@food-sg.test` · `sales1@food-sg.test` (mật khẩu `password`).

### 1.2. Mô hình dữ liệu mà FE thao tác

```
        CATALOG (quản trị)                KHO (mọi vai trò)
   ┌──────────────────────────┐      ┌──────────────────────────┐
   │ Product ──1── Category   │      │ Stock ──N:1── Product    │
   │   slug + meta_* (SEO)    │      │   store_id  (cửa hàng)   │
   │   price + sale window    │      │   staff_id  (nv giữ kho) │
   │ Category ──1── Product   │      │   quantity  (>= 0)       │
   │ Size / Ingredient (id)   │      └──────────────────────────┘
   │ Store (name + address)   │
   └──────────────────────────┘
```

Trung tâm nghiệp vụ mà FE phải thể hiện đúng: **tồn kho thuộc về CỬA HÀNG, không thuộc về sản phẩm**.
Cùng một món ở hai cửa hàng là **hai bản ghi kho khác nhau**, và mỗi nhân viên chỉ thấy cửa hàng của mình.

---

## 2. Các module màn hình (FE)

| # | Module | Màn hình | Endpoint | Quyền |
|---|---|---|---|---|
| **F1** | Đăng nhập & phiên | `/login` | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | công khai / mọi user đã đăng nhập |
| **F2** | Master data (CRUD) | `/admin/products`, `/admin/categories`, `/admin/sizes`, `/admin/ingredients`, `/admin/stores` | `/api/admin/{resource}` | admin |
| **F3** | Bảng giá & khuyến mãi | `/admin/prices` | `GET /api/products` (guest) | admin / warehouse / sales |
| **F4** | Tồn kho theo cửa hàng | `/admin/stock` | `/api/stock` | đọc: admin/warehouse/sales · ghi: admin/warehouse |
| **F5** | Vòng đời sản phẩm | Hộp thoại "Sản phẩm đã xoá" (trong `/admin/products`) | `POST /api/admin/products/{id}/restore`, `DELETE /api/admin/products/{id}/force` | admin |
| **F6** | Tổng quan | `/admin` | `/api/admin/*` (đếm bản ghi qua `meta.total`) | admin |
| **F7** | Danh mục tra cứu (phụ trợ) | dùng chung cho bộ lọc & chọn sản phẩm | `GET /api/categories`, `GET /api/stores`, `GET /api/products` | công khai |
| **F8** | Trang công khai (guest) | `/`, `/categories/{slug}`, `/products/{slug}` | `GET /api/categories`, `/api/products`, `/api/search` | công khai |
| **F9** | Chấm công & lương | `/admin/attendance` | `POST /api/attendance/clock-in`, `POST /api/attendance/clock-out`, `GET /api/attendance/salary` | admin / warehouse / sales |
| **F10** | Nhân viên (đọc) | `/admin/staff` | `GET /api/attendance/staff` | admin / warehouse / sales (BE ghim store) |
| **F11** | Hồ sơ nhân viên | `/admin/profile` | `GET /api/staff/profile` | warehouse / sales (BE chặn admin) |

### 2.1. Mô tả từng module

**F1 — Đăng nhập & phiên**
- `LoginPage`: validate bằng Zod (`email` hợp lệ, `password` không rỗng) → `POST /api/auth/login`.
- Token JWT lưu ở `localStorage` (`food-sg-admin-token`), hạn 3600s.
- Khi mở app có token ⇒ gọi `GET /api/auth/me` để khôi phục phiên + vai trò.
- Sai thông tin ⇒ BE trả 422 `errors.email` → hiện thông báo `"Thông tin đăng nhập không đúng."`.
- Quá 5 lần/phút ⇒ 429 → hiện message của BE.

**F2 — Master data**
- Mỗi resource dùng **1 bảng server-side** (15 bản ghi/trang) + ô tìm kiếm `?q=` + các bộ lọc riêng.
- Form dùng React Hook Form + Zod; lỗi 422 của BE được gán đúng vào field (`mapServerErrors`).
- Sửa là **partial update** ở phía BE, nhưng FE gửi đủ field của form (an toàn, BE chấp nhận).
- **Ảnh sản phẩm (`products.image`)**: form có ô chọn file (jpg/jpeg/png/webp ≤ 2048KB). Có file ⇒ gửi **multipart/form-data** (tạo = POST; sửa = POST + `_method=PUT` vì PHP không parse multipart PUT). Không có file ⇒ JSON như cũ, BE giữ ảnh hiện tại.

**F3 — Bảng giá & khuyến mãi**
- Màn `/admin/prices`: danh sách món với **giá gốc**, **giá khuyến mãi**, **cửa sổ khuyến mãi** và **giá bán hiện hành**.
- Dữ liệu lấy từ `GET /api/products` (guest) qua "thư mục sản phẩm" — nhờ vậy **cả 3 vai trò** (kể cả `sales` tại quầy) đều xem được giá mà không cần quyền admin.
- Khuyến mãi được coi là **đang áp dụng** khi có `sale_price` và (không có cửa sổ HOẶC thời điểm hiện tại nằm trong `[sale_start_at, sale_end_at]`).
- Nếu `sale_price > price` ⇒ hiện cảnh báo "Giá KM > giá gốc" (BE chưa chặn trường hợp này).
- Lọc & tìm kiếm chạy **client-side** trên thư mục sản phẩm; phân trang 15 dòng/trang.

**F4 — Kho**
- Bảng tồn kho: Sản phẩm · Cửa hàng · Số lượng · NV phụ trách · Cập nhật.
- Lọc: tìm theo tên/slug sản phẩm (`?q=`), lọc cửa hàng (chỉ admin gửi `store_id`).
- Ghi tồn kho: chọn sản phẩm (+ cửa hàng nếu admin) + số lượng ⇒ `POST /api/stock` (upsert theo `(product_id, store_id)`).
- Sửa: chỉ sửa được **số lượng**; chọn lại **NV phụ trách** được (BE giữ `staff_id` cũ khi không gửi).
- Xoá: `DELETE /api/stock/{id}`.
- Nhân viên kho không gửi `store_id`/`staff_id` — BE tự ghim theo cửa hàng của họ.
- "NV phụ trách" hiện **tên thật** (tra qua danh mục nhân viên từ `GET /api/attendance/staff`; `StockResource` không trả object `staff`).

**F9 — Chấm công & lương (mới 2026-10-24)**
- Hai nút to: **Chấm công vào** (`POST /api/attendance/clock-in`, BE trả 201 + bản ghi `clock_ins`) và **Chấm công ra** (`POST /api/attendance/clock-out`; 404 "Không có ca đang mở").
-Sau khi thao tác hiện dòng "Ca #id · Vào… · Ra…" lấy từ response.
- Thẻ **Lương theo giờ**: `GET /api/attendance/salary` ⇒ `{ staff_id, store_id, total_hours, note }` — tổng giờ làm **tròn** từ `staff_shifts` của chính mình; BE chưa trả rate ⇒ chỉ hiện số giờ.
- Không chấm công vào ⇒ ca không tính giờ (RULE BE §Chấm công).

**F10 — Nhân viên (đọc, mới 2026-10-24)**
- `GET /api/attendance/staff` trả **mảng thẳng** (không phân trang) của `Staff` + `user` + `store` nạp sẵn.
- BE ghim store: nhân viên thấy store mình; **lưu ý quirk BE**: controller so sánh `role->name !== 'admin'` mà name là "Quản trị" ⇒ admin cũng bị ghim store của admin.
- Bảng: Nhân viên · Tài khoản (user.name + email) · Cửa hàng · Cập nhật. Read-only (BE chưa có CRUD staff).
- Cùng nguồn dữ liệu với dropdown **NV phụ trách** ở form kho.

**F11 — Hồ sơ nhân viên (mới 2026-10-24)**
- `GET /api/staff/profile` — BE middleware `role:warehouse,sales` ⇒ **admin bị từ chối** (403); FE chặn bằng `RequireWorker`.
- Hiện: họ tên, email, tên nhân viên, vai trò, cửa hàng, ngày tạo.

**F5 — Vòng đời sản phẩm**
- Xoá mềm = `DELETE /api/admin/products/{id}` ⇒ sản phẩm + nhân viên phụ trách + user của nhân viên đó bị ẩn; tồn kho giữ nguyên.
- Khôi phục = `POST /api/admin/products/{id}/restore` ⇒ gỡ trạng thái xoá của cả sản phẩm, nhân viên, user.
- Xoá cứng = `DELETE /api/admin/products/{id}/force` ⇒ không thể hoàn tác.
- ⚠ BE **chưa có** endpoint liệt kê sản phẩm đã xoá ⇒ FE làm hộp thoại nhập **id** sản phẩm để khôi phục/xoá cứng.

**F6 — Tổng quan**
- 5 thẻ đếm bản ghi (sản phẩm, danh mục, size, nguyên liệu, cửa hàng) lấy từ `meta.total` của các list admin.
- Thẻ "Tài khoản": họ tên, email, vai trò, cửa hàng (từ `user.staff`).

**F7 — Danh mục tra cứu phụ trợ**
- `GET /api/categories` → dropdown chọn danh mục khi tạo/sửa sản phẩm + cột "số sản phẩm".
- `GET /api/stores` → dropdown chọn cửa hàng (lọc sản phẩm, chọn kho) — dùng endpoint **guest** để mọi vai trò đều gọi được.
- `GET /api/products` (per_page=50, mọi trang) → "thư mục sản phẩm" để tra tên khi BE chỉ trả `product_id`.

**F8 — Trang công khai (guest)**
- `PublicLayout`: header dính (logo, **mega menu danh mục**, ô tìm kiếm, chọn cửa hàng, nút "Quản trị") + footer.
- **Mega menu danh mục**: hover hoặc bấm nút "Danh mục" ⇒ hiện **tất cả danh mục** (dạng lưới nhiều cột), mỗi danh mục kèm tối đa 6 món nổi bật + số món + link "Xem tất cả" — mỗi món có **thumb 32px**.
- Trang chủ `/`: hero, lưới danh mục, mục "Đang khuyến mãi", mục "Menu hôm nay" (12 món, lọc theo cửa hàng đã chọn).
- `/categories/{slug}`: thông tin danh mục (`products_count`, `meta_description`) + danh sách món phân trang 12/trang.
- `/products/{slug}`: **ảnh lớn từ DB**, giá/giá khuyến mãi + cửa sổ KM, size, nguyên liệu, **tồn kho theo từng cửa hàng** (từ `stocks`).
- Tìm kiếm: `GET /api/search?q=` (≥ 2 ký tự) trả về ≤20 món + ≤20 danh mục ⇒ dropdown gợi ý (món kèm thumb).
- URL chuẩn theo RULE R1.7 của BE: `/products/{slug}` và `/categories/{slug}`.

---

## 3. Trạng thái hiện tại (as-is) & khoảng trống

**Đã có:** F1–F11 — admin dùng đủ; warehouse/sales có **Bảng giá**, **Kho**, **Chấm công & lương**, **Nhân viên**, **Hồ sơ** đúng phạm vi; khách xem trang public có mega menu và **ảnh thật của món**.

| Khoảng trống | Mức độ | Ghi chú |
|---|---|---|
| BE chưa có endpoint **list sản phẩm đã xoá** | Cao | FE phải nhập id thủ công để khôi phục/xoá cứng |
| BE chưa có API **quản lý staff CRUD** (M6) | Cao | CHỈ có **list** (`/api/attendance/staff`, read-only) ⇒ admin chọn được `staff_id` khi ghi kho nhưng không tạo/sửa/xoá staff |
| BE chưa trả **rate lương** trong `/attendance/salary` | Trung bình | FE chỉ hiện `total_hours`; chưa có số tiền và lương theo nhóm staff |
| BE quirk: list staff ghim cả admin (so `role->name`) | Thấp | FE hiển thị nguyên trạng |
| Bảng giá chỉ lấy tối đa 1000 món (20 trang × 50) | Thấp | Dùng chung "thư mục sản phẩm" với màn Kho |
| Chưa có export/nhập hàng loạt | Thấp | — |
| Bundle JS > 500kB | Thấp | Vite gợi ý code-split |

---

## 4. Phụ lục — bản đồ mã nguồn

| Nhóm | File |
|---|---|
| Điểm vào | `src/main.tsx` (QueryClientProvider + AuthProvider) |
| Định tuyến & phân quyền route | `src/app/App.tsx` (`RequireStaff`, `RequireAdmin`, `RequireWorker`) |
| Phiên & vai trò | `src/auth/provider.tsx`, `src/auth/context.ts` |
| Gọi API + hooks | `src/api/queries.ts` |
| Kiểu dữ liệu | `src/api/types.ts` (thêm `image`, `ClockEntry`, `SalarySummary`, `staff.user`) |
| Validate form | `src/api/schemas.ts` |
| Tiện ích (fetch, format, FormData, ảnh) | `src/lib/client.ts` (`apiRequest` hỗ trợ multipart, `imageUrl`) |
| Hook tiện ích (debounce) | `src/lib/hooks.ts` |
| Component dùng chung | `src/components/{DataTable,ResourceTable,form,ui}.tsx` |
| Ảnh sản phẩm | `src/components/ProductThumb.tsx` (`<img>` lazy từ + `imageUrl`) |
| Layout & menu theo vai trò | `src/layouts/AdminLayout.tsx` |
| Màn hình | `src/pages/LoginPage.tsx`, `src/pages/admin/*`, `src/pages/public/*` |
| Màn hình mới 2026-10-24 | `src/pages/admin/{AttendancePage,StaffPage,ProfilePage}.tsx` |
| Tài liệu API | `API_ROUTES.txt` (bản mirror của backend) |
