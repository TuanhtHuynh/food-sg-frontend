import { imageUrl } from '../lib/client'

interface ProductThumbProps {
  /** Ảnh từ DB (`products.image` — đường dẫn storage của BE). */
  image: string | null | undefined
  name: string
  /** Section khung thumb (kích thước, bo góc, viền). */
  className?: string
}

/** Ảnh sản phẩm lấy trực tiếp từ DB qua <img> — chưa có ảnh thì khung xám trống. */
export function ProductThumb({ image, name, className = '' }: ProductThumbProps) {
  const url = imageUrl(image)

  return (
    <span className={`inline-block overflow-hidden border border-slate-200 bg-slate-100 ${className}`}>
      {url ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : null}
    </span>
  )
}
