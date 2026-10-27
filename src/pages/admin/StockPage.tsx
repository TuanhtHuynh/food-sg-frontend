import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateStock,
  useDeleteStock,
  useProductDirectory,
  useStaffDirectory,
  useStockList,
  useStores,
  useUpdateStock,
} from '../../api/queries'
import { useAuth } from '../../auth/context'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { TextField } from '../../components/form'
import { Button, Modal } from '../../components/ui'
import { useSearch } from '../../lib/hooks'
import { errorMessage, formatDate, mapServerErrors } from '../../lib/client'
import { stockSchema } from '../../api/schemas'
import type { StockValues } from '../../api/schemas'
import type { Stock } from '../../api/types'

function StockForm({ stock, onClose }: { stock: Stock | null; onClose: () => void }) {
  const { isAdmin } = useAuth()
  const directory = useProductDirectory()
  const stores = useStores()
  const staff = useStaffDirectory()
  const create = useCreateStock()
  const update = useUpdateStock()
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<StockValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      product_id: stock ? String(stock.product_id) : '',
      store_id: stock?.store_id ? String(stock.store_id) : '',
      quantity: stock ? String(stock.quantity) : '',
      staff_id: stock?.staff_id ? String(stock.staff_id) : '',
    },
  })

  // Nhân viên được gán phụ trách phải thuộc đúng cửa hàng của bản ghi kho — BE 422 nếu sai cặp.
  const staffOptions = useMemo(
    () =>
      (staff.data ?? [])
        .filter((person) => stock?.store_id === undefined || stock.store_id === null || person.store_id === stock.store_id)
        .map((person) => ({
          value: String(person.id),
          label: stock ? person.name : `${person.name} (${person.store?.name ?? `#${person.store_id ?? '?'}`})`,
        })),
    [staff.data, stock],
  )

  const productOptions = useMemo(() => {
    const products = directory.data ?? []
    const filtered = keyword.trim()
      ? products.filter((product) =>
          `${product.name} ${product.slug}`.toLowerCase().includes(keyword.trim().toLowerCase()),
        )
      : products

    return filtered.map((product) => ({ value: String(product.id), label: product.name }))
  }, [directory.data, keyword])

  const onSubmit = async (values: StockValues) => {
    setError('')

    const payload = {
      product_id: Number(values.product_id),
      quantity: Number(values.quantity),
      ...(isAdmin && values.store_id ? { store_id: Number(values.store_id) } : {}),
      ...(isAdmin && values.staff_id ? { staff_id: Number(values.staff_id) } : {}),
    }

    try {
      if (stock) {
        await update.mutateAsync({
          id: stock.id,
          payload: {
            quantity: payload.quantity,
            // BE giữ staff_id cũ khi không gửi — gửi mới chỉ khi admin chọn nhân viên khác
            ...(isAdmin && values.staff_id ? { staff_id: Number(values.staff_id) } : {}),
          },
        })
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      if (!mapServerErrors(err, setFieldError, ['product_id', 'store_id', 'quantity', 'staff_id'])) {
        setError(errorMessage(err))
      }
    }
  }

  const ownStoreName = useAuth().user?.staff?.store?.name ?? 'cửa hàng của bạn'

  return (
    <Modal
      open
      title={stock ? 'Cập nhật tồn kho' : 'Ghi tồn kho'}
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
        {stock ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Sản phẩm <span className="font-medium">#{stock.product_id}</span> · Cửa hàng{' '}
            <span className="font-medium">{stock.store?.name ?? `#${stock.store_id}`}</span> — chỉ
            sửa được số lượng tồn.
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Tìm sản phẩm</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Nhập tên hoặc slug…"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />
            </label>

            <TextField
              register={register}
              name="product_id"
              label="Sản phẩm"
              placeholder="Chọn sản phẩm"
              error={errors.product_id?.message}
              options={productOptions}
            />

            {isAdmin ? (
              <TextField
                register={register}
                name="store_id"
                label="Cửa hàng"
                placeholder="Chọn cửa hàng"
                error={errors.store_id?.message}
                options={(stores.data ?? []).map((store) => ({
                  value: String(store.id),
                  label: store.name,
                }))}
              />
            ) : (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Tồn kho sẽ được ghi vào <span className="font-medium">{ownStoreName}</span>.
              </p>
            )}

            {isAdmin ? (
              <TextField
                register={register}
                name="staff_id"
                label="NV phụ trách (Không bắt buộc)"
                placeholder="Chưa chọn"
                error={errors.staff_id?.message}
                options={staffOptions}
              />
            ) : null}
          </>
        )}

        {stock && isAdmin ? (
          <TextField
            register={register}
            name="staff_id"
            label="NV phụ trách"
            placeholder="Giữ nguyên"
            error={errors.staff_id?.message}
            options={staffOptions}
          />
        ) : null}

        <TextField
          register={register}
          name="quantity"
          label="Số lượng tồn"
          type="number"
          error={errors.quantity?.message}
        />

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}

