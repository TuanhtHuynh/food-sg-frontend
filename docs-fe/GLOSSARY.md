# FOOD-SG FE — GLOSSARY

> Thuật ngữ dùng trong frontend Food-SG, giải thích theo đúng cấu trúc dữ liệu & code của FE.
> Nguồn: `src/**`, `API_ROUTES.txt`. Cập nhật: 2026-10-24.
> Model: [MODEL.md](MODEL.md) · Quy tắc: [RULE.md](RULE.md) · Quyền: [PERMISS.md](PERMISS.md) · Tổng quan: [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## A. Nghiệp vụ (mô tả trong hệ thống Food-SG)

| Thuật ngữ | Tiếng Việt | Giải thích trong hệ thống |
|---|---|---|
| **Product** | Sản phẩm / Món ăn | Đơn vị bán ra: `name`, `price`, `sale_price` + cửa sổ khuyến mãi, `slug` + 3 trường SEO, thuộc 1 `category`. Xoá mềm, có thể khôi phục hoặc xoá cứng. Trong FE: `src/api/types.ts` → `Product`. |
| **Category** | Danh mục | Nhóm sản phẩm (món chính, món phụ, nước…). Có `slug` unique + `meta_*`. Xoá danh mục ⇒ BE xoá **cứng** cả sản phẩm con ⇒ FE phải cảnh báo trước khi xoá. |
| **Size** | Kích thước / Khẩu phần | Quy mô phục vụ (Nhỏ, Vừa, Lớp). Chỉ có `id` + `name`, định danh bằng id. |
| **Ingredient** | Nguyên liệu | Thành phần của món (Bò, Hành…). Chỉ có `id` + `name`. |
| **Store** | Cửa hàng / Chi nhánh | Đơn vị tổ chức của nhân viên **và phạm vi quyền kho**. Có `name` + `address` (cả hai bắt buộc). Xoá store ⇒ mất luôn nhân viên **và** tồn kho của cửa hàng đó. |
| **Staff** | Nhân viên | Hồ sơ nhân viên: `user_id`, `store_id` (cửa hàng), `role_id` (vai trò), `product_id` (món phụ trách). FE chỉ **đọc** hồ sơ này qua `user.staff`. |
| **User** | Tài khoản người dùng | Tài khoản đăng nhập: `email` + `password`. Có thể gắn 0..1 staff. FE giữ phiên bằng token JWT. |
| **Role** | Vai trò | `admin` (quản trị), `warehouse` (quản kho), `sales` (bán hàng). FE đọc `role.slug` để dựng menu & cờ quyền; danh sách hợp lệ khai ở `STAFF_ROLE_SLUGS` (`src/api/types.ts`) vì BE chưa có endpoint list role. |
| **ProductStock** | Bản ghi tồn kho | Mức tồn của 1 sản phẩm **tại 1 cửa hàng**: `product_id` + `store_id` + `staff_id` (nullable) + `quantity`. Ràng buộc BE: unique `(product_id, store_id)`. |
| **Mức tồn (quantity)** | Số lượng tồn | Số nguyên ≥ 0, là **mức hiện tại** — hệ thống chưa lưu lịch sử nhập/xuất. |
| **Clock-in / Clock-out** | Chấm công vào/ra | `POST /attendance/clock-in` tạo bản ghi `clock_ins` (clock_out null); clock-out đóng ca. Không chấm công vào ⇒ ca không tính giờ. Xem `AttendancePage`. |
| **Ca đang mở** | Ca chưa clock-out | Bản ghi `clock_ins` có `clock_out = null`. BE chỉ đếm ca **mới nhất** của mình. |
| **Tổng giờ làm tròn (total_hours)** | Giờ công | `SUM(staff_shifts.hours)` của chính mình — BE làm tròn sẵn; chưa nhân rate ⇒ chưa có số tiền. |
| **Danh mục nhân viên (staff directory)** | Tra cứu nhân viên | `Map<staff_id, Staff>` từ `GET /api/attendance/staff` — tra tên NV phụ trách + dropdown chọn `staff_id` (query key `['staff','directory']`). |
| **Ảnh sản phẩm (product_image)** | Ảnh món | `products.image` — file lưu ở **BE** (`storage/app/public/products`), FE chỉ nhận URL và render `<img>`. |

## B. Quan hệ & cấu trúc dữ liệu

| Thuật ngữ | Tiếng Việt | Giải thích trong hệ thống |
|---|---|---|
| **1:N** | Một – nhiềi | VD 1 cửa hàng có nhiều bản ghi tồn kho. |
| **N:N** | Nhiều – nhiều | VD sản phẩm – size, sản phẩm – nguyên liệu (bảng nối ở BE). |
| **1:1** | Một – một | VD user – staff (`staff.user_id` unique). |
| **Quan hệ lồng (nested)** | Quan hệ nhúng | BE trả sẵn object con trong JSON: `product.category`, `stock.store`, `user.staff.role` ⇒ FE không cần gọi thêm API để lấy tên. |
| **Khoá ngoại (FK)** | Khoá ngoại | Trường `*_id` trỏ tới bảng khác: `category_id`, `store_id`, `staff_id`, `product_id`. FE dùng chúng để nối dữ liệu hiển thị. |
| **Resource** | Định dạng response chuẩn | JSON do BE định nghĩa cho từng model (`ProductResource`, `StockResource`…). FE map 1–1 sang type. |
| **Type / Interface** | Kiểu dữ liệu FE | Khai báo trong `src/api/types.ts` — mô tả shape JSON. Nguồn sự thật cho component. |
| **Query key** | Khoá cache client | Chuỗi định danh 1 query của TanStack Query, ví dụ `['stock', { page: 1 }]` — đổi key ⇒ refetch. |
| **Invalidate** | Vô hiệu hoá cache | Xoá cache của 1 query key sau khi ghi dữ liệu ⇒ UI tự refetch. |
| **Thư mục sản phẩm (directory)** | Danh mục tra cứu sản phẩm | Bản đồ `product_id → Product` dựng từ `GET /api/products` — dùng để hiện tên sản phẩm cho bảng kho (BE không trả tên trong `StockResource`). |
| **Slug** | Định danh URL | Chuỗi thân thiện SEO, unique, BE tự sinh từ `name` khi client không gửi. |
| **SEO fields** | Trường SEO | `meta_title`, `meta_description`, `meta_keyword` — chỉ có ở product & category. |
| **Cửa sổ khuyến mãi** | Sale window | Khoảng `sale_start_at` → `sale_end_at` áp dụng `sale_price`. |

## C. Vòng đời dữ liệu (nhìn từ FE)

| Thuật ngữ | Tiếng Việt | Giải thích trong hệ thống |
|---|---|---|
| **Soft delete (xoá mềm)** | Xoá mềm | Đặt `deleted_at` thay vì xoá dòng; dữ liệu còn trong DB nhưng bị ẩn. Với **sản phẩm**: kéo theo ẩn nhân viên phụ trách + tài khoản của nhân viên đó; tồn kho giữ nguyên. FE phải cảnh báo trước khi xoá. |
| **Force delete (xoá cứng)** | Xoá cứng | Xoá thật khỏi DB, không thể hoàn tác. FE xác nhận 2 bước. |
| **Restore (khôi phục)** | Khôi phục | Gỡ `deleted_at` của sản phẩm **và** nhân viên + user liên quan. |
| **Upsert** | Cập nhật hoặc tạo | `POST /api/stock` với cùng `(product_id, store_id)` sẽ **cập nhật** số lượng (trả 200) thay vì tạo bản ghi trùng (201). |
| **Store scope (phạm vi cửa hàng)** | Phạm vi cửa hàng | Quy tắc: nhân viên chỉ thao tác được dữ liệu **cửa hàng của mình**. Cơ chế ở BE (middleware `store.scope`) ⇒ 403 khi vượt phạm vi. FE chỉ ẩn nút, không tự kiểm tra. |
| **Ghim cửa hàng (pinned store)** | Cửa hàng bị ghim | Khi nhân viên kho ghi tồn kho, BE ghi đè `store_id` = `staff.store_id` và `staff_id` = `staff.id`, bỏ qua giá trị client gửi. |
| **Multipart/form-data** | Body đa phần | Định dạng gửi **file**. FE dùng cho ảnh sản phẩm; `apiRequest` không set `Content-Type` (browser tự thêm boundary). |
| **`_method=PUT`** | Override HTTP method | PHP không parse multipart ở PUT ⇒ update kèm ảnh gửi **POST** + field `_method=PUT` (Laravel tự đổi method). |
| **Lazy load ảnh** | Tải ảnh lười | `<img loading="lazy" decoding="async">` — trình duyệt chỉ tải ảnh khi sắp vào viewport (ProductThumb). |

## D. Kỹ thuật FE

| Thuật ngữ | Tiếng Việt | Giải thích trong hệ thống |
|---|---|---|
| **SPA** | Ứng dụng 1 trang | Toàn bộ app chạy trong 1 trang, điều hướng bằng React Router, dữ liệu lấy qua API. |
| **Vite** | Công cụ build | Dev server + bundler; có proxy `/api` → `http://localhost:8000`. |
| **TanStack Query** | Thư viện quản lý server state | `useQuery` (đọc) + `useMutation` (ghi) + cache/invalidate tự động. |
| **TanStack Table** | Thư viện bảng | Render bảng + phân trang; ở đây **manual pagination** (server-side). |
| **React Hook Form** | Thư viện quản lý form | `register` / `handleSubmit` / `formState`; tích hợp Zod qua `zodResolver`. |
| **Zod** | Thư viện validate | Khai báo schema trong `src/api/schemas.ts`; validate client-side trước khi gọi API. |
| **React Context** | Context | `AuthContext` chia sẻ phiên + cờ quyền cho toàn cây component (`useAuth`). |
| **JWT** | Token đăng nhập | Chuỗi chữ ký, gửi qua header `Authorization: Bearer <token>`, hạn 3600s. |
| **localStorage** | Bộ nhớ cục bộ | Lưu token (`food-sg-admin-token`) và trạng thái phiên giữa các lần tải trang. |
| **VITE_API_URL** | Biến môi trường | Base URL API cho FE (mặc định `/api`; đổi backend ⇒ sửa `.env`). |
| **VITE_STORAGE_HOST** | Biến môi trường | Host gốc BE để resolve `/storage/…` của ảnh (mặc định `http://localhost:8000`). |
| **ProductThumb** | Component ảnh | `<img>` duy nhất cho mọi nơi hiển thị ảnh món (card, hero, bảng admin, mega menu, search); null ⇒ khung xám. |
| **VITE proxy dev** | Đường dẫn chuyển tiếp | Vite chuyển `/api/*` sang backend khi chạy `npm run dev`. |
| **Debounce** | Trì hoãn gọi | Ô tìm kiếm chờ 350ms ngừng gõ mới gọi API (`useSearch`). |
| **keepPreviousData** | Giữ dữ liệu cũ | Trong lúc chờ trang mới, bảng vẫn hiện dữ liệu trang cũ. |
| **Placeholder data** | Dữ liệu tạm | Dữ liệu hiển thị tạm trong lúc query đang tải. |
| **ApiError** | Lỗi có cấu trúc | Class chứa `status` + `message` + `errors` (message 422 theo field). |
| **mapServerErrors** | Áp lỗi 422 vào form | Đọc `errors` của response và gán vào đúng field (`setError`). |
| **Generic** | Kiểu dùng chung | `<T>` cho 4 chỗ: `useList<T>`, `DataTable<T>`, `ResourceTable<T>`, `TextField<T>`. |
| **422** | Unprocessable | Lỗi validate — kèm `errors` theo field. |
| **403** | Forbidden | Sai quyền — ví dụ vượt phạm vi cửa hàng. |
| **401** | Unauthorized | Token thiếu/hết hạn ⇒ FE xoá token và về trang đăng nhập. |
| **429** | Too Many Requests | Login quá 5 lần/phút. |

## E. Thuật ngữ nghiệp vụ chưa có trong hệ thống

| Thuật ngữ | Tiếng Việt | Trạng thái |
|---|---|---|
| **Order / Đơn hàng** | Đơn hàng | ❌ Chưa có bảng/model/endpoint. |
| **Cart / Giỏ hàng** | Giỏ hàng | ❌ Chưa có. |
| **Checkout / Payment** | Thanh toán | ❌ Chưa có. |
| **Customer / Khách hàng** | Khách hàng đăng ký | ❌ Chưa có; khách chỉ là guest (không có màn hình trong FE này). |
| **Stock movement** | Biến động tồn kho | ❌ Chưa có; `quantity` mới chỉ là mức tồn hiện tại theo cửa hàng. |
| **Promotion / Voucher** | Khuyến mãi / mã giảm giá | ❌ Chưa có; chỉ có giá khuyến mãi theo cửa sổ thời gian trên product. |
| **Trash / Thùng rác** | Danh sách sản phẩm đã xoá | ⚠ BE chưa có endpoint list sản phẩm đã xoá ⇒ FE nhập id để khôi phục / xoá cứng. |
| **Staff CRUD (M6)** | Quản lý nhân sự | ⚠ Chỉ có **list** (`/attendance/staff`, read-only 2026-10-24) — chưa có tạo/sửa/xoá staff. |
| **Rate lương** | Mức lương/giờ | ❌ `/attendance/salary` mới trả `total_hours`; chưa có rate, tiền lương, lương theo nhóm staff. |
| **Ca làm việc gán sẵn (shift schedule)** | Lịch ca | ⚠ `staff_shifts` chỉ dùng để tính giờ (hours); FE chưa có màn xem/gán ca. |
