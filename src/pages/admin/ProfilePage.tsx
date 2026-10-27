import { useStaffProfile } from '../../api/queries'
import { errorMessage, formatDate } from '../../lib/client'

export function ProfilePage() {
  const profile = useStaffProfile()

  if (profile.isError) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ</h1>
        </header>
        <p className="text-sm text-rose-600">{errorMessage(profile.error)}</p>
      </div>
    )
  }

  const user = profile.data

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ</h1>
        <p className="text-sm text-slate-500">Thông tin tài khoản và hồ sơ nhân viên của bạn.</p>
      </header>

      {profile.isLoading ? <p className="text-sm text-slate-500">Đang tải…</p> : null}

      {user ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Họ tên</dt>
              <dd className="font-medium text-slate-800">{user.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-slate-800">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Nhân viên</dt>
              <dd className="font-medium text-slate-800">{user.staff?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Vai trò</dt>
              <dd className="font-medium text-slate-800">{user.staff?.role?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Cửa hàng</dt>
              <dd className="font-medium text-slate-800">{user.staff?.store?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Tạo tài khoản</dt>
              <dd className="font-medium text-slate-800">{formatDate(user.created_at)}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  )
}
