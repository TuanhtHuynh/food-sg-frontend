import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')
const STORAGE_HOST = (import.meta.env.VITE_STORAGE_HOST ?? 'http://localhost:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const UNAUTHORIZED_EVENT = 'food-sg:unauthorized'

export function emitUnauthorized() {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | undefined>
  auth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true } = options
  const isFormData = body instanceof FormData

  const url = new URL(`${API_URL}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  // FormData tự sinh Content-Type với boundary — không được override bằng tay.
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  const response = await fetch(url.toString(), {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401 && auth) {
      emitUnauthorized()
    }
    throw new ApiError(
      response.status,
      payload?.message ?? `Lỗi ${response.status}`,
      payload?.errors ?? {},
    )
  }

  return payload as T
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

/** Gán lỗi 422 từ server vào đúng field của form. */
export function mapServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Array<FieldPath<T>>,
) {
  if (!(error instanceof ApiError) || error.status !== 422) return false

  for (const [field, messages] of Object.entries(error.errors)) {
    const key = field as FieldPath<T>
    if (fields.includes(key) && messages.length) {
      setError(key, { type: 'server', message: messages[0] })
    }
  }

  return true
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

/** Chỉ ngày, không giờ — dùng cho cửa sổ khuyến mãi. */
export function formatDateOnly(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN')
}

/** ISO -> giá trị cho input type="datetime-local" */
export function toLocalInput(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** giá trị input type="datetime-local" -> ISO */
export function toIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Đường dẫn ảnh từ BE (`/storage/…`) -> URL đầy đủ; URL tuyệt đối giữ nguyên. */
export function imageUrl(image: string | null | undefined) {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image
  // BE đôi khi trả /storage//storage/… (duplicate); trim + normalize
  const clean = image.replace(/\/storage\/+/g, '/storage/').replace(/\/+/g, '/')
  return `${STORAGE_HOST}${clean.startsWith('/') ? '' : '/'}${clean}`
}
