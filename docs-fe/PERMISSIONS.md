# PERMISSIONS.md

## Vai trò và quyền hạn

| Vai trò | Middleware / Kiểm tra | Xem | Tạo | Sửa | Xóa |
|---|---|---|---|---|---|
| **Guest** | Không cần auth | Công khai (categories, products, stores, search) | — | — | — |
| **Admin** | `auth:sanctum,api` + `role:admin` + `store.scope:*,admin` | Toàn hệ thống | `/admin/*` | `/admin/*` | `/admin/*` (soft) |
| **Manager** | `auth:sanctum,api` + `role:manager` + `store.scope:manager` | Staff, chấm công, ca làm, lương của staff **trong store mình** | `POST /attendance/clock-ins`, `POST /attendance/shifts` | `PUT /attendance/clock-ins/{id}`, `PUT /attendance/shifts/{id}`, `PUT /attendance/staff/{id}/hourly-rate`, chấm công hộ (`/clock-in`, `/clock-out` + `staff_id`) | `DELETE /attendance/clock-ins/{id}`, `DELETE /attendance/shifts/{id}` |
| **Warehouse** | `auth:sanctum,api` + `store.scope:warehouse` | `/stock` + `/attendance/*` trong `store_id` | `POST /attendance/clock-in`, `POST /stock` | `POST /attendance/clock-out`, `PUT /stock/{id}` | `DELETE /stock/{id}` |
| **Sales** | `auth:sanctum,api` + `store.scope:sales` | `/stock` + hồ sơ cá nhân; tự chấm công | `POST /attendance/clock-in` | `POST /attendance/clock-out` | — |

> Lưu ý: chỉ Admin mới có CRUD `/admin/*` (bakend mô tả bên dưới); Manager/Warehouse/Sales không truy cập `/admin/*`.

## Phân quyền chi tiết theo loại dữ liệu

### Categories / Danh mục
- **Admin**: CRUD toàn bộ; search.
- **Guest**: chỉ đọc (`index`, `show`).
- Khác: không có quyền.

### Products / Sản phẩm
- **Admin**: CRUD + khôi phục + xóa vĩnh viễn; search; xem sản phẩm theo shop (`/admin/stores/{store}/products`).
- **Guest**: đọc công khai theo slug; xem theo cửa hàng.
- **Staff**: không thao tác trực tiếp sản phẩm qua admin endpoint; chỉ thao tác `stock` liên quan.

### Ingredients / Nguyên liệu
- **Admin**: CRUD + search.
- **Guest**: đọc công khai (`/ingredients`).

### Sizes / Kích thước
- **Admin**: CRUD + search.
- **Guest**: đọc công khai (`/sizes`).

### Stores / Cửa hàng
- **Admin**: CRUD + search + xem sản phẩm thuộc cửa hàng.
- **Guest**: đọc công khai (`/stores`, `/stores/{id}/products`).
- **Staff**: chỉ được xem kho của cửa hàng được gán (`store.scope`).

### Stock / Tồn kho
- **Admin / Warehouse** (`store.scope:warehouse,admin`): tạo, sửa, xóa trong phạm vi store.
- **Sales** (`store.scope:sales,warehouse,admin`): chỉ đọc (routes cho sales không định nghĩa POST/PUT/DELETE stock, chỉ `GET`).
- **Guest**: không có quyền.

### Auth / Hồ sơ
- **Tất cả người dùng xác thực** (`auth:sanctum,api`): `/auth/me`, `/auth/logout`, `/user`.
- **Staff (sales/warehouse/admin/manager)**: `/staff/profile` (yêu cầu `role:warehouse,sales`).

### Attendance / Lương (mới)
- **Nhân viên (sales, warehouse, manager, admin)**: tự `POST /attendance/clock-in`, `POST /attendance/clock-out`; xem lương bản thân `GET /attendance/salary`. Manager/admin có thể truyền `staff_id` để chấm công hộ (giới hạn store như trên).
- **Manager**: khối endpoint quản lý `/attendance/*`:
  - Chấm công: `GET/POST/attendance/clock-ins`, `PUT/DELETE /attendance/clock-ins/{clock_in}`
  - Ca làm: `GET/POST/attendance/shifts`, `PUT/DELETE /attendance/shifts/{shift}`
  - Lương: `PUT /attendance/staff/{staff}/hourly-rate`, `GET /attendance/salary?staff_id=...`
  - Tất cả giới hạn staff thuộc **store của manager**; staff thuộc store khác → 403.
- **Admin**: như manager nhưng toàn hệ thống (mọi store).
- Sales/warehouse truy cập khối quản lý này → 403 (middleware `role:manager,admin`).

### Banners / Ảnh top site (mới)
- **Guest**: chỉ đọc `GET /banners` (sort theo `sort_order`; ẩn banner đã soft-delete).
- **Admin**: CRUD `/admin/banners` + search (`role:admin`).
- **Manager / Warehouse / Sales**: không có quyền (`/admin/*` bị chặn).

## Quy tắc giới hạn (Store Scope)

- `store.scope` middleware kiểm tra `staff.store_id` khớp với dữ liệu đang truy cập.
- Nếu staff có `store_id = 5`, không thể `POST /stock` cho `store_id = 3`; trả 403.
- Admin không bị kiểm tra `store.scope` nhưng vẫn có thể lọc bằng query `store_id`.
- Manager bị ghim vào `store_id` của mình:
  - `GET /attendance/staff` chỉ trả staff cùng store.
  - Các endpoint quản lý (clock-ins/shifts/hourly-rate) chặn mọi staff khác store (403), ngay cả khi middleware không thấy `store_id` trong request.

## Quản lý vai trò (Role)

- `Role` table: `admin`, `manager`, `warehouse`, `sales` (seed bởi `RoleSeeder` + migration `add_manager_role`).
- `Staff.role_id` xác định quyền; thay đổi role phải qua Admin (chưa có endpoint đổi role công khai).
