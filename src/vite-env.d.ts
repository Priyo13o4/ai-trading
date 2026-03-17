/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY_DEV?: string;
  readonly VITE_TURNSTILE_SITE_KEY_PROD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.webm' {
  const src: string;
  export default src;
}
