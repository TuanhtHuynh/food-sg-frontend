import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreate, useDelete, useList, useUpdate } from '../../api/queries'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { TextAreaField, TextField } from '../../components/form'
import { Button, Modal } from '../../components/ui'
import { errorMessage, formatDate, mapServerErrors } from '../../lib/client'
import { useSearch } from '../../lib/hooks'
import { categorySchema } from '../../api/schemas'
import type { CategoryValues } from '../../api/schemas'
import type { Category } from '../../api/types'

const FIELDS = ['name', 'slug', 'meta_title', 'meta_description', 'meta_keyword'] as const

function CategoryForm({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  const create = useCreate<Category>('categories')
  const update = useUpdate<Category>('categories')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      meta_title: category?.meta_title ?? '',
      meta_description: category?.meta_description ?? '',
      meta_keyword: category?.meta_keyword ?? '',
    },
  })

  const onSubmit = async (values: CategoryValues) => {
    setError('')
    const payload = {
      name: values.name,
      slug: values.slug || null,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
      meta_keyword: values.meta_keyword || null,
    }

    try {
      if (category) await update.mutateAsync({ id: category.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (err) {
      if (!mapServerErrors(err, setFieldError, [...FIELDS])) setError(errorMessage(err))
    }
  }

  return (
    <Modal
      open
      title={category ? 'Cập nhật danh mục' : 'Thêm danh mục'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          register={register}
          name="name"
          label="Tên danh mục"
          placeholder="Món chính"
          error={errors.name?.message}
        />

        <TextField
          register={register}
          name="slug"
          label="Slug (SEO)"
          placeholder="mon-chinh"
          error={errors.slug?.message}
        />

        <TextField
          register={register}
          name="meta_title"
          label="Meta title"
          error={errors.meta_title?.message}
        />

        <TextAreaField
          register={register}
          name="meta_description"
          label="Meta description"
          error={errors.meta_description?.message}
        />

        <TextField
          register={register}
          name="meta_keyword"
          label="Meta keyword"
          error={errors.meta_keyword?.message}
        />

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}

export function CategoriesPage() {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const { text, keyword, setText } = useSearch()
  const remove = useDelete('categories')
  const query = useList<Category>('categories', { q: keyword || undefined, page: page + 1 })

  const rows = useMemo(() => query.data?.data ?? [], [query.data])

  const columns = useMemo<Column<Category>[]>(
    () => [
      {
        id: 'name',
        header: 'Danh mục',
        cell: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">/{row.slug}</p>
          </div>
        ),
      },
      {
        id: 'products_count',
        header: 'Số sản phẩm',
        align: 'right',
        cell: (row) => row.products_count ?? 0,
      },
      { id: 'updated_at', header: 'Cập nhật', cell: (row) => formatDate(row.updated_at) },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh mục</h1>
          <p className="text-sm text-slate-500">Nhóm các món ăn theo danh mục</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          + Thêm danh mục
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
        onEdit={(row) => {
          setEditing(row)
          setFormOpen(true)
        }}
        onDelete={(row) => remove.mutateAsync(row.id)}
        deleteTitle="Xóa danh mục"
        deleteMessage={(row) =>
          `Xóa danh mục "${row.name}" sẽ xóa luôn toàn bộ sản phẩm thuộc danh mục đó.`
        }
        emptyText="Không có danh mục nào"
      />

      {formOpen ? (
        <CategoryForm
          key={editing?.id ?? 'new'}
          category={editing}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  )
}
