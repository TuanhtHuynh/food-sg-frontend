/**
 * Vai trò mà backend chấp nhận (khớp `App\Models\Role` của Laravel:
 * ADMIN / WAREHOUSE / SALES). BE **chưa** có endpoint list role, nên FE giữ
 * danh sách này ở đây làm nguồn duy nhất và dùng chung mọi nơi.
 */
export const STAFF_ROLE_SLUGS = ['admin', 'warehouse', 'sales'] as const

export type RoleSlug = (typeof STAFF_ROLE_SLUGS)[number]

export interface Category {
  id: number
  name: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  meta_keyword: string | null
  created_at: string
  updated_at: string
  products_count?: number
  products?: Product[]
}

export interface Size {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Store {
  id: number
  name: string
  address: string
  created_at: string
  updated_at: string
  /** Chỉ có trong GET /api/admin/stores/{id} (loadCount staffs). */
  staffs_count?: number
}

/** Bản ghi tồn kho — luôn theo (product, store). */
export interface Stock {
  id: number
  product_id: number
  store_id: number | null
  staff_id: number | null
  quantity: number
  created_at: string
  updated_at: string
  store?: Store | null
}

export interface Product {
  id: number
  name: string
  /** Đường dẫn ảnh trên storage của BE, ví dụ "/storage/products/x.jpg" (null nếu chưa có ảnh). */
  image: string | null
  slug: string
  price: number
  sale_price: number | null
  sale_start_at: string | null
  sale_end_at: string | null
  category_id: number
  meta_title: string | null
  meta_description: string | null
  meta_keyword: string | null
  created_at: string
  updated_at: string
  category: Category
  description?: string
  sizes?: Size[]
  ingredients?: Ingredient[]
  /** Tồn kho theo từng cửa hàng (khi endpoint có load quan hệ stocks). */
  stocks?: Stock[]
  /** Tồn kho đơn, chỉ trả về khi sản phẩm có đúng 1 bản ghi trong phạm vi. */
  stock?: Stock | null
}

export interface Role {
  id: number
  name: string
  /** Slug thực tế của DB — có thể ngoài STAFF_ROLE_SLUGS (BE chưa chặn, chỉ middleware mới chặn). */
  slug: string
}

export interface Staff {
  id: number
  name: string
  user_id: number | null
  store_id: number | null
  role_id: number | null
  store: Store | null
  role: Role | null
  /** Chỉ có ở GET /api/attendance/staff (load sẵn user). */
  user?: User | null
  created_at?: string
  updated_at?: string
}

/** Bản ghi chấm công (clock_ins) — clock_out null khi ca đang mở. */
export interface ClockEntry {
  id: number
  staff_id: number
  clock_in: string
  clock_out: string | null
  created_at: string
  updated_at: string
}

/** Kết quả GET /api/attendance/salary — giờ làm tròn từ staff_shifts. */
export interface SalarySummary {
  staff_id: number
  store_id: number | null
  total_hours: number
  note: string
}

export interface User {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
  staff: Staff | null
}

export interface AuthResponse {
  token: string
  token_type: string
  expires_in: number
  user: User
}

export interface Paginated<T> {
  data: T[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface DataResponse<T> {
  data: T
}

export interface Banner {
  id: number
  image: string | null
  title?: string
  link_url?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Page {
  id: number
  title: string
  slug: string
  content: string
  created_at: string
  updated_at: string
}
