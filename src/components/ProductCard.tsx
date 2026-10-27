import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/client'
import { ProductThumb } from './ProductThumb'
import type { Product } from '../api/types'

interface ProductCardProps {
  product: Product
  /** Hiện tên danh mục (danh mục guest không luôn có products trong response). */
  showCategory?: boolean
}

export function ProductCard({ product, showCategory = true }: ProductCardProps) {
  const now = new Date()
  const hasSale = product.sale_price !== null
  const saleActive = hasSale && (
    (!product.sale_start_at || now >= new Date(product.sale_start_at)) &&
    (!product.sale_end_at || now <= new Date(product.sale_end_at))
  )
  const onSale = saleActive

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
    >
      <ProductThumb image={product.image} name={product.name} className="h-32 w-full" />

      <div className="flex flex-1 flex-col gap-1 p-4">
        {showCategory && product.category ? (
          <p className="text-xs text-slate-400">{product.category.name}</p>
        ) : null}

        <h3 className="line-clamp-2 font-medium text-slate-900 group-hover:text-emerald-700">
          {product.name}
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {onSale ? (
            <>
              <span className="font-semibold text-rose-600">{formatMoney(product.sale_price)}</span>
              <span className="text-sm text-slate-400 line-through">
                {formatMoney(product.price)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-slate-900">{formatMoney(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
