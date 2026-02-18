/**
 * URL sanitizer for external links. Prevents javascript:/data:/vbscript: URI injection.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function sanitizeExternalUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
