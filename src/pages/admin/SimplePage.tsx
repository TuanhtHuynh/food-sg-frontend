import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resource } from '../../api/queries'
import { useCreate, useDelete, useList, useUpdate } from '../../api/queries'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { TextField } from '../../components/form'
import { Button, Modal } from '../../components/ui'
import { errorMessage, formatDate, mapServerErrors } from '../../lib/client'
import { useSearch } from '../../lib/hooks'
import { simpleSchema, storeSchema } from '../../api/schemas'
import type { SimpleValues } from '../../api/schemas'

interface Row {
  id: number
  name: string
  address?: string
  updated_at: string
}

interface Config {
  resource: Resource
  title: string
  description: string
  itemLabel: string
  withAddress?: boolean
  deleteWarning?: string
}

function SimpleForm({
  config,
  item,
  onClose,
}: {
  config: Config
  item: Row | null
  onClose: () => void
}) {
  const create = useCreate<Row>(config.resource)
  const update = useUpdate<Row>(config.resource)
  const [error, setError] = useState('')

  // Cửa hàng bắt buộc có địa chỉ; size / nguyên liệu thì không.
  const resolver = (
    config.withAddress ? zodResolver(storeSchema) : zodResolver(simpleSchema)
  ) as unknown as Resolver<SimpleValues>

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<SimpleValues>({
    resolver,
    defaultValues: {
      name: item?.name ?? '',
      address: item?.address ?? '',
    },
  })

  const onSubmit = async (values: SimpleValues) => {
    setError('')
    const payload = config.withAddress
      ? { name: values.name, address: values.address ?? '' }
      : { name: values.name }

    try {
      if (item) await update.mutateAsync({ id: item.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (err) {
      if (!mapServerErrors(err, setFieldError, ['name', 'address'])) setError(errorMessage(err))
    }
  }

  return (
    <Modal
      open
      title={item ? `Cập nhật ${config.itemLabel}` : `Thêm ${config.itemLabel}`}
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
          label="Tên"
          error={errors.name?.message}
        />

        {config.withAddress ? (
          <TextField
            register={register}
            name="address"
            label="Địa chỉ"
            error={errors.address?.message}
          />
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}

export function SimplePage({ config }: { config: Config }) {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Row | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const { text, keyword, setText } = useSearch()
  const remove = useDelete(config.resource)
  const query = useList<Row>(config.resource, { q: keyword || undefined, page: page + 1 })

  const rows = useMemo(() => query.data?.data ?? [], [query.data])

  const columns = useMemo<Column<Row>[]>(() => {
    const list: Column<Row>[] = [
      {
        id: 'name',
        header: 'Tên',
        cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
      },
    ]

    if (config.withAddress) {
      list.push({ id: 'address', header: 'Địa chỉ', cell: (row) => row.address ?? '—' })
    }

    list.push({ id: 'updated_at', header: 'Cập nhật', cell: (row) => formatDate(row.updated_at) })

    return list
  }, [config.withAddress])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          + Thêm {config.itemLabel}
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
        deleteTitle={`Xóa ${config.itemLabel}`}
        deleteMessage={(row) =>
          config.deleteWarning ?? `Bạn có chắc muốn xóa "${row.name}"?`
        }
        emptyText={`Không có ${config.itemLabel} nào`}
      />

      {formOpen ? (
        <SimpleForm
          key={editing?.id ?? 'new'}
          config={config}
          item={editing}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  )
}

export function SizesPage() {
  return (
    <SimplePage
      config={{
        resource: 'sizes',
        title: 'Size',
        description: 'Các kích cỡ phục vụ của món ăn',
        itemLabel: 'size',
        deleteWarning: 'Xóa size sẽ xóa luôn liên kết của size với các sản phẩm.',
      }}
    />
  )
}

export function IngredientsPage() {
  return (
    <SimplePage
      config={{
        resource: 'ingredients',
        title: 'Nguyên liệu',
        description: 'Nguyên liệu dùng để chế biến món ăn',
        itemLabel: 'nguyên liệu',
        deleteWarning: 'Xóa nguyên liệu sẽ xóa luôn liên kết với các sản phẩm.',
      }}
    />
  )
}

export function StoresPage() {
  return (
    <SimplePage
      config={{
        resource: 'stores',
        title: 'Cửa hàng',
        description: 'Các cửa hàng thuộc chuỗi Food SG',
        itemLabel: 'cửa hàng',
        withAddress: true,
        deleteWarning: 'Xóa cửa hàng sẽ xóa luôn nhân viên thuộc cửa hàng đó.',
      }}
    />
  )
}
