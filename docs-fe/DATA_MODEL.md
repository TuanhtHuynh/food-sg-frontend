# DATA_MODEL.md

## Entity, thuộc tính và trạng thái chính

### User
- `id`, `name`, `email`, `password`, `email_verified_at`
- `deleted_at` (soft delete)
- Liên kết 1-1 với `Staff` qua `user_id`

### Staff
- `id`, `user_id` (FK), `store_id` (FK), `product_id` (nullable FK), `role_id` (FK)
- `hourly_rate` (decimal 10,2, nullable) — mức lương theo giờ, chỉ manager/admin cùng store (hoặc admin mọi store) được sửa
- `deleted_at`
- Trạng thái: hoạt động / đã xóa mềm; quyền hạn phụ thuộc `role_id` + `store_id`

### Role
- `id`, `name`, `slug` (unique)
- Slug cố định: `admin`, `manager`, `warehouse`, `sales` (seed bởi `RoleSeeder` + migration `add_manager_role`)
- Dùng trong middleware `role:` và `store.scope:` để kiểm tra quyền

### Store
- `id`, `name`, `address`, `deleted_at` (soft)
- Có nhiều `Product` và `ProductStock`

### Category
- `id`, `name`, `slug`, `deleted_at`
- Một danh mục có nhiều `Product`

### Product
- `id`, `category_id`, `name`, `slug`, `price`, `sale_price`, `description`, `image`, `deleted_at`
- Liên kết N-N với `Size` qua `product_size`
- Liên kết N-N với `Ingredient` qua `product_ingredient`
- Có nhiều `ProductStock` (mỗi store một bản ghi)

### Size
- `id`, `name`, `code`?
- Liên kết N-N với `Product`

### Ingredient
- `id`, `name`
- Liên kết N-N với `Product`

### ProductSize (pivot)
- `product_id`, `size_id`

### ProductIngredient (pivot)
- `product_id`, `ingredient_id`

### ProductStock
- `id`, `store_id`, `product_id`, `staff_id`, `quantity`, `created_at`, `updated_at`
- Trạng thái: số lượng thực tế tại cửa hàng; người cập nhật qua `staff_id`

### Banner (mới — ảnh phần "top" của site)
- `id`, `image` (path `/storage/banners/<file>`, bắt buộc), `title` (nullable), `link_url` (nullable), `sort_order` (int, mặc định 0 — nhỏ hiển thị trước)
- `deleted_at` (soft delete), timestamps
- Không gắn với Store/Product; là nội dung site riêng. Admin CRUD, Guest chỉ đọc.

### StaffShift
- `id`, `staff_id` (FK), `shift_date`, `start_time`, `end_time`, `hours`
- Trạng thái: ca đã đăng ký; `hours` là giờ làm tròn để tính lương (tự tính từ `start_time`/`end_time` nếu không truyền, hỗ trợ ca qua đêm)

### ClockIn
- `id`, `staff_id` (FK), `clock_in` (timestamp), `clock_out` (timestamp, nullable)
- Trạng thái: đang làm (`clock_out` null) hoặc đã chấm xong
- Relation `staff` dùng `withTrashed()` để quản lý chấm công của staff đã xóa mềm

### PersonalAccessToken (Sanctum)
- `id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`

## Quan hệ chính

```
User 1-1 Staff
Staff N-1 Role
Staff N-1 Store
Store 1-N ProductStock
Store 1-N Staff
Category 1-N Product
Product 1-N ProductStock
Product N-N Size (product_size)
Staff 1-N StaffShift
Staff 1-N ClockIn
Product N-N Ingredient (product_ingredient)
```

## Trạng thái dữ liệu

- **Soft deleted**: `users`, `staff`, `products`, `categories`, `stores` (có `deleted_at`).
- **Active / Inactive**: Sản phẩm có thể bị xóa mềm; không có trạng thái `is_active` riêng, dựa vào `deleted_at`.
- **Stock status**: Không có trạng thái riêng; chỉ dựa vào `quantity` (có thể = 0).
- **Admin scope**: `admin` không bị giới hạn `store_id`; `manager/warehouse/sales` bị khóa bởi middleware `store.scope` (manager ghim vào store mình, quản lý staff cùng store).
