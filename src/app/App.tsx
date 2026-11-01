import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider } from '../auth/provider'
import { useAuth } from '../auth/context'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { CategoryPage } from '../pages/public/CategoryPage'
import { HomePage } from '../pages/public/HomePage'
import { PagePage } from '../pages/public/PagePage'
import { ProductPage } from '../pages/public/ProductPage'
import { CategoriesPage } from '../pages/admin/CategoriesPage'
import { AttendancePage } from '../pages/admin/AttendancePage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { PricesPage } from '../pages/admin/PricesPage'
import { ProductsPage } from '../pages/admin/ProductsPage'
import { ProfilePage } from '../pages/admin/ProfilePage'
import { StaffPage } from '../pages/admin/StaffPage'
import { StockPage } from '../pages/admin/StockPage'
import { PagesPage } from '../pages/admin/PagesPage'
import { BannersPage } from '../pages/admin/BannersPage'
import { IngredientsPage, SizesPage, StoresPage } from '../pages/admin/SimplePage'

/** Chỉ nhân viên có hồ sơ + vai trò hợp lệ mới vào được trang quản trị. */
function RequireStaff() {
  const { user, loading, role } = useAuth()
  const location = useLocation()

  if (loading) return <p className="p-8 text-sm text-slate-500">Đang tải…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!role) {
    return (
      <p className="p-8 text-sm text-rose-600">
        {user.staff
          ? `Vai trò "${user.staff.role?.name ?? user.staff.role?.slug}" chưa được hỗ trợ trên hệ thống.`
          : 'Tài khoản chưa được gắn hồ sơ nhân viên nên không có quyền truy cập.'}
      </p>
    )
  }

  return <AdminLayout />
}

/** Các màn hình master data chỉ dành cho quản trị (role admin). */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <p className="p-8 text-sm text-rose-600">Bạn không có quyền thực hiện thao tác này.</p>
  }

  return <>{children}</>
}

/** Hồ sơ nhân viên: BE chỉ trả 200 cho warehouse/sales (middleware role:warehouse,sales). */
function RequireWorker({ children }: { children: ReactNode }) {
  const { role } = useAuth()

  if (role !== 'warehouse' && role !== 'sales') {
    return <p className="p-8 text-sm text-rose-600">Trang hồ sơ chỉ dành cho nhân viên kho và bán hàng.</p>
  }

  return <>{children}</>
}

function AdminIndex() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/admin/stock" replace />

  return <DashboardPage />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Trang công khai (guest) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/pages/:slug" element={<PagePage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<RequireStaff />}>
            <Route index element={<AdminIndex />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="prices" element={<PricesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route
              path="profile"
              element={
                <RequireWorker>
                  <ProfilePage />
                </RequireWorker>
              }
            />
            <Route
              path="products"
              element={
                <RequireAdmin>
                  <ProductsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="categories"
              element={
                <RequireAdmin>
                  <CategoriesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="sizes"
              element={
                <RequireAdmin>
                  <SizesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="ingredients"
              element={
                <RequireAdmin>
                  <IngredientsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="stores"
              element={
                <RequireAdmin>
                  <StoresPage />
                </RequireAdmin>
              }
            />
            <Route
              path="pages"
              element={
                <RequireAdmin>
                  <PagesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="banners"
              element={
                <RequireAdmin>
                  <BannersPage />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
