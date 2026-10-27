# FOOD-SG FE — MODEL

> Các **type** dữ liệu mà FE sử dụng, quan hệ giữa chúng và ánh xạ 1–1 với resource API của backend.
> Nguồn: `src/api/types.ts`, `src/api/queries.ts`, `app/Http/Resources/*` (backend). Cập nhật: 2026-10-24.
> Thuật ngữ: [GLOSSARY.md](GLOSSARY.md) · Quy tắc: [RULE.md](RULE.md) · Quyền: [PERMISS.md](PERMISS.md) · Tổng quan: [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## 1. ERD phía FE (mô hình dữ liệu trong bộ nhớ)

```
                    ┌───────────────┐
                    │    User       │  (session hiện tại)
                    │  id, name     │◄──── GET /api/auth/me
                    │  email        │
                    └───────┬───────┘
                            │ 0..1
                    ┌───────▼───────┐        ┌───────────────┐
                    │    Staff      │───────►│     Role      │
                    │  store_id     │  N:1   │  slug:        │
                    │  role_id      │        │  admin |      │
                    │  user_id      │        │  warehouse |  │
                    │  product_id   │        │  sales        │
                    └───────┬───────┘        └───────────────┘
                            │ N:1
                    ┌───────▼───────┐
                    │    Store      │  (cửa hàng = phạm vi quyền kho)
                    │  id, name     │
                    │  address      │
                    └───────┬───────┘
                            │ 1:N
                    ┌───────▼───────────────┐        ┌───────────────┐
                    │       Stock           │───────►│    Product    │
                    │  product_id (N:1)     │        │  category_id  │
                    │  store_id   (N:1)     │        │  slug, price  │
                    │  staff_id   (N:1,?)   │        │  sale_*       │
                    │  quantity   (>= 0)    │        │  meta_*       │
                    └───────────────────────┘        └───────┬───────┘
                                                            │ N:1
                                                    ┌───────▼───────┐
                                                    │   Category    │
                                                    │  slug, meta_* │
                                                    └───────────────┘
```

> FE **không** có bảng riêng; mọi "bảng" trên là shape của JSON API được khai báo trong `src/api/types.ts`.
> Quan hệ được dựng lại ở tầng UI bằng các trường `*_id` + object lồng (`stock.store`, `product.category`).

---

## 2. Các type dữ liệu

### 2.1. `Product` — sản phẩm / món ăn

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | `number` | `ProductResource` | |
| `name` | `string` | | |
| `image` | `string \| null` | | Đường dẫn storage BE (`/storage/products/x.jpg`), FE render `<img>` qua `imageUrl()`; **mọi ảnh load từ DB, không có placeholder chữ cái** |
| `slug` | `string` | | unique, dùng cho URL SEO; BE tự sinh nếu không gửi |
| `price` | `number` | | int, ≥ 0 |
| `sale_price` | `number \| null` | | int, ≥ 0 |
| `sale_start_at` | `string \| null` | | ISO8601 |
| `sale_end_at` | `string \| null` | | ISO8601, ≥ `sale_start_at` |
| `category_id` | `number` | | |
| `meta_title` / `meta_description` / `meta_keyword` | `string \| null` | | SEO, chỉ có ở product & category |
| `created_at` / `updated_at` | `string` | | ISO8601 |
| `category` | `Category` | luôn có (nạp sẵn) | |
| `sizes?` | `Size[]` | chỉ ở endpoint detail | có thể `[]` |
| `ingredients?` | `Ingredient[]` | chỉ ở endpoint detail | có thể `[]` |
| `stocks?` | `Stock[]` | chỉ ở endpoint detail | tồn kho **theo từng cửa hàng** |
| `stock?` | `Stock \| null` | chỉ ở endpoint detail | bản ghi đơn khi đúng 1 store, nhiều store ⇒ `null` |

> Quan trọng: `stock` và `stocks` **khác nhau** — `stock` là bản ghi đơn (chỉ khi phạm vi có đúng 1 cửa hàng).

### 2.2. `Category` — danh mục

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id`, `name`, `slug` | `number`, `string` | `slug` unique |
| `meta_title` / `meta_description` / `meta_keyword` | `string \| null` | |
| `created_at` / `updated_at` | `string` | |
| `products_count?` | `number` | có ở list guest + detail admin; **không** có ở response create |
| `products?` | `Product[]` | chỉ ở `GET /api/categories/{slug}` (≤ 50 sản phẩm mới nhất) |

### 2.3. `Size` / `Ingredient`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `number` | định danh bằng id (không có slug) |
| `name` | `string` | |
| `created_at` / `updated_at` | `string` | |

### 2.4. `Store` — cửa hàng

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `number` | |
| `name` | `string` | |
| `address` | `string` | bắt buộc khi tạo/sửa |
| `created_at` / `updated_at` | `string` | |
| `staffs_count?` | `number` | chỉ có ở `GET /api/admin/stores/{id}` |

### 2.5. `Stock` — bản ghi tồn kho (theo cửa hàng)

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `number` | |
| `product_id` | `number` | **không** có tên sản phẩm → FE tra qua thư mục sản phẩm |
| `store_id` | `number \| null` | cửa hàng sở hữu mức tồn |
| `staff_id` | `number \| null` | nhân viên giữ kho — tên tra qua **danh mục nhân viên** |
| `quantity` | `number` | số nguyên ≥ 0 |
| `created_at` / `updated_at` | `string` | |
| `store?` | `Store \| null` | BE nạp sẵn ở `/api/stock` |

> ⚠ BE hiện tại (`StockController::update`): **không gửi `staff_id` ⇒ giữ nguyên giá trị cũ** (không còn set null như trước 2026-10-24).

### 2.6. `Role` / `Staff` / `User`

| Type | Trường | Ghi chú |
|---|---|---|
| `Role` | `id`, `name`, `slug` | `slug ∈ {admin, warehouse, sales}` |
| `Staff` | `id`, `name`, `user_id` (nullable), `store_id` (nullable), `role_id` (nullable), `store`, `role`, `user?` | `store`/`role` là object lồng; `user?` có ở `GET /attendance/staff` (nhân viên chưa có user ⇒ null); `created_at`/`updated_at` luôn có nhưng khai báo optional cho an toàn |
| `User` | `id`, `name`, `email`, `created_at`, `updated_at`, `staff` | `staff` = `null` nếu user không có hồ sơ nhân viên |

### 2.7. `ClockEntry` / `SalarySummary` — chấm công (mới)

| Type | Trường | Nguồn |
|---|---|---|
| `ClockEntry` | `id`, `staff_id`, `clock_in`, `clock_out` (nullable ⇒ ca đang mở), `created_at`, `updated_at` | `POST /attendance/clock-in` (201), `POST /attendance/clock-out` (200) — BE trả **object thẳng**, không bao `{data}` |
| `SalarySummary` | `staff_id`, `store_id`, `total_hours`, `note` | `GET /attendance/salary` — của **chính mình**; `total_hours` = tổng `staff_shifts.hours` (giờ làm tròn) |

### 2.8. Type vỏ bọc response

| Type | Shape | Dùng cho |
|---|---|---|
| `DataResponse<T>` | `{ data: T }` | `POST/PUT` admin, `GET` guest đơn |
| `Paginated<T>` | `{ data: T[], links?, meta: { current_page, last_page, per_page, total } }` | mọi danh sách |
| `AuthResponse` | `{ token, token_type, expires_in, user }` | `POST /api/auth/login` |

---

## 3. Ánh xạ Resource ↔ Type

| Resource BE | Type FE | Endpoint | Ghi chú |
|---|---|---|---|
| `ProductResource` | `Product` | `/api/admin/products*`, `/api/products*` | list admin chỉ có `category`; detail có `sizes/ingredients/stocks`; `image` luôn có (nullable) |
| `CategoryResource` | `Category` | `/api/admin/categories*`, `/api/categories*` | |
| `SizeResource` | `Size` | `/api/admin/sizes*`, `/api/sizes*` | |
| `IngredientResource` | `Ingredient` | `/api/admin/ingredients*`, `/api/ingredients*` | |
| `StoreResource` | `Store` | `/api/admin/stores*`, `/api/stores*` | `staffs_count` chỉ ở admin show |
| `StockResource` | `Stock` | `/api/stock*` | **không** có `product`/`staff` ⇒ cần thư mục sản phẩm + danh mục nhân viên |
| `UserResource` | `User` | `/api/auth/*`, `/staff/profile` (bọc `{user}`) | không lộ `password` |
| `StaffResource` | `Staff` | `/api/attendance/staff` (mảng thẳng, load `user` + `store`), lồng trong `UserResource` | show `/attendance/staff/{id}` load thêm `role` |
| `RoleResource` | `Role` | lồng trong `StaffResource` | |
| `ClockIn` (model thẳng) | `ClockEntry` | `/api/attendance/clock-in`, `/api/attendance/clock-out` | không bao `{data}` |
| `SalaryController` array | `SalarySummary` | `/api/attendance/salary` | |

---

## 4. Bảng dữ liệu dẫn xuất ở tầng FE

| Dữ liệu | Nguồn | Cách dựng | Dùng ở đâu |
|---|---|---|---|
| **Thư mục sản phẩm** | `GET /api/products?per_page=50` (mọi trang, tối đa 20 trang) | `Map<product_id, Product>` | tra tên sản phẩm trong bảng kho + dropdown chọn sản phẩm khi ghi kho + nguồn dữ liệu của màn Bảng giá |
| **Danh mục nhân viên** | `GET /api/attendance/staff` (mảng thẳng, không phân trang) | `Map<staff_id, Staff>` | hiện tên NV phụ trách trong bảng kho + dropdown chọn `staff_id` khi ghi/sửa kho |
| **Danh sách cửa hàng** | `GET /api/stores` (guest, không phân trang) | `Store[]` | lọc cửa hàng (sản phẩm, kho), chọn cửa hàng khi ghi kho, tên chấm công/lương |
| **Danh sách danh mục** | `GET /api/categories` (guest, không phân trang) | `Category[]` | dropdown chọn danh mục khi tạo/sửa sản phẩm |

> Cả 3 nguồn trên là endpoint **guest** ⇒ mọi vai trò đều gọi được, không cần quyền admin.

---

## 5. Cache client (query key của TanStack Query)

| Query key | Hook | Dữ liệu | `staleTime` |
|---|---|---|---|
| `['admin', resource, params]` | `useList` | danh sách admin (15/trang) | mặc định 0 (refetch khi mount) |
| `['categories']` | `useCategories` | danh mục guest | 5 phút |
| `['stores']` | `useStores` | cửa hàng guest | 5 phút |
| `['directory', 'products']` | `useProductDirectory` | thư mục sản phẩm | 5 phút |
| `['staff', 'directory']` | `useStaffDirectory` | danh mục nhân viên | 5 phút |
| `['attendance', 'salary']` | `useMySalary` | lương của mình | 1 phút |
| `['staff', 'profile']` | `useStaffProfile` | hồ sơ nhân viên | 0 |
| `['stock', params]` | `useStockList` | tồn kho (15/trang) | mặc định 0 |

Invalidate: mọi mutation admin (kể cả upload ảnh) ⇒ `['admin']` + `['directory']`; mutation kho ⇒ `['stock']`.
Clock-in / clock-out không invalidate query nào (lương refetch khi mount / theo staleTime).

---

## 6. Ràng buộc dữ liệu FE phải tôn trọng

| Ràng buộc | Nơi kiểm soát |
|---|---|
| `price` là số nguyên 0 … 9 999 999 999 | Zod (`productSchema`) + BE |
| `sale_end_at ≥ sale_start_at` | Zod (so sánh `Date`) + BE |
| `quantity` là số nguyên ≥ 0 | Zod (`stockSchema`) + BE |
| `image` là **file** jpg/jpeg/png/webp ≤ 2048 KB (multipart); lỗi server trả `errors.image` | BE validate (`ProductRequest`); FE hiện message chung |
| `staff_id` gán vào kho phải thuộc đúng `store_id` của bản ghi | BE (`guardStaffBelongsToStore` ⇒ 422 `staff_id`); FE lọc dropdown theo store khi sửa |
| `meta_description ≤ 1000`, `meta_title`/`meta_keyword` ≤ 255 | Zod + BE |
| `name` bắt buộc, ≤ 255 | Zod + BE |
| `address` bắt buộc (cửa hàng) | Zod (`storeSchema`) + BE |
| `slug` unique (product, category) | BE (FE để trống ⇒ BE tự sinh từ `name`) |
| Mỗi `(product_id, store_id)` chỉ có 1 bản ghi kho | BE (upsert) |
