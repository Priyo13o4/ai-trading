import { ArrowRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        'lumina-card mesh-card-bg flex h-full flex-col',
        tier.popular && 'border-[#C8935A]/50 shadow-[0_0_30px_rgba(200,147,90,0.15)]',
        isCurrent && 'ring-2 ring-[#E2B485]/35'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
          <Badge className="bg-[#E2B485]/10 text-[#E2B485] border-[#C8935A]/40 px-4 py-1 text-[11px] tracking-wide">Most Popular</Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4 z-20">
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-400/40 px-3 py-1 text-[11px] tracking-wide">Active Plan</Badge>
        </div>
      )}

      <div className="relative z-10 grid gap-8 p-7 sm:p-9 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-12 md:p-10">
        <div className="md:border-r md:border-[#C8935A]/20 md:pr-12">
          {tier.launchChip && (
            <div className="mb-6">
              <Badge className="bg-[#E2B485]/10 text-[#E2B485] border-[#C8935A]/40 px-3 py-1 text-[11px] tracking-wide uppercase">
                {tier.launchChip}
              </Badge>
            </div>
          )}

          <h3 className="font-display text-4xl font-bold leading-none text-[#E0E0E0] md:text-5xl">{tier.displayName}</h3>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#9CA3AF] md:text-lg md:leading-[1.5]">{tier.description}</p>

          <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-2">
            {typeof tier.originalPrice === 'number' && (
              <span className="pb-1 text-2xl text-slate-500 line-through md:text-3xl">${tier.originalPrice}</span>
            )}
            <span className="pb-1 text-2xl text-[#E0E0E0] md:text-3xl">$</span>
            <span className={cn('font-display text-6xl font-bold leading-none md:text-7xl', tier.popular ? 'text-[#E2B485]' : 'text-white')}>
              {tier.price}
            </span>
            <span className="pb-2 text-2xl text-[#9CA3AF] md:text-3xl">/mo</span>
            {tier.discountLabel && (
              <Badge className="bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/40 ml-1 px-2.5 py-0.5 text-[11px] tracking-wide uppercase">
                {tier.discountLabel}
              </Badge>
            )}
          </div>

          <Button
            onClick={() => onSelect(tier.name)}
            disabled={isCurrent || isSubscribing}
            className={cn(
              'mt-8 h-12 w-full font-semibold text-base sm:w-56',
              tier.popular ? 'lumina-button' : 'lumina-button-outline',
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

          <p className="mt-8 max-w-sm text-base leading-relaxed text-slate-400 md:text-lg md:leading-[1.5]">
            Cancel anytime • Secure billing • No hidden fees
          </p>
        </div>

        <div className="pt-1">
          <p className="mb-4 text-xl font-semibold uppercase tracking-[0.12em] text-[#E0E0E0] md:text-2xl">Included now</p>
          <ul className="space-y-4">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-base leading-relaxed text-[#9CA3AF] md:text-lg md:leading-[1.5]">
                <Check className="mt-1.5 h-5 w-5 shrink-0 text-[#E2B485]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {tier.comingSoon && tier.comingSoon.length > 0 && (
            <>
              <div className="my-7 border-b border-[#C8935A]/20" />
              <p className="mb-4 text-xl font-semibold uppercase tracking-[0.12em] text-[#E0E0E0] md:text-2xl">Coming soon</p>
              <ul className="space-y-4">
                {tier.comingSoon.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-[#9CA3AF] md:text-lg md:leading-[1.5]">
                    <Check className="mt-1.5 h-5 w-5 shrink-0 text-[#C8935A]/60" />
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
