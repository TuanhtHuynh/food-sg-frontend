import { SimplePage } from './SimplePage'

export function BannersPage() {
  return (
    <SimplePage
      config={{
        resource: 'banners',
        title: 'Banner',
        description: 'Quản lý banner phần top của trang chủ',
        itemLabel: 'banner',
      }}
    />
  )
}
