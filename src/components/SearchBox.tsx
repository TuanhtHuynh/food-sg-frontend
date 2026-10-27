import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSearch } from '../api/queries'
import { useSearch } from '../lib/hooks'
import { formatMoney } from '../lib/client'
import { ProductThumb } from './ProductThumb'

/** Ô tìm kiếm công khai — gọi GET /api/search (q từ 2 ký tự trở lên). */
export function SearchBox() {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const { keyword } = useSearch(300)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)

  const search = useGuestSearch(keyword)

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const go = (path: string) => {
    setOpen(false)
    setText('')
    navigate(path)
  }

  const hasResults =
    (search.data?.products.length ?? 0) > 0 || (search.data?.categories.length ?? 0) > 0

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm món ăn…"
        className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />

      {open && keyword.length >= 2 ? (
        <div className="absolute left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {search.isFetching ? (
            <p className="px-4 py-3 text-sm text-slate-400">Đang tìm…</p>
          ) : search.isError ? (
            <p className="px-4 py-3 text-sm text-rose-600">Tìm kiếm thất bại, thử lại sau.</p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Không tìm thấy món nào cho “{keyword}”.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {search.data?.categories.length ? (
                <div className="border-b border-slate-100 p-2">
                  <p className="px-2 py-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Danh mục
                  </p>
                  {search.data.categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => go(`/categories/${category.slug}`)}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-emerald-50"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              ) : null}

              {search.data?.products.length ? (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Món ăn
                  </p>
                  {search.data.products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => go(`/products/${product.slug}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-emerald-50"
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
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
