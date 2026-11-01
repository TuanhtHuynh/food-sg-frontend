import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/context'
import { Button } from '../components/ui'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const adminLinks: NavItem[] = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/categories', label: 'Danh mục' },
  { to: '/admin/sizes', label: 'Size' },
  { to: '/admin/ingredients', label: 'Nguyên liệu' },
  { to: '/admin/stores', label: 'Cửa hàng' },
]

/** Mọi nhân viên (bao gồm admin) đều dùng được: chấm công, bảng giá, kho, nhân viên. */
const staffLinks: NavItem[] = [
  { to: '/admin/attendance', label: 'Chấm công' },
  { to: '/admin/prices', label: 'Bảng giá' },
  { to: '/admin/stock', label: 'Kho' },
  { to: '/admin/staff', label: 'Nhân viên' },
]

/** warehouse/sales: BE chỉ cho warehouse/sales gọi /staff/profile. */
const workerLinks: NavItem[] = [{ to: '/admin/profile', label: 'Hồ sơ' }]

export function AdminLayout() {
  useEffect(() => { document.title = 'Food SG Admin' }, [])
  const { user, signOut, isAdmin, canReadStock } = useAuth()
  const navigate = useNavigate()

  const links = isAdmin
    ? [...adminLinks, ...staffLinks]
    : canReadStock
      ? [...staffLinks, ...workerLinks]
      : []

  return (
    <div className="min-h-svh bg-slate-100 lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="text-lg font-bold text-emerald-700">Food SG</p>
          <p className="text-xs text-slate-400">Trang quản trị</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {user?.staff?.role?.name ?? '—'}
            {user?.staff?.store ? ` · ${user.staff.store.name}` : ''}
          </p>
          <Button
            variant="secondary"
            className="mt-3 w-full gap-2"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            <LogOut size={16} /> Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <p className="font-bold text-emerald-700">Food SG</p>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            <LogOut size={16} /> Đăng xuất
          </Button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
