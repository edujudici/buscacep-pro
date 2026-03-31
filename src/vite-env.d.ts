/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_CODE: string
  readonly VITE_ACCESS_KEYS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
