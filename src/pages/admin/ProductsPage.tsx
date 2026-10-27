import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCategories,
  useCreate,
  useCreateProductWithImage,
  useDelete,
  useForceDeleteProduct,
  useList,
  useRestoreProduct,
  useStores,
  useUpdate,
  useUpdateProductWithImage,
} from '../../api/queries'
import { ResourceTable } from '../../components/ResourceTable'
import type { Column } from '../../components/DataTable'
import { ProductThumb } from '../../components/ProductThumb'
import { TextAreaField, TextField } from '../../components/form'
import { Button, Modal } from '../../components/ui'
import {
  errorMessage,
  formatDate,
  formatMoney,
  imageUrl,
  mapServerErrors,
  toIso,
  toLocalInput,
} from '../../lib/client'
import { ApiError } from '../../lib/client'
import { useSearch } from '../../lib/hooks'
import { productSchema } from '../../api/schemas'
import type { ProductValues } from '../../api/schemas'
import type { Product } from '../../api/types'

const FIELDS = [
  'name',
  'price',
  'category_id',
  'sale_price',
  'sale_start_at',
  'sale_end_at',
  'slug',
  'meta_title',
  'meta_description',
  'meta_keyword',
] as const

/** Đáp ứng BE: image là FILE upload (jpg/jpeg/png/webp, ≤ 2048KB), các field còn lại bắt buộc như JSON. */
function buildProductForm(
  values: ProductValues,
  imageFile: File | null,
  isUpdate: boolean,
): FormData {
  const form = new FormData()
  form.append('name', values.name)
  form.append('price', String(Number(values.price)))
  form.append('category_id', values.category_id)
  form.append('sale_price', values.sale_price ?? '')
  form.append('sale_start_at', toIso(values.sale_start_at) ?? '')
  form.append('sale_end_at', toIso(values.sale_end_at) ?? '')
  form.append('slug', values.slug ?? '')
  form.append('meta_title', values.meta_title ?? '')
  form.append('meta_description', values.meta_description ?? '')
  form.append('meta_keyword', values.meta_keyword ?? '')
  if (imageFile) form.append('image', imageFile)
  // PHP không parse multipart ở PUT — Laravel override method bằng _method
  if (isUpdate) form.append('_method', 'PUT')
  return form
}

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const categories = useCategories()
  const create = useCreate<Product>('products')
  const update = useUpdate<Product>('products')
  const createWithImage = useCreateProductWithImage()
  const updateWithImage = useUpdateProductWithImage()
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      price: product ? String(product.price) : '',
      category_id: product ? String(product.category_id) : '',
      sale_price: product?.sale_price ? String(product.sale_price) : '',
      sale_start_at: toLocalInput(product?.sale_start_at),
      sale_end_at: toLocalInput(product?.sale_end_at),
      slug: product?.slug ?? '',
      meta_title: product?.meta_title ?? '',
      meta_description: product?.meta_description ?? '',
      meta_keyword: product?.meta_keyword ?? '',
    },
  })

  const pending =
    create.isPending ||
    update.isPending ||
    createWithImage.isPending ||
    updateWithImage.isPending

  const onSubmit = async (values: ProductValues) => {
    setError('')

    if (imageFile) {
      const formData = buildProductForm(values, imageFile, Boolean(product))
      try {
        if (product) await updateWithImage.mutateAsync({ id: product.id, formData })
        else await createWithImage.mutateAsync(formData)
        onClose()
      } catch (err) {
        const mapped = mapServerErrors(err, setFieldError, [...FIELDS])
        const imageMessage = err instanceof ApiError ? err.errors['image']?.[0] : undefined
        if (imageMessage) setError(imageMessage)
        else if (!mapped) setError(errorMessage(err))
      }
      return
    }

    const payload = {
      name: values.name,
      price: Number(values.price),
      category_id: Number(values.category_id),
      sale_price: values.sale_price === '' ? null : Number(values.sale_price),
      sale_start_at: toIso(values.sale_start_at),
      sale_end_at: toIso(values.sale_end_at),
      slug: values.slug || null,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
      meta_keyword: values.meta_keyword || null,
    }

    try {
      if (product) await update.mutateAsync({ id: product.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (err) {
      if (!mapServerErrors(err, setFieldError, [...FIELDS])) setError(errorMessage(err))
    }
  }

  const previewUrl = imageUrl(product?.image)

  return (
    <Modal
      open
      title={product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={pending}>
            {pending ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="sm:col-span-2">
          <TextField
            register={register}
            name="name"
            label="Tên sản phẩm"
            placeholder="Phở bò"
            error={errors.name?.message}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Ảnh (jpg/png/webp, ≤ 2MB)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />
          <span className="text-xs text-slate-400">
            {imageFile?.name ?? (previewUrl ? 'Đang dùng ảnh hiện tại — chọn file mới để thay' : 'Chưa chọn ảnh')}
          </span>
        </label>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={product?.name ?? ''}
            className="h-16 w-16 rounded-md border border-slate-200 object-cover"
          />
        ) : null}

        <TextField
          register={register}
          name="price"
          label="Giá"
          type="number"
          error={errors.price?.message}
        />

        <TextField
          register={register}
          name="category_id"
          label="Danh mục"
          placeholder="Chọn danh mục"
          error={errors.category_id?.message}
          options={(categories.data ?? []).map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
        />

        <TextField
          register={register}
          name="sale_price"
          label="Giá khuyến mãi"
          type="number"
          error={errors.sale_price?.message}
        />

        <TextField
          register={register}
          name="slug"
          label="Slug (SEO)"
          placeholder="pho-bo"
          error={errors.slug?.message}
        />

        <TextField
          register={register}
          name="sale_start_at"
          label="Bắt đầu khuyến mãi"
          type="datetime-local"
          error={errors.sale_start_at?.message}
        />

        <TextField
          register={register}
          name="sale_end_at"
          label="Kết thúc khuyến mãi"
          type="datetime-local"
          error={errors.sale_end_at?.message}
        />

        <div className="sm:col-span-2">
          <TextField
            register={register}
            name="meta_title"
            label="Meta title"
            error={errors.meta_title?.message}
          />
        </div>

        <div className="sm:col-span-2">
          <TextAreaField
            register={register}
            name="meta_description"
            label="Meta description"
            error={errors.meta_description?.message}
          />
        </div>

        <div className="sm:col-span-2">
          <TextField
            register={register}
            name="meta_keyword"
            label="Meta keyword"
            error={errors.meta_keyword?.message}
          />
        </div>

        {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
      </form>
    </Modal>
  )
}

/**
 * API không có endpoint liệt kê sản phẩm đã xoá mềm, nên admin nhập id
 * để khôi phục (kèm staff + user liên quan) hoặc xoá cứng.
 */
function TrashDialog({ onClose }: { onClose: () => void }) {
  const restore = useRestoreProduct()
  const forceDelete = useForceDeleteProduct()
  const [productId, setProductId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const id = Number(productId)

  const run = async (action: 'restore' | 'force') => {
    setMessage('')
    setError('')

    try {
      if (action === 'restore') {
        const product = await restore.mutateAsync(id)
        setMessage(`Đã khôi phục "${product.name}" cùng nhân viên và tài khoản liên quan.`)
      } else {
        await forceDelete.mutateAsync(id)
        setMessage(`Đã xóa vĩnh viễn sản phẩm #${id}.`)
      }
      setConfirming(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Modal
      open
      title="Sản phẩm đã xoá"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="danger"
            disabled={!Number.isInteger(id) || id <= 0 || restore.isPending || forceDelete.isPending}
            onClick={() => setConfirming(true)}
          >
            Xóa vĩnh viễn
          </Button>
          <Button
            disabled={!Number.isInteger(id) || id <= 0 || restore.isPending || forceDelete.isPending}
            onClick={() => run('restore')}
          >
            Khôi phục
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">ID sản phẩm</span>
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            inputMode="numeric"
            placeholder="Ví dụ: 12"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />
        </label>

        <p className="text-xs text-slate-500">
          Khôi phục sẽ gỡ trạng thái xoá mềm của sản phẩm, nhân viên phụ trách và tài khoản đăng nhập
          tương ứng. Xóa vĩnh viễn không thể hoàn tác.
        </p>

        {confirming ? (
          <div className="rounded-md bg-rose-50 p-3">
            <p className="text-sm text-rose-700">
              Xóa vĩnh viễn sản phẩm #{id}? Bản ghi sẽ bị xóa cứng khỏi cơ sở dữ liệu.
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Huỷ
              </Button>
              <Button variant="danger" onClick={() => run('force')}>
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        ) : null}

        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </Modal>
  )
}

export function ProductsPage() {
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)

  const { text, keyword, setText } = useSearch()
  const categories = useCategories()
  const stores = useStores()
  const remove = useDelete('products')
  const query = useList<Product>('products', {
    q: keyword || undefined,
    page: page + 1,
    category_id: categoryId ? Number(categoryId) : undefined,
    store_id: storeId ? Number(storeId) : undefined,
  })

  const rows = useMemo(() => query.data?.data ?? [], [query.data])

  const columns = useMemo<Column<Product>[]>(
    () => [
      {
        id: 'name',
        header: 'Sản phẩm',
        cell: (row) => (
          <div className="flex items-center gap-3">
            <ProductThumb image={row.image} name={row.name} className="h-10 w-10 shrink-0 rounded-md" />
            <div>
              <p className="font-medium text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-400">/{row.slug}</p>
            </div>
          </div>
        ),
      },
      { id: 'category', header: 'Danh mục', cell: (row) => row.category?.name ?? '—' },
      { id: 'price', header: 'Giá', align: 'right', cell: (row) => formatMoney(row.price) },
      {
        id: 'sale_price',
        header: 'Khuyến mãi',
        align: 'right',
        cell: (row) => (row.sale_price ? formatMoney(row.sale_price) : '—'),
      },
      { id: 'updated_at', header: 'Cập nhật', cell: (row) => formatDate(row.updated_at) },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
          <p className="text-sm text-slate-500">Quản lý danh sách món ăn trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTrashOpen(true)}>
            Sản phẩm đã xoá
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            + Thêm sản phẩm
          </Button>
        </div>
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
        searchPlaceholder="Tìm theo tên hoặc slug…"
        filter={
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setPage(0)
              }}
              className="max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Tất cả danh mục</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

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
          </div>
        }
        onEdit={(row) => {
          setEditing(row)
          setFormOpen(true)
        }}
        onDelete={(row) => remove.mutateAsync(row.id)}
        deleteTitle="Xóa sản phẩm"
        deleteMessage={(row) =>
          `Xóa "${row.name}" sẽ ẩn sản phẩm, nhân viên phụ trách và tài khoản đăng nhập của nhân viên đó. Tồn kho được giữ nguyên.`
        }
        emptyText="Không có sản phẩm nào"
      />

      {formOpen ? (
        <ProductForm
          key={editing?.id ?? 'new'}
          product={editing}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {trashOpen ? <TrashDialog onClose={() => setTrashOpen(false)} /> : null}
    </div>
  )
}
