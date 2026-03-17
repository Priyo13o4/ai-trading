/**
 * Turnstile site key resolution.
 *
 * Key precedence (first non-empty value wins):
 *   1. VITE_TURNSTILE_SITE_KEY_PROD  — production builds  (import.meta.env.PROD === true)
 *   2. VITE_TURNSTILE_SITE_KEY_DEV   — dev server / localhost (import.meta.env.PROD === false)
 *   3. VITE_TURNSTILE_SITE_KEY       — legacy single-key fallback (both modes)
 *
 * Production: set VITE_TURNSTILE_SITE_KEY_PROD=<real site key> in .env.production
 *
 * Localhost / dev: use Cloudflare's always-pass test key so the widget renders and
 * auto-passes without a real challenge. Backend runs with AUTH_EXCHANGE_TURNSTILE_ENFORCE=0
 * during dev so no server-side check is actually performed.
 *   VITE_TURNSTILE_SITE_KEY_DEV=1x00000000000000000000AA
 *
 * Backend enforcement is controlled independently via AUTH_EXCHANGE_TURNSTILE_ENFORCE
 * in docker-compose (0 = dev/local, 1 = production).
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */

const sanitize = (value?: string): string => (value || '').trim();

export const getTurnstileSiteKey = (): string => {
  const legacy = sanitize(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const modeKey = import.meta.env.PROD
    ? sanitize(import.meta.env.VITE_TURNSTILE_SITE_KEY_PROD)
    : sanitize(import.meta.env.VITE_TURNSTILE_SITE_KEY_DEV);

  return modeKey || legacy;
};

export const isTurnstileEnabled = (): boolean => Boolean(getTurnstileSiteKey());

/**
 * True when running in non-production mode (dev server / localhost).
 * Useful for components that want to skip or relax challenge behaviour in dev.
 */
export const isTurnstileDev = (): boolean => !import.meta.env.PROD;
