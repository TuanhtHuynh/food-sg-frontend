import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useGuestCategory, useGuestProducts } from '../../api/queries'
import { ProductCard } from '../../components/ProductCard'
import type { PublicContext } from '../../layouts/PublicLayout'

const PER_PAGE = 12

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { storeId } = useOutletContext<PublicContext>()
  const [page, setPage] = useState(1)

  const category = useGuestCategory(slug)
  const products = useGuestProducts({
    category: slug,
    page,
    per_page: PER_PAGE,
    store_id: storeId === '' ? undefined : storeId,
  })

  if (category.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy danh mục</h1>
        <p className="mt-2 text-sm text-slate-500">
          Danh mục “{slug}” không tồn tại hoặc đã bị xoá.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    )
  }

  const lastPage = products.data?.meta.last_page ?? 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-emerald-700">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{category.data?.name ?? '...'}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-bold text-slate-900">{category.data?.name ?? '...'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {category.data?.products_count ?? 0} món trong danh mục
          {category.data?.meta_description ? ` — ${category.data.meta_description}` : ''}
        </p>
      </header>

      {products.isError ? (
        <p className="mt-6 text-sm text-rose-600">Không tải được danh sách món.</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(products.data?.data ?? []).map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-slate-500">
                Trang {page}/{lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
