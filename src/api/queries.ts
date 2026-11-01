import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/client'
import type {
  AuthResponse,
  Banner,
  Category,
  ClockEntry,
  DataResponse,
  Paginated,
  Page,
  Product,
  SalarySummary,
  Stock,
  Store,
  Staff,
  User,
} from './types'

export type Resource = 'products' | 'categories' | 'sizes' | 'ingredients' | 'stores' | 'pages' | 'banners'

export interface ListParams {
  q?: string
  page?: number
  category_id?: number
  /** Lọc theo cửa hàng (chỉ admin products hỗ trợ store_id). */
  store_id?: number
}

export interface StockListParams {
  q?: string
  page?: number
  product_id?: number
  /** Chỉ admin được lọc; warehouse/sales luôn bị ghim vào cửa hàng của họ. */
  store_id?: number
}

export interface StockPayload {
  product_id: number
  quantity: number
  /** Chỉ gửi khi admin; warehouse bị server ghim cửa hàng của mình. */
  store_id?: number
  /** Admin chọn từ GET /api/attendance/staff (bắt buộc thuộc cửa hàng của bản ghi). */
  staff_id?: number
}

/* ---------------------------------- auth ---------------------------------- */

export async function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export async function meRequest() {
  const response = await apiRequest<{ user: User }>('/auth/me')
  return response.user
}

export async function logoutRequest() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
}

/* -------------------------------- resources -------------------------------- */

export async function listResource<T>(resource: Resource, params: ListParams = {}) {
  return apiRequest<Paginated<T>>(`/admin/${resource}`, { params: { ...params } })
}

export async function getResource<T>(resource: Resource, id: number) {
  const response = await apiRequest<DataResponse<T>>(`/admin/${resource}/${id}`)
  return response.data
}

