# BUSINESS_RULES.md

## Điều kiện, giới hạn và ngoại lệ nghiệp vụ

### 1. Chấm công và lương (Attendance / Salary)
- **Check-in/check-out bắt buộc** (`/attendance/clock-in`, `/attendance/clock-out`) trước khi tính giờ làm.
- **Lương theo giờ**: `total_salary = sum(staff_shifts.hours) × staff.hourly_rate`; không tính tự động từ ca chỉ định.
- **`hourly_rate`**: nullable (chưa đặt → total_salary = 0); chỉ Admin hoặc Manager (cùng store với staff) được sửa qua `PUT /attendance/staff/{staff}/hourly-rate`.
- **`hours` của shift**: nếu không truyền `hours`, backend tự tính = (end_time − start_time, làm tròn 2 số, hỗ trợ ca qua đêm); khi sửa `start_time`/`end_time` mà không truyền `hours` thì tự tính lại.
- **Store scope**: manager chỉ xem/sửa lương, chấm công, ca của staff trong `store_id` mình; admin toàn hệ thống.
- **Không chấm công** → ca không tính vào lương.
- Chấm công hộ: manager/admin truyền `staff_id` vào `/attendance/clock-in|clock-out`; phải cùng store (trừ admin). Nhân viên thường không được truyền `staff_id` (chỉ tự chấm).

### 2. Đăng nhập và xác thực
- **Throttling**: `POST /auth/login` giới hạn 5 lần mỗi 1 phút (`throttle:5,1`).
- **Token**: Sanctum; gửi `token` qua header `Authorization: Bearer <token>`.
- **Nhân viên phải có Staff**: Chỉ `User` có bản ghi `staff` liên kết mới có quyền nội bộ (`/auth/me` trả về staff/profile).

### 3. Phạm vi cửa hàng (Store Scope)
- **Warehouse / Sales / Manager**: Chỉ được thao tác dữ liệu thuộc `store_id` được gán trong bảng `staff`.
- **Vi phạm**: Truy cập dữ liệu store khác → `403 Forbidden`.
- **Admin**: Không bị giới hạn `store.scope`; có thể xem toàn bộ.

### 4. Danh mục và sản phẩm
- **Slug duy nhất**: `categories.slug` và `products.slug` phải duy nhất để định tuyến `/categories/{slug}`, `/products/{slug}`.
- **Soft delete cho Product, Staff, User, Category, Store**: Khi xóa, `deleted_at` được set; dữ liệu vẫn tồn tại nhưng không hiển thị công khai.
- **Khôi phục**: Admin có thể `POST .../restore` để xóa `deleted_at`; sau đó mới có thể `force` xóa.
- **Xóa vĩnh viễn**: `DELETE .../force` chỉ khả dụng cho Admin; không thể khôi phục sau khi force.

### 5. Giá và khuyến mãi
- `Product` có `price` (giá gốc) và `sale_price` (giá khuyến mãi, nullable).
- Nếu `sale_price` có giá trị, đó là giá hiển thị ưu tiên; không có quy tắc tự động tính giảm giá từ `price`.
- Không có ràng buộc `sale_price < price` ở database; cần kiểm tra ở tầng ứng dụng nếu cần.

### 6. Tồn kho (Stock)
- **Mỗi store + sản phẩm**: Tránh tạo bản ghi `product_stock` trùng cho cặp (`store_id`, `product_id`) (hiện chưa có unique constraint).
- **Người thực hiện**: Mỗi lần tạo/cập nhật `stock` phải ghi nhận `staff_id` (người thao tác).
- **Số lượng âm**: Không có quy tắc cấm `quantity < 0` ở database; cần kiểm tra nghiệp vụ nếu không muốn cho phép âm.
- **Khôi phục / điều chỉnh**: Hệ thống không có bảng lịch sử điều chỉnh riêng; chỉ lưu trạng thái hiện tại trong `product_stock`.

### 7. Nhân viên và vai trò
- **1 User → 1 Staff** (theo thiết kế liên kết `user_id`).
- **Vai trò cố định**: `admin`, `manager`, `warehouse`, `sales`; không có endpoint công khai để tạo role mới.
- **Nhân viên đã xóa mềm (soft-deleted)**: vẫn có thể tra qua `withTrashed()` khi quản lý chấm công/shift (relation `ClockIn.staff`, `StaffShift.staff`).
- **Staff có thể liên kết Product**: `staff.product_id` cho phép gán nhân viên quản lý sản phẩm cụ thể (tùy chọn, nullable).

### 8. Tìm kiếm (Search)
- **Guest**: `GET /search` không cần auth; trả kết quả đa trường (có thể sản phẩm, danh mục, cửa hàng).
- **Admin**: Các endpoint `search` riêng cho từng tài nguyên (`products/search`, `categories/search`, v.v.) phải đặt trước `apiResource` để không bị `{id}` che mất.

### 9. Hình ảnh
- Lưu qua disk `public` của Laravel: file nằm ở `storage/app/public/products/` (sản phẩm) và `storage/app/public/banners/` (banner top), web truy cập qua symlink `public/storage` (tạo bằng `php artisan storage:link`; `public/storage` đã tồn tại).
- `products.image` chỉ lưu **1 đường dẫn/URL** cho mỗi sản phẩm, dạng `/storage/products/<file>` (URL công khai).
- **Banner top site**: dùng bảng `banners` riêng (image, title, link_url, sort_order, soft delete) vì không gắn với product; mỗi bản ghi = 1 ảnh, nhiều bản ghi cho dải ảnh top.
- Nguồn demo: `ProductImageSeeder` (folder `Resources_A`) và `BannerImageSeeder` (folder `top_res`, sort_order tăng theo tên file: top-1 → top-4).
- Chưa có bảng trung gian cho ảnh (vd `product_images`): nghiệp vụ hiện tại là 1 ảnh/entity; nếu yêu cầu gallery nhiều ảnh thì mới cần thêm bảng.
- Validation ảnh (kích thước / định dạng / bắt buộc) chưa có ở tầng admin; cần bổ sung khi làm upload.

### 10. Ngoại lệ và lỗi thường gặp
- `.env` bị hỏng (có số dòng đính kèm) → Laravel không parse được; cần sửa trước khi chạy `artisan`.
- MySQL dev chạy local — nếu service tắt thì `migrate` lỗi `No connection could be made`; test tự động dùng sqlite `:memory:` (phpunit.xml).
- `docs/index.md` và `public/favicon.ico` bị rỗng; không ảnh hưởng chạy app nhưng nên bổ sung.
- `vendor/` có file 0 byte từ thư viện; không cần sửa nếu ứng dụng vẫn chạy.
