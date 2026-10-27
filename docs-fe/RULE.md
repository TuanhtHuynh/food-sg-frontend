# FOOD-SG FE — RULE

> Các quy tắc riêng của **frontend** (business + kỹ thuật) mà code đang thực thi.
> Nguồn: `src/**`, `API_ROUTES.txt`, tài liệu backend `docs/`. Cập nhật: 2026-10-24.
> Luồng: [FLOWS.md](FLOWS.md) · Quyền: [PERMISS.md](PERMISS.md) · Model: [MODEL.md](MODEL.md) · Tổng quan: [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## R1. Quy tắc xác thực & phiên

1. Token JWT lưu ở `localStorage` với khoá **`food-sg-admin-token`** (`lib.ts:4`).
2. Mọi request có token đều gửi header `Authorization: Bearer <token>`; request `auth: false` (guest) **không** gửi header.
3. Khi mở app có token ⇒ **phải** gọi `GET /api/auth/me` để xác nhận token còn hạn và lấy vai trò; không tin token trong storage là hợp lệ.
4. **401** ⇒ xoá token + phát sự kiện `food-sg:unauthorized` ⇒ `AuthProvider` set `user = null` ⇒ UI chuyển về `/login` và nhớ đường dẫn cũ qua `state.from`.
5. **429** (login quá 5 lần/phút) ⇒ hiện nguyên message của BE, không tự retry.
6. Đăng xuất luôn gọi `POST /api/auth/logout` trước khi xoá token cục bộ; lỗi mạng không được chặn việc đăng xuất phía client.

## R2. Quy tắc vai trò (client-side)

1. Vai trò lấy **duy nhất** từ `user.staff.role.slug`; không suy diễn từ email hay tên.
2. Chỉ 3 slug hợp lệ: `admin`, `warehouse`, `sales` — khai báo **một lần** ở `STAFF_ROLE_SLUGS` (`src/api/types.ts`) và **phải khớp** hằng số `App\Models\Role` của BE (`ADMIN`/`WAREHOUSE`/`SALES`). Role khác ⇒ `role = null` ⇒ **không cấp menu nào**, hiện thông báo "Vai trò ... chưa được hỗ trợ".
3. `user.staff === null` ⇒ đăng nhập được nhưng không có quyền ⇒ chặn ở `RequireStaff`.
4. FE **không** tự quyết định quyền dữ liệu: mọi quyết định về "được thấy/ghi cái gì" đều do BE trả lời. Chặn ở UI chỉ để trải nghiệm tốt.
5. Mọi màn hình admin (master data) chỉ dành cho `admin`; màn hình Kho dành cho cả 3 vai trò.

## R3. Quy tắc validate form (phải khớp BE)

| Trường | Rule FE (Zod) | Rule BE |
|---|---|---|
| `name` (product/category/size/ingredient/store) | bắt buộc, ≤ 255 | `required`, ≤ 255 |
| `address` (store) | **bắt buộc**, ≤ 255 | `required`, ≤ 255 |
| `price` | số nguyên không âm, ≤ 9 999 999 999 | `numeric`, `min:0`, `max:9999999999` |
| `sale_price` | số nguyên không âm, hoặc rỗng ⇒ `null` | `nullable`, `numeric`, `min:0` |
| `sale_start_at` / `sale_end_at` | `datetime-local`; `sale_end_at ≥ sale_start_at` | `date`, `after_or_equal:sale_start_at` |
| `slug` | ≤ 255, rỗng ⇒ để BE tự sinh | `nullable`, `unique` |
| `meta_title` / `meta_keyword` | ≤ 255 | `max:255` |
| `meta_description` | ≤ 1000 | `max:1000` |
| `quantity` (kho) | số nguyên ≥ 0, bắt buộc | `required`, `integer`, `min:0` |
| `email` / `password` (login) | email hợp lệ / không rỗng | `required`, `email` |

1. Validate **client-side trước**, validate lại **server-side sau** — không bao giờ coi Zod là chốt chặn cuối.
2. Lỗi 422 của BE phải được gán đúng vào field (`mapServerErrors`); field không tồn tại trong form ⇒ hiện message chung.
3. ⚠ **Khoảng trống đã biết**: BE chưa chặn `sale_price > price` ⇒ FE nên thêm cảnh báo (hiện tại chưa có).

## R4. Quy tắc slug & SEO

1. `slug` là **unique** ở `products` và `categories`.
2. FE để trống slug ⇒ **không gửi** giá trị rỗng ⇒ BE tự sinh từ `name` (suffix `-2`, `-3` khi trùng).
3. Khi sửa mà **đổi `name` nhưng không đổi `slug`** ⇒ BE tự sinh lại slug ⇒ FE phải hiển thị lại slug sau khi lưu (hiện tại list được refetch nên tự cập nhật).
4. Trường SEO (`meta_*`) chỉ tồn tại ở product & category; form size/ingredient/store không có các field này.
5. URL chuẩn của hệ thống: `/api/products/{slug}`, `/api/categories/{slug}` — FE admin dùng **id** để thao tác admin, không dùng slug cho URL admin.

## R5. Quy tắc phân trang & tìm kiếm

| Ngữ cảnh | Quy tắc FE |
|---|---|
| Bảng admin (`useList`) | gửi `?page=` (1-based) + `?q=`; BE cố định **15 bản ghi/trang**; FE không gửi `per_page` |
| Bảng kho (`useStockList`) | `?page=` + `?q=` (+ `?store_id=` chỉ khi admin); BE cố định **15 bản ghi/trang** |
| Tra cứu phụ trợ | `GET /api/categories`, `GET /api/stores`, `GET /api/attendance/staff` — **không phân trang** (trả toàn bộ/mảng thẳng) |
| Thư mục sản phẩm | `GET /api/products?per_page=50` (tối đa 50) + lặp tới hết trang, tối đa **20 trang** |
| Tổng số bản ghi | đọc `meta.total`; số trang đọc `meta.last_page` |

1. Ô tìm kiếm luôn **debounce 350ms** (`useSearch`) trước khi gọi API.
2. Đổi bộ lọc ⇒ **reset về trang 0**.
3. Tìm kiếm của BE là `LIKE %q%` trên `name` **và** `slug` (kho: tìm trong tên/slug sản phẩm).
4. `keepPreviousData` giữ dữ liệu trang cũ trong lúc chờ ⇒ không nhấp nháy bảng.

## R6. Quy tắc module kho (quan trọng)

1. **Tồn kho thuộc cửa hàng**: 1 món có **nhiều** bản ghi kho, mỗi cửa hàng 1 bản ghi (`unique(product_id, store_id)`).
2. `warehouse` **không được gửi** `store_id`/`staff_id` khi ghi ⇒ BE tự ghim `staff.store_id` và `staff.id`.
3. `admin` **phải chọn** `store_id` khi tạo bản ghi kho (BE trả 422 nếu thiếu).
4. Sửa bản ghi kho chỉ được đổi **số lượng** + (admin) **NV phụ trách** (không đổi được `product_id`/`store_id`).
5. `staff_id` khi sửa kho: **không gửi ⇒ BE giữ nhân viên cũ** (được BE 2026-10-24; không còn set null). Admin chỉ gửi khi muốn đổi người.
6. `sales` **không có** nút ghi/xoá trên UI (BE cũng trả 403).
7. BE không trả tên sản phẩm lẫn object `staff` trong `StockResource` ⇒ FE **phải** tra tên qua **thư mục sản phẩm** và **danh mục nhân viên** (`['staff','directory']`); nếu `product_id`/`staff_id` không còn tồn tại (đã xoá mềm) ⇒ hiển thị `#id`.
8. `staff_id` gán vào kho phải thuộc đúng `store_id` của bản ghi — BE `guardStaffBelongsToStore` trả 422 `errors.staff_id`; FE hiện lỗi đúng field.
9. Lọc cửa hàng ở màn kho chỉ dành cho admin — kho/bán hàng bị BE ghim sẵn vào cửa hàng của họ.

## R7. Quy tắc hiển thị giá & khuyến mãi

1. Màn **Bảng giá** (`/admin/prices`) dành cho **cả 3 vai trò** — dữ liệu lấy từ endpoint **guest** `GET /api/products` nên không cần quyền admin.
2. Khuyến mãi **đang áp dụng** ⇔ có `sale_price` **và** (không có cửa sổ **hoặc** thời điểm hiện tại ∈ `[sale_start_at, sale_end_at]`).
3. "Giá bán hiện hành" = `sale_price` nếu đang áp dụng, ngược lại `price`; cột luôn hiện **giá gốc** để đối chiếu.
4. `sale_price > price` ⇒ hiện cảnh báo "Giá KM > giá gốc" (BE chưa chặn — xem R3.3).
5. Tìm kiếm & lọc danh mục của màn Bảng giá chạy **client-side** trên thư mục sản phẩm; phân trang 15 dòng/trang cắt ở client.
6. Mọi mức giá hiển thị bằng `formatMoney` (VND, không phần thập phân) và mốc thời gian bằng `formatDate` (vi-VN).

## R7b. Quy tắc chấm công & lương (mọi vai trò)

1. `POST /attendance/clock-in` tạo bản ghi mới **mỗi lần bấm** — BE không chặn bấm trùng ⇒ FE disable nút khi `isPending` nhưng không tự de-dupe.
2. `POST /attendance/clock-out` đóng ca đang mở; 404 "Không có ca đang mở" ⇒ hiện nguyên message, không retry.
3. BE trả `ClockIn` **object thẳng** (không bọc `{data}`) ⇒ type `ClockEntry` đọc từ payload gốc.
4. Lương `GET /attendance/salary` chỉ là **chính mình** (tổng `staff_shifts.hours`, giờ làm tròn); BE chưa trả rate ⇒ FE không tự nhân tiền, chỉ hiện số giờ + `note`.

## R8. Quy tắc xoá & khôi phục

1. Xoá danh mục ⇒ **cảnh báo bắt buộc**: cascade xoá cứng toàn bộ sản phẩm thuộc danh mục (`RULE.md` của BE, R3.5).
2. Xoá cửa hàng ⇒ cảnh báo bắt buộc: cascade xoá cứng nhân viên **và** tồn kho của cửa hàng đó.
3. Xoá size / nguyên liệu ⇒ cảnh báo: mất liên kết với sản phẩm (không mất sản phẩm).
4. Xoá mềm sản phẩm ⇒ cảnh báo: ẩn sản phẩm **+ nhân viên phụ trách + tài khoản đăng nhập của nhân viên**; tồn kho giữ nguyên.
5. Xoá cứng sản phẩm ⇒ xác nhận **2 bước** (bước 2 nằm trong hộp thoại), nêu rõ "không thể hoàn tác".
6. Mọi thao tác xoá đều qua `ConfirmDialog` — không xoá ngay khi bấm nút.

## R9. Quy tắc trang công khai (guest)

1. Mọi trang public **không** được gửi token (`auth: false`) và **không** nằm sau `RequireStaff`/`RequireAdmin`.
2. URL chuẩn (khớp RULE R1.7 của BE): `/products/{slug}` và `/categories/{slug}` — **không** dùng id trong URL public.
3. Mega menu danh mục: mở/đóng bằng **CSS của Tailwind** — `group-hover:` (chuột) và `group-focus-within:` (bấm / bàn phím). Ràng buộc cấu trúc để không nhấp nháy: `group` đặt trên wrapper chứa **cả nút lẫn panel**; wrapper `static` (panel định vị theo header container `relative` với `inset-x-0 top-full`); header `py-0` + `items-stretch` để mép dưới nút trùng mép trên panel (không khe hở). **Bấm link trong panel ⇒ menu phải đóng**: vì CSS không ép được `:hover` tắt nên dùng state `dismissed` + class `invisible! opacity-0!` (Tailwind v4 dùng dấu `!` ở **cuối** utility), reset khi chuột rời trigger.
4. Tìm kiếm: `GET /api/search` chỉ chạy khi `q` có **≥ 2 ký tự** (đúng rule BE), debounce 300ms, kết quả hiện dropdown (món + danh mục).
5. Bộ chọn cửa hàng ở header dùng `store_id` để **lọc server-side** (`GET /api/products?store_id=`) ⇒ chỉ hiện món đang có tồn ở cửa hàng đó.
6. Chia sẻ state giữa layout và trang con qua **Outlet context** (`PublicContext`) — không tạo Context file riêng cho trang public.
7. Món chưa có ảnh (`image = null`) ⇒ khung xám trống (`ProductThumb`); có ảnh ⇒ `<img>` từ DB và lazy load (xem R15).
8. Trang 404 của BE (product/category không tồn tại) ⇒ hiện thông báo "Không tìm thấy …" + link về trang chủ, **không** crash trang.

## R10. Quy tắc gọi API

1. Base URL: `import.meta.env.VITE_API_URL` (mặc định `/api`); dev proxy `/api` → `http://localhost:8000`.
2. Chỉ dùng **method** `GET | POST | PUT | DELETE` (không có `PATCH` trong client).
3. Response luôn được bọc: `{ data: ... }` (đơn) hoặc `{ data, links, meta }` (list) ⇒ `api.ts` bóc sẵn `response.data` cho các hàm `create*`/`update*`.
4. Lỗi: `ApiError` chứa `status` + `message` + `errors` (mảng message theo field); message lấy từ `payload.message`, fallback `Lỗi {status}`.
5. Body gửi đi luôn là JSON (`Content-Type: application/json`); `Accept: application/json` cho mọi request.
6. Query param rỗng (`''`, `undefined`, `null`) **không** được gửi (`lib.ts:41-43`).

## R11. Quy tắc cache client

1. Key query: `['admin', resource, params]` · `['stock', params]` · `['categories']` · `['stores']` · `['directory','products']`.
2. Dữ liệu tra cứu phụ trợ (categories/stores/directory) có `staleTime = 5 phút` (khớp TTL cache guest của BE = 300s).
3. Mọi mutation admin ⇒ invalidate `['admin']` **và** `['directory']`; mutation kho ⇒ invalidate `['stock']`.
4. Không tự cache dữ liệu nhạy cảm ở localStorage ngoài token.

## R12. Quy tắc UI & trải nghiệm

1. Mọi bảng dùng `DataTable` (phân trang server-side) + `ResourceTable` (tìm kiếm + lọc + cột thao tác + xác nhận xoá) — không tự viết bảng mới.
2. Form dùng `TextField`/`TextAreaField` (register của React Hook Form) — không tự quản lý state input.
3. Nút thao tác phải disable khi `isSubmitting` / `isPending` để tránh gọi trùng.
4. Lỗi mạng/lỗi chung hiển thị ở chân form, không nuốt mất lỗi 422 theo field.
5. Menu sidebar **phải** phản ánh đúng vai trò hiện tại (render lại khi `user` đổi).
6. Màn hình chỉ đọc (`sales`) ⇒ dùng `showActions={false}` của `ResourceTable` thay vì ẩn bằng CSS.

## R13. Quy tắc code

1. TypeScript strict; **không** dùng `any` tường minh, không dùng `@ts-ignore`.
2. Kiểu dữ liệu API khai báo tập trung ở `src/api/types.ts`; không khai báo lại shape JSON trong component.
3. Validate khai báo tập trung ở `src/api/schemas.ts`; component không tự viết hàm validate rời.
4. Component dùng chung nằm ở `src/components/`, dùng generic cho 4 chỗ: `useList<T>`, `DataTable<T>`, `ResourceTable<T>`, `TextField<T>`.
5. Comment chỉ giải thích **vì sao** (điểm dễ sai của business), không comment lặp lại code.
6. Lint + typecheck + build phải sạch trước khi commit: `npm run lint` · `npx tsc -b` · `npm run build`.

## R14. Quy tắc an toàn

1. Không log token, `password` hay `Authorization` header ra console.
2. Không render HTML từ dữ liệu API không được escape (hiện tại dùng React text node ⇒ an toàn mặc định).
3. Xác nhận mọi thao tác phá huỷ dữ liệu (xoá, xoá cứng, restore).
4. Không gửi `staff_id` tùy tiện: chỉ gửi khi chọn nhân viên thuộc đúng cửa hàng (xem R6.4/R6.5).

## R15. Quy tắc ảnh sản phẩm

1. Ảnh file thuộc về **BE** (`storage/app/public/products`); FE **không** chứa file, chỉ nhận URL trong `Product.image` và render `<img>`.
2. **Upload multipart/form-data** khi có file mới (jpg/jpeg/png/webp ≤ 2048KB, BE `ProductRequest`):
   tạo = `POST /admin/products`; sửa = `POST /admin/products/{id}` + `_method=PUT` (PHP không parse multipart ở PUT).
3. Không có file ⇒ gửi JSON như cũ; **BE giữ ảnh hiện tại** (chỉ đổi ảnh khi `hasFile('image')`).
4. Client `apiRequest` tự nhận FormData ⇒ **không** set `Content-Type` tay (browser cần boundary).
5. `imageUrl()`: `/storage/…` ⇒ prefix `VITE_STORAGE_HOST` (mặc định `http://localhost:8000`); URL `http(s)://` giữ nguyên.
6. Chưa có ảnh (`image = null`) ⇒ **khung xám trống** (component `ProductThumb`) — không dùng placeholder chữ cái/màu.
7. Mọi ảnh tải `loading="lazy"` + `decoding="async"`; lỗi validate ảnh của BE (`errors.image`) hiện message chung ở footer form.

## R16. Quy tắc chấm công, nhân viên & hồ sơ

1. `POST /attendance/clock-in` tạo bản ghi mới mỗi lần bấm (BE không chặn trùng) ⇒ chỉ disable nút khi pending.
2. `POST /attendance/clock-out` 404 "Không có ca đang mở" ⇒ hiện nguyên message, không retry.
3. Response attendance là **object thẳng** (không bọc `{data}`) — type `ClockEntry`/`SalarySummary` đọc từ payload gốc.
4. Lương chỉ là tổng giờ của chính mình; **không tự nhân tiền** vì BE chưa trả rate.
5. `GET /api/attendance/staff` mảng thẳng, load sẵn `user` + `store`, **không phân trang**; là nguồn duy nhất cho danh mục nhân viên `['staff','directory']` (lưu ý quirk BE ghim cả admin theo store).
6. `GET /staff/profile` chỉ hợp lệ với `warehouse`/`sales` — admin bị chặn ở FE trước khi gọi (`RequireWorker`).
7. Nhân viên không có tài khoản ⇒ `user = null` ⇒ StaffPage hiện "Chưa có tài khoản".
