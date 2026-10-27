import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
      <p className="text-5xl font-bold text-emerald-700">404</p>
      <p className="text-slate-600">Không tìm thấy trang bạn yêu cầu.</p>
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link to="/" className="text-emerald-700 underline">
          Về trang chủ
        </Link>
        <Link to="/admin" className="text-slate-600 underline">
          Trang quản trị
        </Link>
      </div>
    </div>
  )
}
