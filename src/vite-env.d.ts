/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY_DEV?: string;
  readonly VITE_TURNSTILE_SITE_KEY_PROD?: string;
  readonly VITE_DEFAULT_PAYMENT_PROVIDER?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Razorpay: any;
}

declare module '*.webm' {
  const src: string;
  export default src;
}
