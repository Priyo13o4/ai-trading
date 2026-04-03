const REFERRAL_STORAGE_KEY = 'pipfactor.referral_code';
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{6,20}$/;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export function normalizeReferralCode(rawCode: string | null): string | null {
  if (!rawCode) {
    return null;
  }

  const trimmed = rawCode.trim();
  if (!REFERRAL_CODE_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed.toUpperCase();
}

export function captureReferralCodeFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const normalized = normalizeReferralCode(params.get('ref'));

  if (!normalized) {
    return null;
  }

  const storage = getStorage();
  if (!storage) {
    return normalized;
  }

  try {
    storage.setItem(REFERRAL_STORAGE_KEY, normalized);
  } catch {
    // Ignore sessionStorage write failures.
  }

  return normalized;
}

export function getStoredReferralCode(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    return normalizeReferralCode(storage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Ignore sessionStorage remove failures.
  }
}
