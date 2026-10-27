/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL của Laravel API, ví dụ "/api" hoặc "http://localhost:8000/api". */
  readonly VITE_API_URL?: string
  /** Target của dev proxy trong vite.config.ts, ví dụ "http://localhost:8000". */
  readonly VITE_API_PROXY_TARGET?: string
  /** Khoá lưu token JWT trong localStorage. */
  readonly VITE_TOKEN_KEY?: string
  /** Host gốc nơi BE mount ảnh storage, ví dụ "http://localhost:8000". */
  readonly VITE_STORAGE_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
