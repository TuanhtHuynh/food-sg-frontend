import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DataTable } from './DataTable'
import type { Column } from './DataTable'
import { Pencil, Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, inputClass } from './ui'
import { errorMessage } from '../lib/client'

interface ResourceTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowCount: number
  page: number
  onPageChange: (page: number) => void
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** Bộ lọc thêm (ví dụ select danh mục), hiển thị cạnh ô tìm kiếm. */
  filter?: ReactNode
  onEdit?: (row: T) => void
  /** Gọi API xoá, reject nếu lỗi. */
  onDelete?: (row: T) => Promise<unknown>
  deleteTitle?: string
  deleteMessage?: (row: T) => string
  emptyText?: string
  /** Ẩn cột thao tác (màn hình chỉ đọc, ví dụ bán hàng xem kho). */
  showActions?: boolean
}

/** Bảng danh sách dùng chung: ô tìm kiếm + bảng + cột thao tác + hộp thoại xoá. */
export function ResourceTable<T>({
  rows,
  columns,
  rowCount,
  page,
  onPageChange,
  loading = false,
  search,
  onSearchChange,
  searchPlaceholder,
  filter,
  onEdit,
  onDelete,
  deleteTitle = 'Xóa',
  deleteMessage,
  emptyText,
  showActions = true,
}: ResourceTableProps<T>) {
  const [deleting, setDeleting] = useState<T | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allColumns = useMemo<Column<T>[]>(
    () => [
      ...columns,
      ...(showActions
        ? [
            {
              id: 'actions',
              header: 'Thao tác',
              align: 'right' as const,
              cell: (row: T) => (
                <div className="flex justify-end gap-2">
                  {onEdit ? (
                  <Button variant="secondary" onClick={() => onEdit(row)} className="gap-1.5 p-1.5" aria-label="Sửa">
                    <Pencil size={14} />
                  </Button>
                  ) : null}
                  {onDelete ? (
                  <Button variant="danger" onClick={() => setDeleting(row)} className="gap-1.5 p-1.5" aria-label="Xóa">
                    <Trash2 size={14} />
                  </Button>
                  ) : null}
                </div>
              ),
            },
          ]
        : []),
    ],
    [columns, onEdit, onDelete, showActions],
  )

  const confirmDelete = async () => {
    if (!deleting || !onDelete) return
    setPending(true)
    setError(null)
    try {
      await onDelete(deleting)
      setDeleting(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder ?? 'Tìm theo tên…'}
          className={`${inputClass} max-w-xs`}
        />
        {filter}
      </div>

      <DataTable
        rows={rows}
        columns={allColumns}
        rowCount={rowCount}
        page={page}
        onPageChange={onPageChange}
        loading={loading}
        emptyText={emptyText}
      />

      <ConfirmDialog
        open={!!deleting}
        title={deleteTitle}
        message={deleting && deleteMessage ? deleteMessage(deleting) : ''}
        pending={pending}
        error={error}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
