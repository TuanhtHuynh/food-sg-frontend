import { Link, useParams } from 'react-router-dom'
import { useGuestProduct, useStores } from '../../api/queries'
import { formatDateOnly, formatMoney } from '../../lib/client'
import { ProductThumb } from '../../components/ProductThumb'

export function ProductPage() {
  const { slug = '' } = useParams()
  const product = useGuestProduct(slug)
  const stores = useStores()

  if (product.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy sản phẩm</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sản phẩm “{slug}” không tồn tại hoặc đã bị xoá.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    )
  }

  const data = product.data
  const now = new Date()
  const onSale = data?.sale_price !== null && data?.sale_price !== undefined && (
    (!data?.sale_start_at || now >= new Date(data.sale_start_at)) &&
    (!data?.sale_end_at || now <= new Date(data.sale_end_at))
  )
  const stocks = data?.stocks ?? []
  const storeNames = new Map((stores.data ?? []).map((store) => [store.id, store.name]))

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-emerald-700">
          Trang chủ
        </Link>
        {data?.category ? (
          <>
            <span className="mx-2">/</span>
            <Link to={`/categories/${data.category.slug}`} className="hover:text-emerald-700">
              {data.category.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-slate-700">{data?.name ?? '...'}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <ProductThumb
          image={data?.image}
          name={data?.name ?? ''}
          className="h-96 w-full rounded-2xl"
        />

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data?.name ?? '...'}</h1>
          {data?.meta_description ? (
            <p className="mt-2 text-sm text-slate-600">{data.meta_description}</p>
          ) : null}

          <div className="mt-4 flex items-baseline gap-3">
            {onSale ? (
              <>
                <span className="text-2xl font-bold text-rose-600">
                  {formatMoney(data?.sale_price)}
                </span>
                <span className="text-lg text-slate-400 line-through">
                  {formatMoney(data?.price)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-slate-900">
                {formatMoney(data?.price)}
              </span>
            )}
          </div>

          {onSale ? (
            <p className="mt-2 text-sm text-slate-500">
              Khuyến mãi: {formatDateOnly(data?.sale_start_at)} →{' '}
              {formatDateOnly(data?.sale_end_at)}
            </p>
          ) : null}

          {data?.sizes?.length ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900">Khẩu phần</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.sizes.map((size) => (
                  <li
                    key={size.id}
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600"
                  >
                    {size.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data?.ingredients?.length ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900">Nguyên liệu</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                  >
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">Tồn kho theo cửa hàng</h2>
            {stocks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{data?.description ?? 'Chưa có mô tả sản phẩm.'}</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {stocks.map((stock) => (
                  <li
                    key={stock.id}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="text-slate-700">
                      {stock.store?.name ?? storeNames.get(stock.store_id ?? 0) ?? 'Cửa hàng'}
                    </span>
                    <span className="font-medium text-slate-900">
                      {stock.quantity > 0 ? `${stock.quantity} phần` : 'Hết hàng'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
