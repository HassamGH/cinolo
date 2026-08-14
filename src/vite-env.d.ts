/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VIDCORE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
