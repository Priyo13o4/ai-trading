export type CanonicalPlanName = 'free' | 'starter' | 'professional' | 'elite';

export interface PlanTier {
  key: CanonicalPlanName;
  displayName: string;
  rank: number;
  description: string;
  badgeClass: string;
  accentClass: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    key: 'free',
    displayName: 'Free',
    rank: 0,
    description: 'Getting started',
    badgeClass: 'sa-badge-muted',
    accentClass: 'text-slate-300',
  },
  {
    key: 'starter',
    displayName: 'Core',
    rank: 1,
    description: 'For first-time users',
    badgeClass: 'sa-badge-info',
    accentClass: 'text-sky-300',
  },
  {
    key: 'professional',
    displayName: 'Professional',
    rank: 2,
    description: 'For active traders',
    badgeClass: 'sa-badge-violet',
    accentClass: 'text-violet-300',
  },
  {
    key: 'elite',
    displayName: 'Elite',
    rank: 3,
    description: 'Full platform access',
    badgeClass: 'sa-badge-accent',
    accentClass: 'sa-accent',
  },
];

const LEGACY_PLAN_MAP: Record<string, CanonicalPlanName> = {
  free: 'free',
  trial: 'free',
  starter: 'starter',
  basic: 'starter',
  core: 'starter',
  professional: 'professional',
  premium: 'starter',
  elite: 'starter',
};

const PLAN_TIER_BY_KEY = PLAN_TIERS.reduce<Record<CanonicalPlanName, PlanTier>>(
  (acc, tier) => {
    acc[tier.key] = tier;
    return acc;
  },
  {} as Record<CanonicalPlanName, PlanTier>
);

export const normalizePlanName = (planName: string | null | undefined): CanonicalPlanName => {
  if (!planName) return 'free';
  const normalized = planName.trim().toLowerCase();
  return LEGACY_PLAN_MAP[normalized] ?? 'free';
};

export const getPlanTier = (planName: string | null | undefined): PlanTier => {
  return PLAN_TIER_BY_KEY[normalizePlanName(planName)];
};

export const getNextPlan = (planName: string | null | undefined): PlanTier | null => {
  const current = getPlanTier(planName);
  return PLAN_TIERS.find((tier) => tier.rank === current.rank + 1) ?? null;
};
