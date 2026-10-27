# FOOD-SG FE — PERMISS

> Ma trận quyền **trên giao diện** theo vai trò, và ánh xạ sang endpoint + middleware của backend.
> Nguồn: `src/auth/provider.tsx`, `src/auth/context.ts`, `src/app/App.tsx`, `src/layouts/AdminLayout.tsx`, `routes/api.php` (backend).
> Cập nhật: 2026-10-24. · Model: [MODEL.md](MODEL.md) · Luồng: [FLOWS.md](FLOWS.md) · Quy tắc: [RULE.md](RULE.md) · Tổng quan: [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## 1. Cơ chế kiểm tra quyền ở FE

| Cơ chế | Chi tiết |
|---|---|
| Nguồn vai trò | `user.staff.role.slug` từ `GET /api/auth/me` (hoặc từ response của `POST /api/auth/login`) |
| Danh sách vai trò hợp lệ | `STAFF_ROLE_SLUGS` trong `src/api/types.ts` (`admin` · `warehouse` · `sales`) — khớp hằng số `App\Models\Role` của BE |
| Cờ quyền | `isAdmin` · `canManageCatalog` · `canReadStock` · `canWriteStock` · `storeId` |
| Chặn route | `RequireStaff` (cần token + role hợp lệ) → `RequireAdmin` (chỉ `admin`) → `RequireWorker` (chỉ `warehouse`/`sales`, dùng cho `/admin/profile`) |
| Chặn hành động | ẩn/disabled nút ghi, ẩn cột thao tác (`showActions={false}`) |
| Thông báo | 403 từ BE hiển thị nguyên văn, ví dụ `"Bạn không có quyền thực hiện thao tác này."` |
| Chấm công | `store.scope:sales,warehouse,admin` ⇒ mọi vai trò hợp lệ đều vào được `/admin/attendance` |

> **BE là lớp bảo vệ cuối.** Mọi quyết định "được thấy/ghi dữ liệu nào" đều do middleware `role` / `store.scope` của BE trả lời.
> FE chỉ ẩn nút để tránh thao tác vô ích — không phải cơ chế bảo mật.

```
slug = user?.staff?.role?.slug
   ├─ null (không có staff)  → "Tài khoản chưa được gắn hồ sơ nhân viên…"  → không vào layout
   ├─ ngoài {admin,warehouse,sales} → "Vai trò ... chưa được hỗ trợ"        → không vào layout
   ├─ admin     → menu đầy đủ, ghi tồn kho mọi cửa hàng
   ├─ warehouse → menu [Kho], ghi tồn kho cửa hàng của mình
   └─ sales     → menu [Kho], chỉ đọc
```

---

## 2. Ma trận quyền theo vai trò

| Hành động | Guest | sales | warehouse | admin (mgr) |
|---|:--:|:--:|:--:|:--:|
| Xem danh mục / cửa hàng / danh sách sản phẩm (endpoint guest) | ✅ | ✅ | ✅ | ✅ |
| Đăng nhập / xem hồ sơ / đăng xuất | ✅ | ✅ | ✅ | ✅ |
| Vào `/admin/stock` | ❌ | ✅ | ✅ | ✅ |
| Xem tồn kho của cửa hàng **mình** | ❌ | ✅ | ✅ | ✅ |
| Xem **bảng giá & khuyến mãi** (mọi cửa hàng) | ❌ | ✅ | ✅ | ✅ |
| **Chấm công** (clock-in/out) + xem lương của mình | ❌ | ✅ | ✅ | ✅ |
| Xem danh sách nhân viên (`/attendance/staff`) | ❌ | ✅ *(store mình)* | ✅ *(store mình)* | ✅ *(store mình — quirk BE)* |
| Xem tồn kho **mọi** cửa hàng + lọc theo cửa hàng | ❌ | ❌ | ❌ | ✅ |
| **Ghi** tồn kho (tạo/upsert, sửa số lượng, xoá) | ❌ | ❌ | ✅ *(cửa hàng mình)* | ✅ *(mọi cửa hàng)* |
| Chọn NV phụ trách khi ghi/sửa kho | ❌ | ❌ | ❌ (BE ghim staff = mình) | ✅ |
| Vào `/admin` (tổng quan) | ❌ | ❌ | ❌ | ✅ |
| Vào `/admin/profile` (hồ sơ nhân viên) | ❌ | ✅ | ✅ | ❌ (BE `role:warehouse,sales`) |
| CRUD sản phẩm / danh mục / size / nguyên liệu / cửa hàng | ❌ | ❌ | ❌ | ✅ |
| Lọc sản phẩm theo cửa hàng (`store_id`) | ❌ | ❌ | ❌ | ✅ |
| Khôi phục / xoá cứng sản phẩm | ❌ | ❌ | ❌ | ✅ |

---

## 3. Ma trận màn hình (route)

| Path | Component | Quyền | Ghi chú |
|---|---|---|---|
| `/` | `PublicLayout` + `HomePage` | công khai | trang chủ, mega menu danh mục + thumb |
| `/categories/:slug` | `CategoryPage` | công khai | danh sách món theo danh mục |
| `/products/:slug` | `ProductPage` | công khai | chi tiết món + ảnh DB + tồn kho theo cửa hàng |
| `/login` | `LoginPage` | công khai | đã đăng nhập ⇒ redirect `/admin` |
| `/admin` | `AdminLayout` + `RequireStaff` | token + role hợp lệ | layout chứa sidebar/menu |
| `/admin` (index) | `DashboardPage` | admin | warehouse/sales bị redirect sang `/admin/stock` |
| `/admin/stock` | `StockPage` | admin/warehouse/sales | nút ghi/xoá chỉ hiện với admin & warehouse; admin chọn NV phụ trách |
| `/admin/prices` | `PricesPage` | admin/warehouse/sales | bảng giá & khuyến mãi, đọc qua endpoint guest |
| `/admin/attendance` | `AttendancePage` | admin/warehouse/sales | chấm công vào/ra + lương theo giờ |
| `/admin/staff` | `StaffPage` | admin/warehouse/sales | danh sách nhân viên theo store scope |
| `/admin/profile` | `ProfilePage` | warehouse/sales (`RequireWorker`) | `GET /staff/profile` |
| `/admin/products` | `ProductsPage` | admin | kèm hộp thoại restore / force + upload ảnh |
| `/admin/categories` | `CategoriesPage` | admin | |
| `/admin/sizes` | `SizesPage` (`SimplePage`) | admin | |
| `/admin/ingredients` | `IngredientsPage` (`SimplePage`) | admin | |
| `/admin/stores` | `StoresPage` (`SimplePage`) | admin | |
| `*` | `NotFoundPage` | công khai | |

---

## 4. Menu sidebar theo vai trò

| Mục | admin | warehouse | sales |
|---|:--:|:--:|:--:|
| Tổng quan (`/admin`) | ✅ | ❌ | ❌ |
| Sản phẩm (`/admin/products`) | ✅ | ❌ | ❌ |
| Danh mục (`/admin/categories`) | ✅ | ❌ | ❌ |
| Size (`/admin/sizes`) | ✅ | ❌ | ❌ |
| Nguyên liệu (`/admin/ingredients`) | ✅ | ❌ | ❌ |
| Cửa hàng (`/admin/stores`) | ✅ | ❌ | ❌ |
| **Chấm công (`/admin/attendance`)** | ✅ | ✅ | ✅ |
| **Bảng giá (`/admin/prices`)** | ✅ | ✅ | ✅ |
| **Kho (`/admin/stock`)** | ✅ | ✅ | ✅ |
| **Nhân viên (`/admin/staff`)** | ✅ | ✅ | ✅ |
| **Hồ sơ (`/admin/profile`)** | ❌ | ✅ | ✅ |

Sidebar footer hiển thị: tên · email · **tên vai trò** · **tên cửa hàng** (nếu có).

---

## 5. Ma trận theo endpoint (đối chiếu backend)

| Method + Path | Middleware BE | Quyền BE | FE gọi ở đâu | Cờ FE dùng để quyết định |
|---|---|---|---|---|
| `POST /api/auth/login` | `throttle:5,1` | public | `LoginPage` | — |
| `GET /api/auth/me` | `auth:api` | mọi user đã đăng nhập | `AuthProvider` | — |
| `POST /api/auth/logout` | `auth:api` | mọi user đã đăng nhập | `AdminLayout` | — |
| `GET /api/categories` | — | public | `useCategories` (dropdown + cột đếm) | — |
| `GET /api/stores` | — | public | `useStores` (bộ lọc + chọn cửa hàng) | — |
| `GET /api/products` | — | public | `useProductDirectory` (tra tên sản phẩm) + trang công khai | — |
| `GET /api/products/{slug}` | — | public | trang chi tiết món | — |
| `GET /api/categories/{slug}` | — | public | trang danh mục | — |
| `GET /api/search?q=` | — | public | ô tìm kiếm trên header | — |
| `GET /api/admin/products` | `auth:api`, `role:admin` | admin | `ProductsPage`, `DashboardPage` | `isAdmin` |
| `POST/PUT/DELETE /api/admin/products[/{id}]` | `auth:api`, `role:admin` | admin | `ProductsPage` | `isAdmin` |
| `POST /api/admin/products/{id}/restore` | `auth:api`, `role:admin` | admin | `TrashDialog` | `isAdmin` |
| `DELETE /api/admin/products/{id}/force` | `auth:api`, `role:admin` | admin | `TrashDialog` | `isAdmin` |
| `GET/POST/PUT/DELETE /api/admin/categories\|sizes\|ingredients\|stores` | `auth:api`, `role:admin` | admin | `CategoriesPage`, `SimplePage` | `isAdmin` |
| `GET /api/stock` | `auth:api`, `store.scope:sales,warehouse,admin` | kho/bán hàng: cửa hàng mình · admin: tất cả | `StockPage` | `canReadStock` |
| `GET /api/stock/{id}` | `auth:api`, `store.scope:…` | như trên | (chưa dùng) | — |
| `POST /api/attendance/clock-in` | `auth:api`, `store.scope:sales,warehouse,admin` | mọi vai trò hợp lệ | `AttendancePage` | `canReadStock` (được vào layout) |
| `POST /api/attendance/clock-out` | `auth:api`, `store.scope:sales,warehouse,admin` | như trên · 404 nếu không có ca mở | `AttendancePage` | — |
| `GET /api/attendance/salary` | `auth:api`, `store.scope:sales,warehouse,admin` | lương của **chính mình** | `AttendancePage` | — |
| `GET /api/attendance/staff` | `auth:api`, `store.scope:sales,warehouse,admin` | store mình (**quirk BE: cả admin bị ghim**) | `StaffPage`, `StockForm` (dropdown NV) | `canReadStock` |
| `GET /attendance/staff/{staff}` | `auth:api`, `store.scope:…` | như trên | (chưa dùng) | — |
| `GET /api/staff/profile` | `auth:api`, `role:warehouse,sales` | warehouse + sales · 403 với admin | `ProfilePage` (`RequireWorker`) | `role` |
| `POST /api/stock` | `auth:api`, `store.scope:warehouse,admin` | warehouse: ghim cửa hàng mình · admin: chọn cửa hàng | `StockForm` | `canWriteStock` + `isAdmin` (chọn cửa hàng) |
| `PUT /api/stock/{id}` | `auth:api`, `store.scope:warehouse,admin` | như trên | `StockForm` | `canWriteStock` |
| `DELETE /api/stock/{id}` | `auth:api`, `store.scope:warehouse,admin` | như trên | `StockPage` | `canWriteStock` |

---

## 6. Phạm vi cửa hàng trên UI

| Vai trò | Cửa hàng hiển thị | Gửi `store_id` khi ghi kho? | Gửi/chọn `staff_id`? | Lọc cửa hàng trên bảng kho? |
|---|---|---|---|---|
| admin | tất cả (`GET /api/stores`) | ✅ (bắt buộc chọn) | ✅ (chọn từ `/attendance/staff`, không gửi ⇒ BE giữ staff cũ) | ✅ |
| warehouse | cửa hàng của mình (`user.staff.store`) | ❌ (BE ghim) | ❌ (BE ghim staff = mình) | ❌ (BE ghim) |
| sales | cửa hàng của mình | ❌ (không có nút ghi) | ❌ (không có nút ghi) | ❌ |

---

## 7. Hạn chế & điểm cần chú ý

1. **Không có phân quyền ở cấp object**: mọi admin đều thấy và thao tác được toàn bộ bản ghi master data.
2. **Chỉ có list staff (read-only)** qua `/api/attendance/staff` — BE chưa có CRUD staff (M6) ⇒ tạo/điều chuyển nhân viên phải làm bên DB/BE.
3. **Quirk BE list staff**: controller so `role->name !== 'admin'` mà `name` là "Quản trị" ⇒ admin cũng bị ghim store của mình (không phải là bug từ FE).
4. **Không có endpoint list sản phẩm đã xoá** ⇒ khôi phục/xoá cứng phải nhập id thủ công.
5. **Lương chỉ là tổng giờ của chính mình** — BE chưa trả rate/số tiền, chưa có lương theo nhóm staff.
6. **Chưa có rate-limit** cho endpoint admin/kho/attendance (chỉ login bị throttle) — FE không cần xử lý riêng.
7. **401 vs 403**: 401 ⇒ đăng xuất; 403 ⇒ hiện message của BE, giữ nguyên trạng thái phiên.
8. Người dùng không có hồ sơ nhân viên (ví dụ `test@example.com` của BE) ⇒ đăng nhập được nhưng bị chặn ngay ở FE, trước cả khi gọi API.
