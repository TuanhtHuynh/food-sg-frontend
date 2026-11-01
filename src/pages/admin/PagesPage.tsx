import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, X } from 'lucide-react'
import { useCreate, useDelete, useList, useUpdate } from '../../api/queries'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { TextAreaField, TextField } from '../../components/form'
import { Button, Modal } from '../../components/ui'
import { errorMessage, formatDate, mapServerErrors } from '../../lib/client'
import { useSearch } from '../../lib/hooks'
import { pageSchema } from '../../api/schemas'
import type { PageValues } from '../../api/schemas'
import type { Page } from '../../api/types'

function PageForm({ page, onClose }: { page: Page | null; onClose: () => void }) {
  const create = useCreate<Page>('pages')
  const update = useUpdate<Page>('pages')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<PageValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title ?? '',
      slug: page?.slug ?? '',
      content: page?.content ?? '',
    },
  })

  const onSubmit = async (values: PageValues) => {
    setError('')
    const payload = {
      title: values.title,
      slug: values.slug || null,
      content: values.content || null,
    }
    try {
      if (page) await update.mutateAsync({ id: page.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (err) {
      if (!mapServerErrors(err, setFieldError, ['title', 'slug', 'content'])) setError(errorMessage(err))
    }
  }

  return (
    <Modal
      open
      title={page ? 'Cập nhật trang' : 'Thêm trang'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="gap-1.5 p-1.5" aria-label="Hủy">
            <X size={16} />
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="gap-1.5 p-1.5" aria-label="Lưu">
            <Save size={16} />
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField register={register} name="title" label="Tiêu đề" error={errors.title?.message} />
        <TextField register={register} name="slug" label="Slug (SEO)" placeholder="gioi-thieu" error={errors.slug?.message} />
        <TextAreaField register={register} name="content" label="Nội dung" error={errors.content?.message} rows={6} />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}

export function PagesPage() {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Page | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const { text, keyword, setText } = useSearch()
  const remove = useDelete('pages')
  const query = useList<Page>('pages', { q: keyword || undefined, page: page + 1 })
  const rows = useMemo(() => query.data?.data ?? [], [query.data])

  const columns = useMemo<Column<Page>[]>(() => [
    { id: 'title', header: 'Tiêu đề', cell: (row) => <span className="font-medium text-slate-900">{row.title}</span> },
    { id: 'slug', header: 'Slug', cell: (row) => row.slug },
    { id: 'updated_at', header: 'Cập nhật', cell: (row) => formatDate(row.updated_at) },
  ], [])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trang nội dung</h1>
          <p className="text-sm text-slate-500">Quản lý các trang tĩnh (giới thiệu, chính sách, ...)</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }} className="gap-1.5 p-1.5" aria-label="Thêm trang">
          <Plus size={16} />
        </Button>
      </header>

      {query.isError ? <p className="text-sm text-rose-600">{errorMessage(query.error)}</p> : null}

      <ResourceTable
        rows={rows}
        columns={columns}
        rowCount={query.data?.meta.total ?? 0}
        page={page}
        onPageChange={setPage}
        loading={query.isLoading}
        search={text}
        onSearchChange={setText}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug..."
        onEdit={(row) => { setEditing(row); setFormOpen(true) }}
        onDelete={(row) => remove.mutateAsync(row.id)}
        deleteTitle="Xóa trang"
        deleteMessage={(row) => `Bạn có chắc muốn xóa trang "${row.title}"?`}
        emptyText="Không có trang nào"
      />

      {formOpen ? <PageForm page={editing} onClose={() => setFormOpen(false)} /> : null}
    </div>
  )
}
