import { useEffect, useState } from 'react'

/** Ô tìm kiếm có debounce, trả về từ khoá đã debounce để gọi API. */
export function useSearch(delay = 350) {
  const [text, setText] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(text.trim()), delay)
    return () => clearTimeout(timer)
  }, [text, delay])

  return { text, keyword, setText }
}
