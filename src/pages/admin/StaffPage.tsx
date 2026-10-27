import { useMemo, useState } from 'react'
import { useStaffDirectory, useClockIn, useClockOut } from '../../api/queries'
import { errorMessage, formatDate } from '../../lib/client'

const columns = [
  { id: 'name', header: 'Nhân viên' },
  { id: 'account', header: 'Tài khoản' },
  { id: 'store', header: 'Cửa hàng' },
  { id: 'role', header: 'Vai trò' },
  { id: 'updated_at', header: 'Cập nhật' },
  { id: 'action', header: 'Thao tác' },
] as const

export function StaffPage() {
  const staff = useStaffDirectory()
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const rows = useMemo(() => staff.data ?? [], [staff.data])
  const selected = useMemo(() => rows.find((r: any) => r.id === selectedId) ?? null, [rows, selectedId])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
          <p className="text-sm text-slate-500">
            Staff theo docs-fe/ Oct 24 · role từ <code>user.staff.role.slug</code> · lưu token <code>food-sg-admin-token</code>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Đóng' : 'Thêm nhân viên'}
        </button>
      </header>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Form thêm/sửa staff (theo MODEL.md)</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Tên nhân viên" />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="store_id (phạm vi cửa hàng)" />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="role_id (admin/warehouse/sales)" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">Lưu (POST/PUT backend)</button>
            <button onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Huỷ</button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Lưu ý: manager chỉ thao tác staff cùng store; admin toàn hệ thống (PERMISS.md / API_ROUTES.md).</p>
        </div>
      )}

      {staff.isError ? <p className="text-sm text-rose-600">{errorMessage(staff.error)}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.id} className="px-4 py-3 font-medium">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((person: any) => (
              <tr key={person.id} className={selectedId === person.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}>
                <td className="px-4 py-3 font-medium text-slate-900">{person.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {person.user ? `${person.user.name} · ${person.user.email}` : 'Chưa có tài khoản'}
                </td>
                <td className="px-4 py-3 text-slate-600">{person.store?.name ?? (person.store_id ? `#${person.store_id}` : '—')}</td>
                <td className="px-4 py-3 text-slate-600">{person.role?.slug ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(person.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedId(person.id)} className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">Chọn</button>
                    <button onClick={() => { setSelectedId(person.id); setShowForm(true); }} className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">Sửa / Gán role</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.isLoading ? <p className="px-4 py-4 text-sm text-slate-500">Đang tải…</p> : null}
        {!staff.isLoading && rows.length === 0 ? <p className="px-4 py-4 text-sm text-slate-500">Chưa có nhân viên nào.</p> : null}
      </div>

      {selected && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Thông tin staff (# {selected.id})</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Tên</dt><dd className="font-medium text-slate-900">{selected.name}</dd></div>
              <div><dt className="text-slate-500">Tài khoản</dt><dd className="font-medium text-slate-900">{selected.user ? `${selected.user.name} (${selected.user.email})` : 'Chưa liên kết'}</dd></div>
              <div><dt className="text-slate-500">Vai trò</dt><dd className="font-medium text-slate-900">{selected.role?.slug ?? '—'} ({selected.role?.name ?? '—'})</dd></div>
              <div><dt className="text-slate-500">Cửa hàng / scope</dt><dd className="font-medium text-slate-900">{selected.store?.name ?? `#${selected.store_id}`}</dd></div>
              <div><dt className="text-slate-500">Role slug (RULE.md R2)</dt><dd className="font-medium text-slate-900">{selected.role?.slug ?? 'null'}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Chấm công (Attendance)</h3>
            <p className="mb-3 text-xs text-slate-500">Endpoint: POST /attendance/clock-in (201), POST /attendance/clock-out (200). Staff_id từ selected.</p>
            <div className="flex gap-2">
              <button onClick={() => clockIn.mutate()} disabled={clockIn.isPending} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Clock In</button>
              <button onClick={() => clockOut.mutate()} disabled={clockOut.isPending} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">Clock Out</button>
            </div>
            {clockIn.isSuccess && <p className="mt-2 text-xs text-emerald-600">Chấm công vào thành công.</p>}
            {clockOut.isSuccess && <p className="mt-2 text-xs text-emerald-600">Chấm công ra thành công.</p>}
            {clockIn.isError && <p className="mt-2 text-xs text-rose-600">Lỗi clock-in.</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Lương / Ca làm</h3>
            <p className="mb-3 text-xs text-slate-500">{'GET /attendance/salary (chính mình) · PUT /attendance/staff/{staffId}/hourly-rate (manager/admin cùng store).'}</p>
            <div className="flex gap-2">
              <a href="/admin/attendance" className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-900">Xem Attendance</a>
            </div>
            <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
              Lưu ý: Staff không có user → chưa thể đăng nhập. Gán user qua backend / liên kết tài khoản.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
