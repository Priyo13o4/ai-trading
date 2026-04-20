/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV_NAME?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_AUTH_CALLBACK_URL_DEV?: string;
  readonly VITE_AUTH_CALLBACK_URL_PROD?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_SSE_URL?: string;
  readonly VITE_SESSION_COOKIE_NAME?: string;
  readonly VITE_CSRF_COOKIE_NAME?: string;
  readonly VITE_AUTHDBG?: string;
  readonly VITE_ENABLE_SSE_PAUSE_RESUME?: string;
  readonly VITE_SSE_BACKGROUND_PAUSE_DELAY_MS?: string;
  readonly VITE_SSE_OBS?: string;
  readonly VITE_SSE_OBS_SAMPLE_EVERY?: string;
  readonly VITE_ALLOWED_HOSTS?: string;
  readonly VITE_TT_REPORT_ONLY?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
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
