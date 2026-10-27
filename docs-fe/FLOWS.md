# FOOD-SG FE — FLOWS

> Các luồng màn hình của trang quản trị: product → store → mgr, và luồng của nhân viên kho / bán hàng (+ chấm công, nhân viên, hồ sơ).
> Nguồn: `src/**`. Cập nhật: 2026-10-24.
> Quy tắc: [RULE.md](RULE.md) · Quyền: [PERMISS.md](PERMISS.md) · Model: [MODEL.md](MODEL.md) · Tổng quan: [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## 1. Luồng tổng thể

```
        MGR (admin)                WAREHOUSE                    SALES
              │                        │                           │
              │ đăng nhập JWT            │ đăng nhập JWT             │ đăng nhập JWT
              ▼                        ▼                           ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  AuthProvider  (src/auth/provider.tsx)                                │
        │  token (localStorage) → GET /api/auth/me → user.staff.role   │
        └───────────────┬───────────────────────────────────────────────┘
                        │  role = admin | warehouse | sales | null
        ┌───────────────┴───────────────┬───────────────────────────────┐
        ▼                               ▼                               ▼
  /admin (F6)                   /admin/stock (F4)              /admin/stock (F4)
  /admin/products (F2+F5)       /admin/attendance (F9)         /admin/attendance (F9)
  /admin/categories (F2)        /admin/staff (F10)             /admin/staff (F10)
  /admin/sizes (F2)             /admin/profile (F11)           /admin/profile (F11)
  /admin/ingredients (F2)
  /admin/stores (F2)
  /admin/attendance (F9)
  /admin/staff (F10)
  admin không có F11 (BE role:warehouse,sales từ chối)
```

Bố cục chung của mọi màn hình quản trị:

```
┌──────────────┬───────────────────────────────────────────────┐
│ Sidebar      │ Header: tiêu đề + nút thao tác               │
│ (menu theo   ├───────────────────────────────────────────────┤
│  vai trò)    │ Ô tìm kiếm + bộ lọc                          │
│              ├───────────────────────────────────────────────┤
│  tên/email   │ Bảng dữ liệu (15 bản ghi/trang, server-side) │
│  vai trò     │                                               │
│  cửa hàng   │                                               │
│  [Đăng xuất] │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 2. Luồng đăng nhập & phiên (F1)

```
User nhập email + password
   → Zod: loginSchema (email hợp lệ, password ≠ rỗng)
   → POST /api/auth/login { email, password }
       ├─ 200 → { token, token_type, expires_in, user }
       │        → token lưu localStorage['food-sg-admin-token']
       │        → setUser(response.user)  → điều hướng về /admin
       │        (role lấy từ user.staff.role.slug)
       ├─ 422 → errors.email = ["Thông tin đăng nhập không đúng."]
       │        → hiện message, giữ nguyên form
       └─ 429 → "Too Many Attempts." (quá 5 lần/phút)
```

```
Mở app (có token trong localStorage)
   → GET /api/auth/me
       ├─ 200 → setUser(user) → role = user.staff.role.slug
       │        ├─ admin     → menu 7 mục, vào /admin
       │        ├─ warehouse → menu [Kho], ghi được kho
       │        ├─ sales     → menu [Kho], chỉ đọc
       │        └─ null      → "chưa gắn hồ sơ nhân viên" / "vai trò chưa hỗ trợ"
       ├─ 401 → xoá token → về /login
       └─ lỗi khác → xoá token → về /login
```

```
Đăng xuất
   → POST /api/auth/logout (invalidate token BE)
   → xoá token localStorage → setUser(null) → navigate('/login')
```

---

## 3. Luồng đọc danh sách (F2/F4) — dùng chung cho mọi bảng

```
Component gọi useList/useStockList({ q, page, category_id?, store_id? })
   → useQuery(queryKey = ['admin'|'stock', resource, params])
   → GET /api/admin/{resource}?…   hoặc   GET /api/stock?…
       → 200 { data: [...], links, meta }
       → meta.total  = tổng bản ghi (dùng cho đếm & phân trang)
       → meta.last_page = số trang
   → DataTable render rows (pageIndex = page, pageSize = 15)

[Ô tìm kiếm]  gõ → useSearch debounce 350ms → đổi `q` → refetch (page giữ nguyên)
[Bộ lọc]     đổi select → setPage(0) + đổi param → refetch
[Nút Trước/Sau] → setPage(n±1) → refetch với page mới
```

> `useList` dùng `placeholderData: keepPreviousData` ⇒ bảng cũ hiển thị trong lúc chờ dữ liệu trang mới (không nhấp nháy).

---

## 4. Luồng tạo / sửa sản phẩm (F2)

```
[+ Thêm sản phẩm]  → mở Modal ProductForm (defaultValues rỗng)
[Sửa] trên dòng    → mở Modal ProductForm (defaultValues = row hiện tại)
        │
        ▼
  Zod (productSchema) validate client
        │  fail → hiện lỗi dưới field, KHÔNG gọi API
        ▼
  payload = { name, price, category_id, sale_price, sale_start_at,
              sale_end_at, slug, meta_title, meta_description, meta_keyword }
        │  (slug/meta_* rỗng ⇒ gửi null ⇒ BE tự sinh slug từ name)
        │  (có file ảnh ⇒ chuyển thành multipart/form-data, xem section 12)
        ▼
  POST /api/admin/products        (tạo)      → 201 { data }
  PUT  /api/admin/products/{id}   (sửa)      → 200 { data }
        │
        ├─ 422 → mapServerErrors: gán errors.<field> vào đúng field của form
        │        (lỗi `image` ⇒ hiện message chung vì field ảnh ngoài RHF)
        ├─ 403/404 → hiện message của BE
        └─ 200/201 → đóng modal → invalidate ['admin'] + ['directory']
```

```
Cảnh báo xoá mềm (ProductsPage)
   "Xóa "<tên>" sẽ ẩn sản phẩm, nhân viên phụ trách và tài khoản đăng nhập
    của nhân viên đó. Tồn kho được giữ nguyên."
```

---

## 5. Luồng vòng đời sản phẩm: xoá → khôi phục → xoá cứng (F5)

```
[ Xóa ] trên dòng sản phẩm
   → ConfirmDialog (cảnh báo ở trên)
   → DELETE /api/admin/products/{id}
       → BE: product.deleted_at = now
              + staff có product_id = product.id (hoặc có stock của product) → soft delete
              + user của các staff đó → soft delete
              + product_stock GIỮ NGUYÊN
       → 200 { "message": "Đã xóa sản phẩm." }
   → invalidate ['admin'] + ['directory']  (sản phẩm biến mất khỏi list)

[Sản phẩm đã xoá] (mở hộp thoại)
   → nhập ID sản phẩm
   ├─ [Khôi phục] → POST /api/admin/products/{id}/restore
   │                 → BE: gỡ deleted_at của product + staff + user liên quan
   │                 → 200 { data }
   └─ [Xóa vĩnh viễn] → xác nhận lần 2 → DELETE /api/admin/products/{id}/force
                        → BE: xoá cứng, không khôi phục staff/user
                        → 200 { "message": "Đã xóa sản phẩm vĩnh viễn." }
   ⚠ BE chưa có endpoint list sản phẩm đã xoá ⇒ admin phải nhớ/nhập id.
```

---

## 6. Luồng bảng giá & khuyến mãi (F3) — cho mọi vai trò

```
/admin/prices  (admin | warehouse | sales)
   → useProductDirectory()  ⇒ GET /api/products?per_page=50 (mọi trang, tối đa 20 trang)
   → lọc client-side: từ khoá (tên/slug) + danh mục
   → phân trang 15 dòng/trang (cắt mảng trên client)
   → bảng: Sản phẩm | Danh mục | Giá | Giá khuyến mãi | Cửa sổ khuyến mãi | Giá bán hiện hành

   Quy tắc "đang áp dụng":
        sale_price = null                      → không có khuyến mãi
        sale_price ≠ null, không có cửa sổ      → luôn áp dụng
        sale_price ≠ null, có cửa sổ            → áp dụng khi
              now ∈ [sale_start_at, sale_end_at]
   → nếu sale_price > price ⇒ cảnh báo "Giá KM > giá gốc" (BE chưa chặn)
   → "Giá bán hiện hành" = sale_price nếu đang áp dụng, ngược lại price
```

---

## 7. Luồng kho theo cửa hàng (F4) — product → store

### 6.1. Nguyên tắc

```
        Tồn kho thuộc về CỬA HÀNG, không phải của sản phẩm "chung".

        Store A ("Food-SG Cầu Giấy")      Store B ("Food-SG Nguyễn Huệ")
   ┌───────────────────────────┐      ┌───────────────────────────┐
   │ Phở Bò: 33   (stock #15) │      │ Phở Bò: 55   (stock #14)  │
   │ NV: Kho 1                 │      │ NV: Kho 2                 │
   └───────────────────────────┘      └───────────────────────────┘
        ↑ 2 bản ghi product_stock khác nhau cho CÙNG một sản phẩm
          (ràng buộc BE: unique(product_id, store_id))

   Nhân viên kho của Store A:
     ✓ đọc/ghi tồn kho Store A
     ✗ đọc/ghi tồn kho Store B  ⇒ 403 "Bạn không có quyền thao tác dữ liệu của cửa hàng khác."
```

### 6.2. Đọc tồn kho

```
/admin/stock
   → useStockList({ q, page, store_id? })
       ├─ admin     → gửi store_id (nếu admin chọn lọc cửa hàng)
       └─ kho/bán hàng → KHÔNG gửi store_id ⇒ BE tự ghim cửa hàng của nhân viên
   → GET /api/stock?page=…
       → 200 { data: [ { id, product_id, store_id, staff_id, quantity, store } ], meta }
   → FE dựng Map<product_id, Product> từ thư mục sản phẩm (GET /api/products?per_page=50)
     để hiện TÊN sản phẩm (BE không trả field "product")
   → Bảng: Sản phẩm | Cửa hàng | Tồn kho | NV phụ trách | Cập nhật
```

### 6.3. Ghi tồn kho (admin / warehouse)

```
[+ Ghi tồn kho] → Modal StockForm
   ├─ [tìm sản phẩm]  lọc client trong thư mục sản phẩm
   ├─ [sản phẩm]      chọn product_id (bắt buộc)
   ├─ [cửa hàng]      chỉ admin chọn store_id (bắt buộc với admin)
   │                   warehouse: hiện "Tồn kho sẽ được ghi vào <cửa hàng của bạn>"
   ├─ [NV phụ trách]  admin chọn từ GET /api/attendance/staff (không bắt buộc);
   │                   label "tên (cửa hàng)" để tránh nhầm; BE 422 nếu staff không
   │                   thuộc cửa hàng đang chọn (errors.staff_id ui hiển thị đúng field)
   └─ [số lượng]      quantity, số nguyên ≥ 0
         │
         ▼
   Zod (stockSchema) → payload
      admin     : { product_id, quantity, store_id?, staff_id? }   (tạo) 
      warehouse : { product_id, quantity }              (BE ghim store_id + staff_id)
         ▼
   POST /api/stock
      ├─ 201 (tạo mới)  hoặc 200 (đã tồn tại ⇒ upsert theo (product_id, store_id))
      ├─ 422 errors.store_id  (admin chưa chọn cửa hàng)
      ├─ 422 errors.staff_id  (staff không thuộc cửa hàng — BE guard)
      └─ 403 (vượt phạm vi cửa hàng)
   → invalidate ['stock']
```

### 6.4. Sửa & xoá bản ghi kho

```
[Sửa] → Modal (sửa SỐ LƯỢNG + có thể đổi NV phụ trách khi admin)
   → PUT /api/stock/{id}
         admin     : { quantity, staff_id? }  — KHÔNG gửi staff_id ⇒ BE GIỮ nhân viên cũ
                                                  (Đổi từ 2026-10-24, không còn set null)
         warehouse : { quantity }             (BE ghim staff_id = staff của mình)
   → 403 nếu bản ghi thuộc cửa hàng khác

[Xóa] → ConfirmDialog → DELETE /api/stock/{id}
   → 200 { "message": "Đã xóa bản ghi tồn kho." } | 403 nếu vượt phạm vi
```

---

## 8. Luồng theo vai trò

| Bước | admin | warehouse | sales |
|---|---|---|---|
| Vào app | `/` → `/admin` (tổng quan) | `/` → `/admin/stock` | `/` → `/admin/stock` |
| Menu | 11 mục (6 mục admin + Chấm công/Bảng giá/Kho/Nhân viên + tổng quan + sản phẩm… ) | [Chấm công, Bảng giá, Kho, Nhân viên, Hồ sơ] | [Chấm công, Bảng giá, Kho, Nhân viên, Hồ sơ] |
| Mở `/admin/products` | OK | bị chặn ("Bạn không có quyền thực hiện thao tác này.") | bị chặn |
| Mở `/admin/profile` | bị chặn (BE `role:warehouse,sales`) | OK | OK |
| Xem bảng giá & khuyến mãi | OK | OK | OK |
| Chấm công (clock-in/out) + xem lương | OK | OK | OK |
| List nhân viên (`/attendance/staff`) | OK (BE ghim store admin) | OK (store mình) | OK (store mình) |
| Lọc cửa hàng ở màn Kho | có | không (đã bị ghim) | không (đã bị ghim) |
| Ghi tồn kho | có (chọn cửa hàng + NV phụ trách) | có (cửa hàng của mình) | **không có nút** |
| Xoá bản ghi kho | có | có (cửa hàng của mình) | **không có nút** |

> Lưu ý: chặn ở tầng UI chỉ để "dễ dùng"; **BE vẫn là lớp bảo vệ cuối** (403 khi vượt quyền).

---

## 9. Luồng hết phiên (401)

```
Bất kỳ request nào (có token) trả 401
   → lib.ts: token.clear() + emit 'food-sg:unauthorized'
   → auth.tsx: setUser(null) ⇒ RequireStaff chuyển hướng về /login
   (state.from = đường dẫn cũ ⇒ sau khi đăng nhập lại quay về đúng màn đó)
```

---

## 9b. Luồng chấm công & lương (F9) — mọi vai trò

```
/admin/attendance
   ├─ [Chấm công vào] → POST /api/attendance/clock-in
   │     └─ 201 { id, staff_id, clock_in, clock_out: null, … }
   │        → dòng trạng thái: "Ca #id · Vào <giờ> · Đang làm việc"
   ├─ [Chấm công ra] → POST /api/attendance/clock-out
   │     ├─ 200 { … clock_out: giờ ra }            → "…Ra <giờ>"
   │     └─ 404 "Không có ca đang mở"              → hiện message
   └─ Thẻ lương → GET /api/attendance/salary
         → { staff_id, store_id, total_hours, note }
         → hiện Tổng giờ làm (tròn) + tên cửa hàng (tra qua danh sách cửa hàng guest)
   (state các nút nằm trong component; tải lại trang thì reset — BE chưa có
    endpoint "ca hiện tại" nên FE không biết trước ca đang mở, thử clock-out là được)
```

---

## 9c. Luồng danh sách nhân viên & hồ sơ (F10/F11)

```
/admin/staff  (mọi vai trò)
   → useStaffDirectory() ⇒ GET /api/attendance/staff  (mảng thẳng, không phân trang)
   → BE ghim store: warehouse/sales thấy store mình; quirk BE: admin cũng bị ghim
     (controller so sánh role->name !== 'admin' mà name là "Quản trị")
   → Bảng: Nhân viên · Tài khoản (user.name + email, "Chưa có tài khoản" nếu user null)
           · Cửa hàng · Cập nhật
   → cùng nguồn dữ liệu với:
        dropdown "NV phụ trách" ở StockForm (StaffPage == ['staff','directory'])

/admin/profile  (chỉ warehouse/sales, guard RequireWorker)
   → GET /api/staff/profile ⇒ { user: UserResource } (user.staff.role + staff.store nạp sẵn)
   → hiện: họ tên, email, tên nhân viên, vai trò, cửa hàng, ngày tạo
   (admin bấm => bị chặn ở FE trước cả khi gọi; BE sẽ 403 nếu vẫn gọi)
```

---

## 10. Luồng trang công khai (guest) — F8

```
Khách mở "/"  (PublicLayout: header + footer, không cần token)
   ├─ MegaMenu  ← useCategories() (GET /api/categories)
   │              + useProductDirectory() (GET /api/products, gom theo category_id)
   │   hover nút "Danh mục" (hoặc bấm để focus) ⇒ panel hiện ngay dưới header,
   │   trải hết bề ngang container, mỗi cột 1 danh mục
   │      + tối đa 6 món nổi bật + "Xem tất cả" → /categories/{slug}
   │   (mở bằng CSS: group-hover + group-focus-within; bấm link ⇒ đóng menu)
   ├─ SearchBox ← useGuestSearch(q) (GET /api/search, q ≥ 2 ký tự, debounce 300ms)
   │   kết quả: danh mục + món (≤20 mỗi nhóm) → điều hướng
   └─ Chọn cửa hàng (header) → storeId dùng chung qua Outlet context
        └─ dùng cho: /api/products?store_id=  (chỉ hiện món còn tồn ở cửa hàng)

Trang chủ
   hero → lưới danh mục (link /categories/{slug})
        → "Đang khuyến mãi" (sale_price ≠ null, lấy từ thư mục sản phẩm)
        → "Menu hôm nay" (GET /api/products?per_page=12&store_id=)

Trang danh mục /categories/{slug}
   → GET /api/categories/{slug}   (tên, products_count, meta_description)
   → GET /api/products?category={slug}&per_page=12&page=n  (phân trang client)
   → 404 từ BE ⇒ hiện "Không tìm thấy danh mục" + link về "/"

Trang sản phẩm /products/{slug}
   → GET /api/products/{slug}
   → hiện: tên, giá / giá KM + cửa sổ KM, size, nguyên liệu,
           tồn kho theo cửa hàng (mảng stocks: store.name + quantity)
   → 404 từ BE ⇒ "Không tìm thấy sản phẩm" + link về "/"
```

---

## 11. Luồng làm mới dữ liệu (cache client)

```
Ghi dữ liệu (admin)  → invalidate ['admin'] + ['directory'] → refetch các query liên quan
Ghi dữ liệu (kho)    → invalidate ['stock']                → refetch bảng kho
Mở màn hình / đổi bộ lọc → query key đổi ⇒ TanStack Query tự refetch
```

---

## 12. Luồng ảnh sản phẩm (F2, mới 2026-10-24)

```
Form sản phẩm: state imageFile (File | null) — ngoài React Hook Form
   ├─ product?.image (URL từ DB) ⇒ preview nhỏ trong form
   ├─ chọn file (`<input type="file" accept="image/jpeg,image/png,image/webp">`) ⇒ imageFile
   └─ Submit
        ├─ imageFile == null ⇒ JSON như cũ (BE giữ ảnh hiện tại khi update)
        └─ imageFile != null ⇒ multipart/form-data:
             create: POST /api/admin/products               (fields + image)
             update: POST /api/admin/products/{id} + _method=PUT
                     (PHP không parse multipart ở PUT — Laravel override)
             response: BE lưu storage/app/public/products + trả ProductResource.image
   → invalidate ['admin'] + ['directory']

Hiển thị: mọi ảnh = <img> từ DB (component ProductThumb):   `/storage/…` → prefix VITE_STORAGE_HOST (mặc định http://localhost:8000)
   http(s)://…  → giữ nguyên
   image null   → khung xám (không dùng placeholder chữ cái/màu nữa)
   loading="lazy" + decoding="async"
```
