import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCategories, useProductDirectory } from '../api/queries'
import { MegaMenu } from '../components/MegaMenu'
import { SearchBox } from '../components/SearchBox'
import { Button } from '../components/ui'
import type { Product } from '../api/types'

export interface PublicContext {
  /** Cửa hàng đang xem (lọc món theo tồn kho của cửa hàng này). */
  storeId: number | ''
  setStoreId: (value: number | '') => void
}

/** Layout của trang công khai: header + mega menu danh mục + tìm kiếm + chọn cửa hàng. */
export function PublicLayout() {
  useEffect(() => { document.title = 'Food SG — Món ngon mỗi ngày' }, [])
  const [storeId, setStoreId] = useState<number | ''>('')
  const location = useLocation()

  const categories = useCategories()
  const directory = useProductDirectory()

  const productsByCategory = useMemo(() => {
    const map = new Map<number, Product[]>()
    for (const product of directory.data ?? []) {
      const list = map.get(product.category_id) ?? []
      list.push(product)
      map.set(product.category_id, list)
    }
    return map
  }, [directory.data])

  // Mega menu dùng CSS (group-hover / group-focus-within) nên không cần state.
  // Sau khi điều hướng, bỏ focus khỏi nút "Danh mục" để menu không còn mở.
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }, [location.pathname])

  return (
    <div className="min-h-svh bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        {/*
          `relative` để mega menu định vị theo cả chiều ngang.
          `items-stretch` + `py-0` để mép dưới nút "Danh mục" trùng mép trên panel
          ⇒ không có khe hở ⇒ không nhấp nháy khi rê chuột.
        */}
        <div className="relative mx-auto flex max-w-7xl items-stretch gap-4 px-4">
          <Link
            to="/"
            className="flex shrink-0 items-center py-3 text-lg font-bold text-emerald-700"
          >
            Food SG
          </Link>

          <MegaMenu
            categories={categories.data ?? []}
            productsByCategory={productsByCategory}
          />

          <div className="flex flex-1 items-center py-3">
            <SearchBox />
          </div>

          <Link to="/pages/gioi-thieu" className="my-3 hidden items-center text-sm text-slate-600 hover:text-emerald-700 sm:inline-flex">Chúng tôi</Link>

          <Link to="/login" className="my-3 flex shrink-0 items-center">
            <Button variant="secondary">Đăng nhập</Button>
          </Link>
        </div>
      </header>

      <main>
        <Outlet context={{ storeId, setStoreId } satisfies PublicContext} />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} httuan — Food SG · Món ngon mỗi ngày.</p>
          <Link to="/pages/gioi-thieu" className="hover:text-emerald-600 hover:underline">Bài giới thiệu</Link>
          <p>Cổng thông tin công khai · Quản trị tại /admin</p>
        </div>
      </footer>
    </div>
  )
}
