import { SimplePage } from './SimplePage'

export function PagesPage() {
  return (
    <SimplePage
      config={{
        resource: 'pages',
        title: 'Trang nội dung',
        description: 'Quản lý các trang tĩnh (giới thiệu, chính sách, ...)',
        itemLabel: 'trang',
      }}
    />
  )
}
