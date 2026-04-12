const isNumericLike = (value: string) => /^[-+]?\d+(\.\d+)?$/.test(value);

export const toHumanReadableText = (value: unknown): string | null => {
  if (value == null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/[{}[\]"]+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;
  if (isNumericLike(cleaned)) return cleaned;

  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const toDisplayTimeframe = (value: unknown): string | null => {
  const formatted = toHumanReadableText(value);
  if (!formatted) return null;

  const compact = formatted.replace(/\s+/g, '').toLowerCase();

  const suffixMatch = compact.match(/^(\d+)([mhdw])$/i);
  if (suffixMatch) {
    return `${suffixMatch[1]}${suffixMatch[2].toUpperCase()}`;
  }

  const prefixMatch = compact.match(/^([mhdw])(\d+)$/i);
  if (prefixMatch) {
    return `${prefixMatch[2]}${prefixMatch[1].toUpperCase()}`;
  }

  return formatted;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const toEntrySignalDisplay = (entrySignal: Record<string, unknown> | null): string | null => {
  if (!entrySignal) return null;

  const maybePrice =
    toFiniteNumber(entrySignal.level) ??
    toFiniteNumber(entrySignal.entry_price) ??
    toFiniteNumber(entrySignal.entryPrice) ??
    toFiniteNumber(entrySignal.entry) ??
    toFiniteNumber(entrySignal.price);

  if (typeof maybePrice === 'number') return maybePrice.toFixed(2);

  const asText =
    toHumanReadableText(entrySignal.signal) ??
    toHumanReadableText(entrySignal.trigger) ??
    toHumanReadableText(entrySignal.entry_signal) ??
    toHumanReadableText(entrySignal.entrySignal);

  return asText;
};
