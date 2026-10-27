import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { rowPaginationFeature, tableFeatures, useTable } from '@tanstack/react-table'
import type { ColumnDef, PaginationState, RowData } from '@tanstack/react-table'

const features = tableFeatures({ rowPaginationFeature })

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowCount: number
  page: number
  onPageChange: (page: number) => void
  loading?: boolean
  emptyText?: string
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function DataTable<T>({
  rows,
  columns,
  rowCount,
  page,
  onPageChange,
  loading = false,
  emptyText = 'Chưa có dữ liệu',
}: DataTableProps<T>) {
  const tableColumns = useMemo<Array<ColumnDef<typeof features, RowData, unknown>>>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        cell: (info) => column.cell(info.row.original as unknown as T),
      })),
    [columns],
  )

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: page, pageSize: 15 }),
    [page],
  )

  const table = useTable({
    features,
    columns: tableColumns,
    data: rows as unknown as RowData[],
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      onPageChange(next.pageIndex)
    },
    manualPagination: true,
    rowCount,
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const column = columns.find((item) => item.id === header.id)
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase ${
                        alignClass[column?.align ?? 'left']
                      }`}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.id} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getAllCells().map((cell) => {
                      const column = columns.find((item) => item.id === cell.column.id)
                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-3 text-slate-700 ${
                            alignClass[column?.align ?? 'left']
                          }`}
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <span>
          Tổng {rowCount} bản ghi — trang {page + 1}/{table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  )
}
