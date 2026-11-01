import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loginRequest, logoutRequest, meRequest } from '../api/queries'
import { AuthContext } from './context'
import type { AuthValue } from './context'
import { UNAUTHORIZED_EVENT, setToken, clearToken } from '../lib/client'
import { STAFF_ROLE_SLUGS } from '../api/types'
import type { RoleSlug, User } from '../api/types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    meRequest()
      .then((current) => active && setUser(current))
      .catch(() => {
        if (!active) return
        setUser(null)
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  // Token hết hạn (401) => buộc đăng xuất, không giữ màn hình "đã đăng nhập".
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setLoading(false)
      clearToken()
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const value = useMemo<AuthValue>(() => {
    const rawRole = user?.staff?.role?.slug
    const role = STAFF_ROLE_SLUGS.includes(rawRole as RoleSlug) ? (rawRole as RoleSlug) : null

    return {
      user,
      loading,
      role,
      isAdmin: role === 'admin',
      canManageCatalog: role === 'admin',
      canReadStock: role !== null,
      canWriteStock: role === 'admin' || role === 'warehouse',
      storeId: user?.staff?.store_id ?? null,
      signIn: async (email, password) => {
        const response = await loginRequest(email, password)
        setToken(response.token)
        setUser(response.user)
      },
      signOut: async () => {
        try {
          await logoutRequest()
        } catch {
          // token hết hạn hoặc mạng lỗi — vẫn đăng xuất phía client
        }
        setUser(null)
        clearToken()
      },
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
