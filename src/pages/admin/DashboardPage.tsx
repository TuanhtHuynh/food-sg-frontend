import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context'
import { useList } from '../../api/queries'
import { errorMessage } from '../../lib/client'

const stats = [
  { resource: 'products', label: 'Sản phẩm', to: '/admin/products' },
  { resource: 'categories', label: 'Danh mục', to: '/admin/categories' },
  { resource: 'sizes', label: 'Size', to: '/admin/sizes' },
  { resource: 'ingredients', label: 'Nguyên liệu', to: '/admin/ingredients' },
  { resource: 'stores', label: 'Cửa hàng', to: '/admin/stores' },
] as const

export function DashboardPage() {
  const { user } = useAuth()
  const products = useList('products', { page: 1 })
  const categories = useList('categories', { page: 1 })
  const sizes = useList('sizes', { page: 1 })
  const ingredients = useList('ingredients', { page: 1 })
  const stores = useList('stores', { page: 1 })

  const totals = {
    products: products.data?.meta.total ?? 0,
    categories: categories.data?.meta.total ?? 0,
    sizes: sizes.data?.meta.total ?? 0,
    ingredients: ingredients.data?.meta.total ?? 0,
    stores: stores.data?.meta.total ?? 0,
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="text-sm text-slate-500">Xin chào {user?.name ?? 'admin'}</p>
      </header>

      {products.isError ? (
        <p className="text-sm text-rose-600">{errorMessage(products.error)}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.resource}
            to={stat.to}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totals[stat.resource]}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Tài khoản</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Họ tên</dt>
            <dd className="font-medium text-slate-800">{user?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium text-slate-800">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Vai trò</dt>
            <dd className="font-medium text-slate-800">{user?.staff?.role?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Cửa hàng</dt>
            <dd className="font-medium text-slate-800">{user?.staff?.store?.name ?? '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
