import { useMemo, useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useCategories, useGuestProducts, useProductDirectory, useBanners } from '../../api/queries'
import { imageUrl } from '../../lib/client'
import { ProductCard } from '../../components/ProductCard'
import type { PublicContext } from '../../layouts/PublicLayout'
import type { Product } from '../../api/types'

export function HomePage() {
  const { storeId } = useOutletContext<PublicContext>()
  const categories = useCategories()
  const directory = useProductDirectory()

  const products = useGuestProducts({
    page: 1,
    per_page: 12,
    store_id: storeId === '' ? undefined : storeId,
  })

  const featured = useMemo(() => {
    const list = products.data?.data ?? []
    return list
  }, [products.data])

  const hotProducts = useMemo(() => {
    const list = directory.data ?? []
    const now = new Date()
    return list.filter((product) => {
      if (product.sale_price === null) return false
      const start = product.sale_start_at ? new Date(product.sale_start_at) : null
      const end = product.sale_end_at ? new Date(product.sale_end_at) : null
      if (start && now < start) return false
      if (end && now > end) return false
      return true
    }).slice(0, 4)
  }, [directory.data])

  const banners = useBanners()
  const [bannerIndex, setBannerIndex] = useState(0)
  const bannerList = useMemo(() => {
    const d = banners.data
    if (!d || !Array.isArray(d)) return []
    return (d as { id: number; image: string; title?: string; link_url?: string; sort_order: number }[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [banners.data])
  useEffect(() => {
    if (bannerList.length <= 1) return
    const t = setInterval(() => setBannerIndex((prev) => (prev + 1) % bannerList.length), 5000)
    return () => clearInterval(t)
  }, [bannerList.length])

  return (
    <div>
      {bannerList.length > 0 ? (
        <section className="w-full">
          <div className="relative overflow-hidden shadow-lg h-[28rem] md:h-[32rem]">
            <a href={String(bannerList[bannerIndex]?.link_url ?? '#')} className="block h-full w-full">
              <img key={bannerIndex} src={imageUrl(bannerList[bannerIndex]?.image) ?? undefined} alt={String(bannerList[bannerIndex]?.title ?? 'Banner')} className="h-full w-full object-cover transition-opacity duration-700 ease-in-out" />
            </a>
            <div className="absolute bottom-4 left-4 flex gap-2">
              {bannerList.map((_, idx: number) => (
                <button key={idx} onClick={() => setBannerIndex(idx)} aria-label={`Slide ${idx + 1}`} className={`h-2.5 rounded-full transition-all ${idx === bannerIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/60'} `} />
              ))}
            </div>
          </div>
        </section>
      ) : null}


      <section id="categories" className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900">Danh mục món ăn</h2>
        <p className="mt-1 text-sm text-slate-500">
          {categories.data?.length ?? 0} danh mục · nhấn vào danh mục để xem toàn bộ món.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(categories.data ?? []).map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {category.products_count ?? 0} món
                </p>
              </div>
              <span className="text-slate-300 group-hover:text-emerald-500">→</span>
            </Link>
          ))}
        </div>
      </section>

      {hotProducts.length > 0 ? (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-xl font-bold text-slate-900">Đang khuyến mãi</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="menu" className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900">Menu hôm nay</h2>
        <p className="mt-1 text-sm text-slate-500">
          {storeId === ''
            ? 'Tất cả món đang có trong menu.'
            : 'Các món đang có tồn tại cửa hàng đã chọn.'}
        </p>

        {products.isError ? (
          <p className="mt-4 text-sm text-rose-600">Không tải được menu, vui lòng thử lại.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products.data && products.data.meta.total > 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            Tổng {products.data.meta.total} món · xem theo danh mục ở thanh{" "}
            <span className="font-medium text-emerald-700">Danh mục</span> phía trên.
          </p>
        ) : null}
      </section>
    </div>
  )
}
