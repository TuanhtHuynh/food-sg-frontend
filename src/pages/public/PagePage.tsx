import { useParams } from 'react-router-dom'
import { useGuestPage } from '../../api/queries'

export function PagePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useGuestPage(slug ?? '')
  if (isLoading) return <p className="p-8 text-sm text-slate-500">Đang tải…</p>
  if (isError || !data) return <p className="p-8 text-sm text-rose-600">Không tìm thấy trang.</p>
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">{data.title}</h1>
      <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  )
}
