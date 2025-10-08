/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_REF: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}