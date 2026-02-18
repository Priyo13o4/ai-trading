import { ArrowRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MeshGradientLayer } from '@/components/ui/mesh-gradient-layer';
import { cn } from '@/lib/utils';

export interface PricingTierCardData {
  name: string;
  displayName: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  launchChip?: string;
  icon: LucideIcon;
  features: string[];
  comingSoon?: string[];
  popular?: boolean;
}

interface PricingPlanCardProps {
  tier: PricingTierCardData;
  isCurrent: boolean;
  isSubscribing: boolean;
  onSelect: (tierName: string) => void;
}

export function PricingPlanCard({
  tier,
  isCurrent,
  isSubscribing,
  onSelect,
}: PricingPlanCardProps) {
  return (
    <Card
      className={cn(
        'sa-pricing-card !bg-transparent flex h-full flex-col',
        tier.popular && 'sa-pricing-popular',
        isCurrent && 'ring-2 ring-amber-300/35'
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 rounded-[1.25rem]">
        <MeshGradientLayer
          className="opacity-85"
          speed={0.32}
          colors={['#0a0d1a', '#1a1d29', '#2d3748', '#3d4a5e', '#4a5568']}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/10 to-slate-950/30" />
      </div>

      {tier.popular && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
          <Badge className="sa-badge-accent px-4 py-1 text-[11px] tracking-wide">Most Popular</Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4 z-20">
          <Badge className="sa-badge-info px-3 py-1 text-[11px] tracking-wide">Active Plan</Badge>
        </div>
      )}

      <div className="relative z-10 grid gap-8 p-7 sm:p-9 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-12 md:p-10">
        <div className="md:border-r md:border-slate-700/55 md:pr-12">
          {tier.launchChip && (
            <div className="mb-6">
              <Badge className="sa-badge-accent px-3 py-1 text-[11px] tracking-wide uppercase">
                {tier.launchChip}
              </Badge>
            </div>
          )}

          <h3 className="font-display text-5xl font-bold leading-none sa-heading md:text-6xl">{tier.displayName}</h3>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300 md:text-[1.65rem] md:leading-[1.45]">{tier.description}</p>

          <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-2">
            {typeof tier.originalPrice === 'number' && (
              <span className="pb-1 text-3xl text-slate-400 line-through md:text-4xl">${tier.originalPrice}</span>
            )}
            <span className="pb-1 text-3xl text-slate-300 md:text-4xl">$</span>
            <span className={cn('font-display text-7xl font-bold leading-none', tier.popular ? 'sa-accent' : 'sa-heading')}>
              {tier.price}
            </span>
            <span className="pb-2 text-3xl text-slate-300 md:text-4xl">/mo</span>
            {tier.discountLabel && (
              <Badge className="sa-badge-success ml-1 px-2.5 py-0.5 text-[11px] tracking-wide uppercase">
                {tier.discountLabel}
              </Badge>
            )}
          </div>

          <Button
            onClick={() => onSelect(tier.name)}
            disabled={isCurrent || isSubscribing}
            className={cn(
              'mt-8 h-12 w-full font-semibold text-lg sm:w-56',
              tier.popular ? 'sa-btn-accent' : 'sa-btn-neutral',
              isCurrent && 'opacity-60'
            )}
          >
            {isSubscribing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing
              </span>
            ) : isCurrent ? (
              'Current Plan'
            ) : (
              <span className="flex items-center gap-2">
                Choose Core
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <p className="mt-8 max-w-sm text-lg leading-relaxed text-slate-400 md:text-[1.55rem] md:leading-[1.45]">
            Cancel anytime • Secure billing • No hidden fees
          </p>
        </div>

        <div className="pt-1">
          <p className="mb-4 text-2xl font-semibold uppercase tracking-[0.14em] text-slate-300 md:text-[2rem]">Included now</p>
          <ul className="space-y-4">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-lg leading-relaxed text-slate-200 md:text-[1.65rem] md:leading-[1.4]">
                <Check className="mt-2 h-5 w-5 shrink-0 text-emerald-300 md:h-6 md:w-6" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {tier.comingSoon && tier.comingSoon.length > 0 && (
            <>
              <div className="my-7 border-b border-slate-700/60" />
              <p className="mb-4 text-2xl font-semibold uppercase tracking-[0.14em] text-slate-300 md:text-[2rem]">Coming soon</p>
              <ul className="space-y-4">
                {tier.comingSoon.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-lg leading-relaxed text-slate-300 md:text-[1.65rem] md:leading-[1.4]">
                    <Check className="mt-2 h-5 w-5 shrink-0 text-sky-300 md:h-6 md:w-6" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