export function StockPage() {
  const { isAdmin, canWriteStock, user } = useAuth()
  const [page, setPage] = useState(0)
  const [storeId, setStoreId] = useState('')
  const [editing, setEditing] = useState<Stock | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const { text, keyword, setText } = useSearch()
  const stores = useStores()
  const directory = useProductDirectory()
  const staff = useStaffDirectory()
  const remove = useDeleteStock()

  const query = useStockList({
    q: keyword || undefined,
    page: page + 1,
    store_id: isAdmin && storeId ? Number(storeId) : undefined,
  })

  const productNames = useMemo(() => {
    const map = new Map<number, string>()
    for (const product of directory.data ?? []) map.set(product.id, product.name)
    return map
  }, [directory.data])

  const staffNames = useMemo(() => {
    const map = new Map<number, string>()
    for (const person of staff.data ?? []) map.set(person.id, person.name)
    return map
  }, [staff.data])

  const rows = useMemo(() => query.data?.data ?? [], [query.data])

  const columns = useMemo<Column<Stock>[]>(
    () => [
      {
        id: 'product',
        header: 'Sản phẩm',
        cell: (row) => (
          <div>
            <p className="font-medium text-slate-900">{productNames.get(row.product_id) ?? '—'}</p>
            <p className="text-xs text-slate-400">#{row.product_id}</p>
          </div>
        ),
      },
      {
        id: 'store',
        header: 'Cửa hàng',
        cell: (row) => row.store?.name ?? (row.store_id ? `#${row.store_id}` : '—'),
      },
      {
        id: 'quantity',
        header: 'Tồn kho',
        align: 'right',
        cell: (row) => <span className="font-semibold text-slate-900">{row.quantity}</span>,
      },
      {
        id: 'staff',
        header: 'NV phụ trách',
        cell: (row) =>
          row.staff_id ? (staffNames.get(row.staff_id) ?? `#${row.staff_id}`) : '—',
      },
      { id: 'updated_at', header: 'Cập nhật', cell: (row) => formatDate(row.updated_at) },
    ],
    [productNames, staffNames],
  )

  const scopeNote = isAdmin
    ? 'Tồn kho thuộc từng cửa hàng — mỗi (sản phẩm, cửa hàng) có đúng một mức tồn.'
    : `Bạn chỉ xem tồn kho của ${user?.staff?.store?.name ?? 'cửa hàng của bạn'}.`

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho</h1>
          <p className="text-sm text-slate-500">{scopeNote}</p>
        </div>
        {canWriteStock ? (
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            + Ghi tồn kho
          </Button>
        ) : null}
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
        onSearchChange={(value) => {
          setText(value)
          setPage(0)
        }}
        searchPlaceholder="Tìm theo tên hoặc slug sản phẩm…"
        filter={
          isAdmin ? (
            <select
              value={storeId}
              onChange={(event) => {
                setStoreId(event.target.value)
                setPage(0)
              }}
              className="max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Tất cả cửa hàng</option>
              {(stores.data ?? []).map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          ) : null
        }
        showActions={canWriteStock}
        onEdit={(row) => {
          setEditing(row)
          setFormOpen(true)
        }}
        onDelete={(row) => remove.mutateAsync(row.id)}
        deleteTitle="Xóa bản ghi tồn kho"
        deleteMessage={(row) =>
          `Xóa bản ghi tồn kho của "${productNames.get(row.product_id) ?? `#${row.product_id}`}" tại ${
            row.store?.name ?? `#${row.store_id}`
          }?`
        }
        emptyText="Chưa có bản ghi tồn kho"
      />

      {formOpen ? (
        <StockForm
          key={editing?.id ?? 'new'}
          stock={editing}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  )
}