export async function createResource<T>(resource: Resource, payload: unknown) {
  const response = await apiRequest<DataResponse<T>>(`/admin/${resource}`, {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateResource<T>(resource: Resource, id: number, payload: unknown) {
  const response = await apiRequest<DataResponse<T>>(`/admin/${resource}/${id}`, {
    method: 'PUT',
    body: payload,
  })
  return response.data
}

export async function deleteResource(resource: Resource, id: number) {
  return apiRequest<{ message: string }>(`/admin/${resource}/${id}`, { method: 'DELETE' })
}

/** Sửa banner kèm ảnh — multipart qua POST + `_method=PUT` (PHP không parse multipart PUT). */
export async function updateBannerWithImage(id: number, formData: FormData) {
  return apiRequest<DataResponse<Banner>>(`/admin/banners/${id}`, {
    method: 'POST',
    body: formData,
  })
}

/** Khôi phục sản phẩm đã xoá mềm (kèm staff + user liên quan). */
export async function restoreProduct(id: number) {
  const response = await apiRequest<DataResponse<Product>>(`/admin/products/${id}/restore`, {
    method: 'POST',
  })
  return response.data
}

/** Xoá cứng sản phẩm — không thể hoàn tác. */
export async function forceDeleteProduct(id: number) {
  return apiRequest<{ message: string }>(`/admin/products/${id}/force`, { method: 'DELETE' })
}

/** Tạo sản phẩm kèm ảnh — multipart (`image` là file: jpg/jpeg/png/webp ≤ 2048KB). */
export async function createProductWithImage(formData: FormData) {
  return apiRequest<DataResponse<Product>>('/admin/products', { method: 'POST', body: formData })
}

/** Sửa sản phẩm kèm ảnh — multipart qua POST + `_method=PUT` (PHP không parse multipart PUT). */
export async function updateProductWithImage(id: number, formData: FormData) {
  return apiRequest<DataResponse<Product>>(`/admin/products/${id}`, {
    method: 'POST',
    body: formData,
  })
}

/* ------------------------- attendance & staff (M7) ------------------------- */

/** Chấm công vào ca — BE trả 201 với bản ghi clock_ins. */
export async function clockIn() {
  return apiRequest<ClockEntry>('/attendance/clock-in', { method: 'POST' })
}

/** Chấm công ra ca — 404 nếu không có ca đang mở. */
export async function clockOut() {
  return apiRequest<ClockEntry>('/attendance/clock-out', { method: 'POST' })
}

/** Tổng giờ làm của chính mình (staff_shifts, giờ làm tròn). */
export async function getMySalary() {
  return apiRequest<SalarySummary>('/attendance/salary')
}

/** Danh sách nhân viên — store của mình (admin cũng bị BE ghim store của admin). */
export async function listStaff() {
  return apiRequest<Staff[]>('/attendance/staff')
}

/** Hồ sơ nhân viên — BE chỉ cho warehouse/sales (admin bị từ chối). */
export async function getStaffProfile() {
  const response = await apiRequest<{ user: User }>('/staff/profile')
  return response.user
}

/* ------------------------------ guest (công khai) -------------------------- */

export interface GuestProductParams {
  /** slug danh mục */
  category?: string
  /** lọc theo cửa hàng (chỉ trả món có tồn ở cửa hàng đó) */
  store_id?: number
  page?: number
  per_page?: number
}

export interface GuestSearchResult {
  query: string
  products: Product[]
  categories: Category[]
}

export async function listGuestStores() {
  const response = await apiRequest<DataResponse<Store[]>>('/stores', { auth: false })
  return response.data
}

export async function listGuestProducts(params: GuestProductParams = {}) {
  return apiRequest<Paginated<Product>>('/products', {
    params: { per_page: 12, ...params },
    auth: false,
  })
}

export async function getGuestProduct(slug: string) {
  const response = await apiRequest<DataResponse<Product>>(`/products/${slug}`, { auth: false })
  return response.data
}

export async function getGuestCategory(slug: string) {
  const response = await apiRequest<DataResponse<Category>>(`/categories/${slug}`, { auth: false })
  return response.data
}

export async function getGuestPage(slug: string) {
  // BE trả thẳng Page (không bọc `data`) cho `/pages/{slug}`.
  const response = await apiRequest<DataResponse<Page> | Page>(`/pages/${slug}`, { auth: false })
  return 'data' in response ? response.data : response
}

export async function searchGuest(query: string) {
  return apiRequest<GuestSearchResult>('/search', { params: { q: query }, auth: false })
}

/** Tải toàn bộ danh mục sản phẩm (mỗi trang 50) để tra tên theo product_id. */
export async function fetchProductDirectory(): Promise<Product[]> {
  const first = await listGuestProducts({ page: 1, per_page: 50 })
  const products = [...first.data]
  const lastPage = Math.min(first.meta?.last_page ?? 1, 20)

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await listGuestProducts({ page, per_page: 50 })
    products.push(...next.data)
  }

  return products
}

export async function listCategories() {
  const response = await apiRequest<DataResponse<Category[]>>('/categories', { auth: false })
  return response.data
}

/* ---------------------------------- kho (M5) -------------------------------- */

export async function listStock(params: StockListParams = {}) {
  return apiRequest<Paginated<Stock>>('/stock', { params: { ...params } })
}

export async function getStock(id: number) {
  const response = await apiRequest<DataResponse<Stock>>(`/stock/${id}`)
  return response.data
}

export async function createStock(payload: StockPayload) {
  const response = await apiRequest<DataResponse<Stock>>('/stock', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateStock(id: number, payload: Partial<StockPayload>) {
  const response = await apiRequest<DataResponse<Stock>>(`/stock/${id}`, {
    method: 'PUT',
    body: payload,
  })
  return response.data
}

export async function deleteStock(id: number) {
  return apiRequest<{ message: string }>(`/stock/${id}`, { method: 'DELETE' })
}

/* ---------------------------------- hooks --------------------------------- */

export function useList<T>(resource: Resource, params: ListParams = {}) {
  return useQuery({
    queryKey: ['admin', resource, 'list', params],
    queryFn: () => listResource<T>(resource, params),
    placeholderData: keepPreviousData,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  })
}

/** Danh sách cửa hàng (guest) — dùng cho bộ lọc, không cần quyền admin. */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: listGuestStores,
    staleTime: 5 * 60 * 1000,
  })
}

/** Danh mục sản phẩm đầy đủ để tra tên theo product_id (kho chỉ trả product_id). */
export function useProductDirectory() {
  return useQuery({
    queryKey: ['directory', 'products'],
    queryFn: fetchProductDirectory,
    staleTime: 5 * 60 * 1000,
  })
}

/* --------------------------- hooks cho trang public ------------------------ */

export function useGuestProducts(params: GuestProductParams = {}) {
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () => listGuestProducts(params),
    placeholderData: keepPreviousData,
  })
}

