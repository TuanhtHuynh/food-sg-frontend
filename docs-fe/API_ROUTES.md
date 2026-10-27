# API ROUTES (Tài liệu định tuyến API)

## Guest (Công khai, không cần auth)

- `GET /categories` — danh sách danh mục
- `GET /categories/{slug}` — chi tiết danh mục
- `GET /products` — danh sách sản phẩm
- `GET /products/{slug}` — chi tiết sản phẩm
- `GET /sizes` — danh sách kích thước
- `GET /sizes/{id}` — chi tiết kích thước
- `GET /ingredients` — danh sách nguyên liệu
- `GET /ingredients/{id}` — chi tiết nguyên liệu
- `GET /stores` — danh sách cửa hàng
- `GET /stores/{id}` — chi tiết cửa hàng
- `GET /stores/{id}/products` — sản phẩm theo cửa hàng
- `GET /banners` — danh sách banner phần top (sort theo `sort_order`, ẩn bản ghi đã xóa mềm)
- `GET /search` — tìm kiếm

## Auth

- `POST /auth/login` — đăng nhập (throttle 5/1)
- `GET /auth/me` — thông tin user (auth:sanctum,api)
- `GET /user` — thông tin user
- `POST /auth/logout` — đăng xuất

## Profile (Sales / Warehouse)

- `GET /staff/profile` — hồ sơ nhân viên (role:warehouse,sales)

## Attendance / Salary (store.scope: sales,warehouse,admin,manager)

- `POST /attendance/clock-in` — chấm công vào (manager/admin có thể truyền `staff_id` để chấm công hộ)
- `POST /attendance/clock-out` — chấm công ra (tương tự `staff_id`)
- `GET /attendance/salary` — xem lương; manager/admin truyền `staff_id` để xem lương staff khác
- `GET /attendance/staff` — danh sách staff (store mình nếu không admin)
- `GET /attendance/staff/{staff}` — chi tiết staff

## Attendance — quản lý của Manager/Admin (role:manager,admin + store.scope:manager,admin)

- `GET /attendance/clock-ins` — danh sách chấm công (lọc `staff_id`)
- `POST /attendance/clock-ins` — tạo bản ghi chấm công (hộ staff)
- `PUT /attendance/clock-ins/{clock_in}` — sửa giờ vào/ra
- `DELETE /attendance/clock-ins/{clock_in}` — xóa bản ghi
- `GET /attendance/shifts` — danh sách ca làm (lọc `staff_id`)
- `POST /attendance/shifts` — tạo ca (tính `hours` nếu không truyền)
- `PUT /attendance/shifts/{shift}` — sửa ca / giờ làm tròn
- `DELETE /attendance/shifts/{shift}` — xóa ca
- `PUT /attendance/staff/{staff}/hourly-rate` — đặt lương theo giờ

> Manager chỉ thao tác staff **cùng store**; staff khác store → 403. Admin toàn hệ thống.

## Stock (store.scope)

- `GET /stock` — xem tồn kho
- `GET /stock/{stock}` — chi tiết tồn kho
- `POST /stock` — tạo tồn kho (warehouse,admin)
- `PUT /stock/{stock}` — cập nhật tồn kho
- `DELETE /stock/{stock}` — xóa tồn kho

## Admin (role:admin)

- `GET/POST /admin/products` — CRUD sản phẩm + search + restore + force
- `GET/POST /admin/categories` — CRUD danh mục + search + restore + force
- `GET/POST /admin/sizes` — CRUD kích thước + search + restore + force
- `GET/POST /admin/ingredients` — CRUD nguyên liệu + search + restore + force
- `GET/POST /admin/stores` — CRUD cửa hàng + search + restore + force
- `GET /admin/stores/{store}/products` — sản phẩm theo cửa hàng
- `GET/POST /admin/banners` — CRUD banner top + search (`/admin/banners/search`)
- `PUT/DELETE /admin/banners/{banner}` — cập nhật / xóa mềm banner
