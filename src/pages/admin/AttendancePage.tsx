import { useState } from 'react'
import { useClockIn, useClockOut, useMySalary, useStores } from '../../api/queries'
import { useAuth } from '../../auth/context'
import { Button } from '../../components/ui'
import { errorMessage, formatDate } from '../../lib/client'
import type { ClockEntry } from '../../api/types'

function EntryLine({ entry }: { entry: ClockEntry }) {
  return (
    <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      Ca #{entry.id} · Vào {formatDate(entry.clock_in)} ·{' '}
      {entry.clock_out ? <>Ra {formatDate(entry.clock_out)}</> : 'Đang làm việc'}
    </p>
  )
}

export function AttendancePage() {
  const { user } = useAuth()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()
  const salary = useMySalary()
  const stores = useStores()
  const [lastEntry, setLastEntry] = useState<ClockEntry | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const storeName = (storeId: number | null) =>
    (stores.data ?? []).find((store) => store.id === storeId)?.name ?? (storeId ? `#${storeId}` : '—')

  const runClockIn = async () => {
    setMessage('')
    setError('')
    try {
      setLastEntry(await clockInMutation.mutateAsync())
      setMessage('Đã chấm công vào ca.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const runClockOut = async () => {
    setMessage('')
    setError('')
    try {
      const entry = await clockOutMutation.mutateAsync()
      setLastEntry(entry)
      setMessage('Đã chấm công ra ca.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const pending = clockInMutation.isPending || clockOutMutation.isPending

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Chấm công</h1>
        <p className="text-sm text-slate-500">
          {user?.staff?.store?.name ?? '—'} · giờ làm tính từ ca chấm công thực tế
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Vào ca</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ghi nhận giờ bắt đầu làm việc. Không chấm công vào ⇒ ca không tính giờ.
          </p>
          <Button className="mt-4 w-full" onClick={runClockIn} disabled={pending}>
            Chấm công vào
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Ra ca</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kết thúc ca đang mở. Nếu không có ca nào đang mở, server trả lỗi tương ứng.
          </p>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={runClockOut}
            disabled={pending}
          >
            Chấm công ra
          </Button>
        </div>
      </div>

      {lastEntry ? <EntryLine entry={lastEntry} /> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Lương theo giờ</h2>
        {salary.isError ? (
          <p className="mt-2 text-sm text-rose-600">{errorMessage(salary.error)}</p>
        ) : (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Tổng giờ làm (làm tròn)</dt>
              <dd className="text-2xl font-bold text-slate-900">
                {salary.data ? salary.data.total_hours : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Cửa hàng</dt>
              <dd className="font-medium text-slate-800">
                {salary.data ? storeName(salary.data.store_id) : '—'}
              </dd>
            </div>
          </dl>
        )}
        {salary.data?.note ? <p className="mt-3 text-xs text-slate-400">{salary.data.note}</p> : null}
      </section>
    </div>
  )
}