export function useGuestProduct(slug: string) {
  return useQuery({
    queryKey: ['guest', 'product', slug],
    queryFn: () => getGuestProduct(slug),
    enabled: Boolean(slug),
  })
}

export function useGuestCategory(slug: string) {
  return useQuery({
    queryKey: ['guest', 'category', slug],
    queryFn: () => getGuestCategory(slug),
    enabled: Boolean(slug),
  })
}

export function useGuestPage(slug: string) {
  return useQuery({
    queryKey: ['guest', 'page', slug],
    queryFn: () => getGuestPage(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuestSearch(query: string) {
  return useQuery({
    queryKey: ['guest', 'search', query],
    queryFn: () => searchGuest(query),
    enabled: query.trim().length >= 2,
  })
}

export function useStockList(params: StockListParams = {}) {
  return useQuery({
    queryKey: ['stock', params],
    queryFn: () => listStock(params),
    placeholderData: keepPreviousData,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin'], exact: false })
    queryClient.invalidateQueries({ queryKey: ['products'], exact: false })
    queryClient.invalidateQueries({ queryKey: ['banners'], exact: false })
    // Danh mục sản phẩm (dùng để tra tên trong module kho) cũng cần được làm mới.
    queryClient.invalidateQueries({ queryKey: ['directory'] })
  }
}

function useInvalidateStock() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['stock'], exact: false })
}

export function useCreate<T>(resource: Resource) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: unknown) => createResource<T>(resource, payload),
    onSuccess: invalidate,
  })
}

export function useUpdate<T>(resource: Resource) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: unknown }) =>
      updateResource<T>(resource, id, payload),
    onSuccess: invalidate,
  })
}

export function useDelete(resource: Resource) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => deleteResource(resource, id),
    onSuccess: invalidate,
  })
}

export function useRestoreProduct() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: invalidate,
  })
}

export function useForceDeleteProduct() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => forceDeleteProduct(id),
    onSuccess: invalidate,
  })
}

export function useCreateStock() {
  const invalidate = useInvalidateStock()
  return useMutation({
    mutationFn: (payload: StockPayload) => createStock(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateStock() {
  const invalidate = useInvalidateStock()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<StockPayload> }) =>
      updateStock(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteStock() {
  const invalidate = useInvalidateStock()
  return useMutation({
    mutationFn: (id: number) => deleteStock(id),
    onSuccess: invalidate,
  })
}

/* ----------------------------- hooks attendance ---------------------------- */

export function useClockIn() {
  return useMutation({ mutationFn: clockIn })
}

export function useClockOut() {
  return useMutation({ mutationFn: clockOut })
}

export function useMySalary() {
  return useQuery({
    queryKey: ['attendance', 'salary'],
    queryFn: getMySalary,
    staleTime: 60 * 1000,
  })
}

/** Danh mục nhân viên để hiện tên theo staff_id (StockResource không trả `staff`). */
export function useStaffDirectory() {
  return useQuery({
    queryKey: ['staff', 'directory'],
    queryFn: listStaff,
    staleTime: 5 * 60 * 1000,
  })
}

export function useStaffProfile() {
  return useQuery({
    queryKey: ['staff', 'profile'],
    queryFn: getStaffProfile,
  })
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await apiRequest<{ data: { id: number; image: string; title?: string; link_url?: string; sort_order: number }[] }>('/banners')
      return res.data ?? res
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProductWithImage() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (formData: FormData) => createProductWithImage(formData),
    onSuccess: invalidate,
  })
}

export function useUpdateProductWithImage() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      updateProductWithImage(id, formData),
    onSuccess: invalidate,
  })
}
