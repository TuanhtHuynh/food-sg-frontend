import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/client'
import { ProductThumb } from './ProductThumb'
import type { Category, Product } from '../api/types'

interface MegaMenuProps {
  categories: Category[]
  /** Sản phẩm đã gom theo category_id — dùng để hiện món nổi bật của từng danh mục. */
  productsByCategory: Map<number, Product[]>
}

const MAX_ITEMS = 6

/**
 * Mega menu danh mục (trang công khai) — **không dùng state**, hoàn toàn bằng CSS:
 *
 * - `group` đặt trên wrapper chứa cả nút lẫn panel ⇒ chuột rời nút nhưng còn ở
 *   trong panel thì menu vẫn mở (panel là con của group).
 * - Mở bằng `group-hover:` (chuột) hoặc `group-focus-within:` (bấm/nút bàn phím).
 * - Panel định vị `absolute inset-x-0 top-full` so với header container
 *   (`relative`) nên trải hết bề ngang, không tràn ra ngoài màn hình.
 * - Wrapper `static` + header `py-0` + nút `items-stretch` ⇒ mép dưới của nút trùng
 *   mép trên của panel ⇒ không có khe hở, không nhấp nháy khi rê chuột.
 * - CSS không ép được trạng thái :hover tắt, nên sau khi bấm 1 link dùng state
 *   `dismissed` để ẩn panel ngay (bỏ `!invisible !opacity-0` khi rời chuột khỏi
 *   trigger ⇒ rê lại là mở tiếp).
 */
export function MegaMenu({ categories, productsByCategory }: MegaMenuProps) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <div
      className="group static flex items-stretch"
      onMouseLeave={() => setDismissed(false)}
    >
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-3 py-3 text-sm font-medium text-slate-700 transition group-hover:bg-emerald-50 group-hover:text-emerald-700 group-focus-visible:bg-emerald-50 group-focus-visible:text-emerald-700 group-focus-visible:outline-none"
      >
        Danh mục
        <span className="text-xs transition group-hover:rotate-180 group-focus-visible:rotate-180">
          ▾
        </span>
      </button>

      <div
        className={`invisible absolute inset-x-0 top-full z-50 opacity-0 transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
          dismissed ? 'invisible! opacity-0!' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl border-t border-slate-200 bg-white px-4 py-6 shadow-xl">
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Chưa có danh mục nào.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => {
                const products = productsByCategory.get(category.id) ?? []

                return (
                  <section key={category.id}>
                    <Link
                      to={`/categories/${category.slug}`}
                      onClick={() => setDismissed(true)}
                      className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-2"
                    >
                      <span className="font-semibold text-slate-900 hover:text-emerald-700">
                        {category.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {category.products_count ?? products.length} món
                      </span>
                    </Link>

                    <ul className="mt-2 space-y-1">
                      {products.slice(0, MAX_ITEMS).map((product) => (
                        <li key={product.id}>
                          <Link
                            to={`/products/${product.slug}`}
                            onClick={() => setDismissed(true)}
                            className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <ProductThumb
                                image={product.image}
                                name={product.name}
                                className="h-8 w-8 shrink-0 rounded"
                              />
                              <span className="truncate">{product.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatMoney(
                                product.sale_price !== null ? product.sale_price : product.price,
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}

                      {products.length === 0 ? (
                        <li className="px-2 py-1 text-sm text-slate-400">Chưa có món nào</li>
                      ) : null}
                    </ul>

                    {products.length > MAX_ITEMS ? (
                      <Link
                        to={`/categories/${category.slug}`}
                        onClick={() => setDismissed(true)}
                        className="mt-2 inline-block px-2 text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Xem tất cả {products.length} món →
                      </Link>
                    ) : null}
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
