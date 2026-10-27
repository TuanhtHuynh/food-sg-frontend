import { useMemo, useState } from 'react'
import { useCategories, useProductDirectory } from '../../api/queries'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { formatDateOnly, formatMoney } from '../../lib/client'
import { useSearch } from '../../lib/hooks'
import type { Product } from '../../api/types'

const PAGE_SIZE = 15

/** Khuyến mãi đang áp dụng: có `sale_price` và (không có cửa sổ HOẶC đang nằm trong cửa sổ). */
function isPromoActive(product: Product, now: Date) {
  if (product.sale_price === null) return false
  if (!product.sale_start_at && !product.sale_end_at) return true

  if (product.sale_start_at && now < new Date(product.sale_start_at)) return false
  if (product.sale_end_at && now > new Date(product.sale_end_at)) return false

  return true
}

/** Mô tả thời gian còn lại của cửa sổ khuyến mãi so với hiện tại. */
function describeRemaining(end: string, now: Date) {
  const endDate = new Date(end)
  const days = Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000)

  if (days > 0) return `còn ${days} ngày`
  if (days === 0) return 'kết thúc hôm nay'
  return `đã quá hạn ${Math.abs(days)} ngày`
}

export function PricesPage() {
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  // Thời điểm dùng để xác định khuyến mãi đang áp dụng — cố định theo phiên render.
  const now = useMemo(() => new Date(), [])

  const { text, keyword, setText } = useSearch()
  const directory = useProductDirectory()
  const categories = useCategories()

  const filtered = useMemo(() => {
    const products = directory.data ?? []
    const term = keyword.trim().toLowerCase()

    return products.filter((product) => {
      if (categoryId && String(product.category_id) !== categoryId) return false
      if (!term) return true
      return `${product.name} ${product.slug}`.toLowerCase().includes(term)
    })
  }, [directory.data, keyword, categoryId])

  const rows = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  )

  const columns = useMemo<Column<Product>[]>(
    () => [
      {
        id: 'name',
        header: 'Sản phẩm',
        cell: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">/{row.slug}</p>
          </div>
        ),
      },
      { id: 'category', header: 'Danh mục', cell: (row) => row.category?.name ?? '—' },
      {
        id: 'price',
        header: 'Giá',
        align: 'right',
        cell: (row) => formatMoney(row.price),
      },
      {
        id: 'sale_price',
        header: 'Giá khuyến mãi',
        align: 'right',
        cell: (row) => {
          if (row.sale_price === null) return <span className="text-slate-400">—</span>
          const active = isPromoActive(row, now)
          const invalid = row.sale_price > row.price

          return (
            <div>
              <p className={`font-medium ${active ? 'text-rose-600' : 'text-slate-500 line-through'}`}>
                {formatMoney(row.sale_price)}
              </p>
              {active ? (
                <p className="text-xs text-emerald-600">Đang áp dụng</p>
              ) : null}
              {invalid ? (
                <p className="text-xs text-amber-600">Giá KM &gt; giá gốc</p>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'sale_window',
        header: 'Cửa sổ khuyến mãi',
        cell: (row) => {
          const { sale_start_at: start, sale_end_at: end, sale_price: salePrice } = row

          if (salePrice === null && !start && !end) return <span className="text-slate-400">—</span>

          const range = start && end
            ? `${formatDateOnly(start)} → ${formatDateOnly(end)}`
            : start
              ? `từ ${formatDateOnly(start)}`
              : `đến ${formatDateOnly(end)}`

          return (
            <div className="text-xs">
              <p className="font-medium text-slate-700">{range}</p>
              {salePrice === null ? (
                <p className="text-slate-400">Không có giá khuyến mãi</p>
              ) : isPromoActive(row, now) ? (
                <p className="text-emerald-600">
                  Đang áp dụng{end ? ` · ${describeRemaining(end, now)}` : ''}
                </p>
              ) : (
                <p className="text-slate-400">
                  Ngoài cửa sổ KM{end ? ` · ${describeRemaining(end, now)}` : ''}
                </p>
              )}
            </div>
          )
        },
      },
      {
        id: 'effective_price',
        header: 'Giá bán hiện hành',
        align: 'right',
        cell: (row) => (
          <span className="font-semibold text-slate-900">
            {formatMoney(isPromoActive(row, now) ? (row.sale_price ?? row.price) : row.price)}
          </span>
        ),
      },
    ],
    [now],
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng giá</h1>
          <p className="text-sm text-slate-500">
            Giá bán và khuyến mãi đang áp dụng của từng món
          </p>
        </div>
      </header>

      {directory.isError ? (
        <p className="text-sm text-rose-600">Không tải được danh sách sản phẩm.</p>
      ) : null}

      <ResourceTable
        rows={rows}
        columns={columns}
        rowCount={filtered.length}
        page={page}
        onPageChange={setPage}
        loading={directory.isLoading}
        search={text}
        onSearchChange={(value) => {
          setText(value)
          setPage(0)
        }}
        searchPlaceholder="Tìm theo tên hoặc slug…"
        filter={
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value)
              setPage(0)
            }}
            className="max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Tất cả danh mục</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        }
        showActions={false}
        emptyText="Không có sản phẩm nào"
      />
    </div>
  )
}
