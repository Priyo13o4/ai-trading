type BadgeTone =
  | 'muted'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'violet';

const BADGE_CLASSES: Record<BadgeTone, string> = {
  muted: 'sa-badge-muted',
  accent: 'sa-badge-accent',
  success: 'sa-badge-success',
  danger: 'sa-badge-danger',
  warning: 'sa-badge-warning',
  info: 'sa-badge-info',
  violet: 'sa-badge-violet',
};

export const getBadgeTone = (tone: BadgeTone = 'muted'): string => BADGE_CLASSES[tone];

export const getSentimentTone = (sentiment?: string): string => {
  switch ((sentiment || '').toLowerCase()) {
    case 'bullish':
      return 'text-emerald-300';
    case 'bearish':
      return 'text-rose-300';
    default:
      return 'text-slate-400';
  }
};

export const getImpactTone = (impact?: string): string => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish':
      return getBadgeTone('success');
    case 'bearish':
      return getBadgeTone('danger');
    case 'mixed':
      return getBadgeTone('muted');
    default:
      return getBadgeTone('muted');
  }
};

export const getFilterChipTone = (
  tone: 'default' | 'accent' | 'danger' | 'info' | 'violet',
  active: boolean
): string => {
  if (!active) return 'sa-filter-chip';
  switch (tone) {
    case 'accent':
      return 'sa-filter-chip sa-filter-chip-active';
    case 'danger':
      return 'sa-filter-chip sa-badge-danger';
    case 'info':
      return 'sa-filter-chip sa-badge-info';
    case 'violet':
      return 'sa-filter-chip sa-badge-violet';
    default:
      return 'sa-filter-chip sa-filter-chip-active';
  }
};
