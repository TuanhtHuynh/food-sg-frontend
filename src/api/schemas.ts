import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên sản phẩm là bắt buộc').max(255, 'Tối đa 255 ký tự'),
    price: z
      .string()
      .min(1, 'Giá là bắt buộc')
      .refine((value) => /^\d+$/.test(value), 'Giá phải là số nguyên không âm')
      .refine((value) => Number(value) <= 9999999999, 'Giá tối đa 9 999 999 999'),
    category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
    sale_price: z
      .string()
      .refine((value) => value === '' || /^\d+$/.test(value), 'Giá khuyến mãi không hợp lệ'),
    sale_start_at: z.string(),
    sale_end_at: z.string(),
    slug: z.string().trim().max(255, 'Tối đa 255 ký tự'),
    meta_title: z.string().trim().max(255, 'Tối đa 255 ký tự'),
    meta_description: z.string().trim().max(1000, 'Tối đa 1000 ký tự'),
    meta_keyword: z.string().trim().max(255, 'Tối đa 255 ký tự'),
  })
  .refine(
    (values) =>
      !values.sale_start_at ||
      !values.sale_end_at ||
      new Date(values.sale_end_at) >= new Date(values.sale_start_at),
    { message: 'Thời gian kết thúc phải sau thời gian bắt đầu', path: ['sale_end_at'] },
  )

export type ProductValues = z.infer<typeof productSchema>

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục là bắt buộc').max(255, 'Tối đa 255 ký tự'),
  slug: z.string().trim().max(255, 'Tối đa 255 ký tự'),
  meta_title: z.string().trim().max(255, 'Tối đa 255 ký tự'),
  meta_description: z.string().trim().max(1000, 'Tối đa 1000 ký tự'),
  meta_keyword: z.string().trim().max(255, 'Tối đa 255 ký tự'),
})

export type CategoryValues = z.infer<typeof categorySchema>

/** Size / nguyên liệu — chỉ có tên (địa chỉ chỉ dùng cho cửa hàng). */
export const simpleSchema = z.object({
  name: z.string().trim().min(1, 'Tên là bắt buộc').max(255, 'Tối đa 255 ký tự'),
  address: z.string().trim().max(255, 'Tối đa 255 ký tự').optional(),
})

export type SimpleValues = z.infer<typeof simpleSchema>

/** Cửa hàng — tên + địa chỉ (cả hai đều bắt buộc ở API). */
export const storeSchema = z.object({
  name: z.string().trim().min(1, 'Tên là bắt buộc').max(255, 'Tối đa 255 ký tự'),
  address: z.string().trim().min(1, 'Địa chỉ là bắt buộc').max(255, 'Tối đa 255 ký tự'),
})

export type StoreValues = z.infer<typeof storeSchema>

/** Tồn kho — BE yêu cầu product_id + quantity (số nguyên >= 0). */
export const stockSchema = z.object({
  product_id: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  store_id: z.string(),
  quantity: z
    .string()
    .min(1, 'Số lượng là bắt buộc')
    .refine((value) => /^\d+$/.test(value), 'Số lượng phải là số nguyên không âm'),
  staff_id: z.string(),
})

export type StockValues = z.infer<typeof stockSchema>
