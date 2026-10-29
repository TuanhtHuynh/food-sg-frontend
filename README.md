# Food SG — Frontend Admin (React + TypeScript + Vite)

Trang quản trị cho hệ thống Food SG, đọc dữ liệu từ Laravel API (`API_ROUTES.txt`).
Tài liệu nghiệp vụ của backend nằm ở `docs/` (`FLOWS.md`, `PERMISS.md`, `RULE.md`, `MODEL.md`).
Tài liệu của **frontend** nằm ở `docs-fe/` (`BUSINESS_OVERVIEW.md`, `MODEL.md`, `FLOWS.md`, `RULE.md`, `PERMISS.md`, `GLOSSARY.md`).

## Stack

- React 19 + TypeScript + Vite
- TanStack Query (server state) + TanStack Table v9 (bảng, phân trang server-side)
- React Hook Form + Zod (validate form)
- Tailwind CSS v4
- React Router v7

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

Cần Laravel API chạy ở `http://localhost:8000` (mặc định). Dev server proxy `/api` → `http://localhost:8000`
(xem `vite.config.ts`). Đổi backend khác thì sửa `VITE_API_URL` trong `.env` (mẫu: `.env.example`).

## Đăng nhập & vai trò

Đăng nhập bằng JWT (`POST /api/auth/login`), token lưu ở `localStorage` (`food-sg-admin-token`).
Khi API trả 401 (token hết hạn) FE tự xoá token và đưa về trang đăng nhập.

Quyền hiển thị theo `staff.role.slug` (khớp `docs/PERMISS.md`):

| Vai trò | Được xem | Được ghi |
|---|---|---|
| `admin` (quản trị) | Tất cả + kho toàn hệ thống | Master data + tồn kho mọi cửa hàng |
| `warehouse` (quản kho) | Kho + bảng giá của cửa hàng mình | Tồn kho cửa hàng mình |
| `sales` (bán hàng) | Kho + bảng giá của cửa hàng mình (chỉ đọc) | — |

User đăng nhập được nhưng chưa gắn hồ sơ nhân viên sẽ không vào được trang quản trị.

## Routes

### Trang công khai (guest) — không cần token

| Path                    | Trang                       | API                                    |
| ----------------------- | --------------------------- | -------------------------------------- |
| `/`                     | Trang chủ (hero, danh mục, menu) | `/api/categories`, `/api/products`  |
| `/categories/:slug`     | Danh mục (danh sách món)    | `/api/categories/{slug}`, `/api/products?category=` |
| `/products/:slug`       | Chi tiết món                | `/api/products/{slug}`                 |
| `/login`                | Đăng nhập                   | `/api/auth/login`                      |

Header có **mega menu danh mục** (hover/click "Danh mục" → hiện tất cả danh mục kèm món nổi bật),
ô tìm kiếm (`GET /api/search`) và bộ chọn cửa hàng (lọc món theo tồn kho cửa hàng).

### Trang quản trị — cần token + vai trò

| Path                | Trang                                       | Quyền | API                          |
| ------------------- | ------------------------------------------- | ----- | ---------------------------- |
| `/login`            | Đăng nhập                                   | —     | `/api/auth/login`            |
| `/admin`            | Tổng quan                                   | admin | `/api/admin/*` (đếm bản ghi) |
| `/admin/stock`      | Kho (tồn kho theo cửa hàng)                 | mọi   | `/api/stock`                 |
| `/admin/prices`     | Bảng giá & khuyến mãi                       | mọi   | `/api/products` (guest)      |
| `/admin/products`   | Sản phẩm (CRUD)                             | admin | `/api/admin/products`        |
| `/admin/categories` | Danh mục (CRUD)                             | admin | `/api/admin/categories`      |
| `/admin/sizes`      | Size (CRUD)                                 | admin | `/api/admin/sizes`           |
| `/admin/ingredients`| Nguyên liệu (CRUD)                          | admin | `/api/admin/ingredients`     |
| `/admin/stores`     | Cửa hàng (CRUD)                             | admin | `/api/admin/stores`          |

Mọi bảng dùng phân trang server-side (`?page=`, cố định 15 bản ghi/trang) và tìm kiếm `?q=`.

## Cấu trúc

```
src/
  main.tsx           # entry: QueryClientProvider + AuthProvider + mount
  app/
    App.tsx          # định tuyến (public + admin) + chặn theo vai trò
  api/
    queries.ts       # fetchers + react-query hooks (guest + admin + stock)
    types.ts         # type của resource API + STAFF_ROLE_SLUGS
    schemas.ts       # zod schema cho các form
  auth/
    provider.tsx     # AuthProvider (role flags: isAdmin / canReadStock / canWriteStock)
    context.ts       # AuthContext + useAuth
  lib/
    client.ts        # api client, token, format, map lỗi 422 vào form, sự kiện 401
    hooks.ts         # useSearch (debounce)
  components/
    DataTable.tsx     # bảng (TanStack Table v9), generic <T>
    ResourceTable.tsx # tìm kiếm + bảng + cột thao tác + xác nhận xoá, generic <T>
    form.tsx          # TextField<T> / TextAreaField<T> dùng register
    ui.tsx            # Button, Field, Modal, ConfirmDialog
    MegaMenu.tsx      # mega menu danh mục (public)
    SearchBox.tsx     # ô tìm kiếm public (GET /api/search)
    ProductCard.tsx   # thẻ món ăn (public)
  layouts/
    PublicLayout.tsx  # header/footer public + chọn cửa hàng (dùng Outlet context)
    AdminLayout.tsx   # menu đổng theo vai trò
  pages/
    public/          # HomePage, CategoryPage, ProductPage
    admin/           # Dashboard, Products, Categories, Sizes/Ingredients/Stores, Stock, Prices
    LoginPage.tsx
    NotFoundPage.tsx
```

> Quy ước import: tầng trên dùng đường dẫn tương đối tới folder (`../api/queries`, `../../lib/client`).

Generic được dùng đúng 4 chỗ: `useList<T>`, `DataTable<T>`, `ResourceTable<T>`, `TextField<T>`.
Còn lại là code thường, đọc từ trên xuống dưới là hiểu.

## Ghi chú tích hợp với backend

- `POST /api/stock` là **upsert** theo `(product_id, store_id)` → gửi lại cùng sản phẩm ở cùng
  cửa hàng sẽ cập nhật số lượng (200) chứ không tạo bản ghi trùng.
- `PUT /api/stock/{id}` chỉ đổi được `quantity` (không đổi được sản phẩm / cửa hàng).
- Warehouse không gửi `store_id` / `staff_id` — server tự ghim theo cửa hàng của nhân viên.
- `StockResource` không trả tên sản phẩm → FE tra `product_id` qua `GET /api/products` (guest).
- Xoá mềm sản phẩm kéo theo xoá mềm nhân viên phụ trách và user đăng nhập của họ.
- API chưa có endpoint liệt kê sản phẩm đã xoá → màn "Sản phẩm đã xoá" nhập id để
  khôi phục / xoá cứng.
