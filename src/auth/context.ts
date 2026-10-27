import { createContext, useContext } from 'react'
import type { RoleSlug, User } from '../api/types'

export interface AuthValue {
  user: User | null
  loading: boolean
  /** Slug vai trò: admin | warehouse | sales (null nếu user chưa có hồ sơ nhân viên). */
  role: RoleSlug | null
  isAdmin: boolean
  /** Được CRUD master data (sản phẩm, danh mục, size, nguyên liệu, cửa hàng). */
  canManageCatalog: boolean
  /** Được xem tồn kho (mọi nhân viên, phạm vi cửa hàng của họ). */
  canReadStock: boolean
  /** Được ghi tồn kho (quản trị + quản kho; bán hàng chỉ đọc). */
  canWriteStock: boolean
  /** Cửa hàng của nhân viên — phạm vi quyền kho. */
  storeId: number | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải nằm trong <AuthProvider>')
  return context
}
