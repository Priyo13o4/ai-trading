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
        'lumina-card mesh-card-bg flex h-full flex-col border-t-4 border-[#C8935A]/50 transition-all duration-300 hover:shadow-[0_22px_60px_-15px_rgba(200,147,90,0.2)]',
        isCurrent && 'ring-2 ring-[#E2B485]/35'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
          <Badge className="bg-[#E2B485] text-[#111315] border-[#E2B485] px-6 py-1.5 text-xs font-bold tracking-widest uppercase shadow-lg">Most Popular</Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-4 right-4 z-20">
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-400/40 px-3 py-1 text-[11px] tracking-wide">Active Plan</Badge>
        </div>
      )}

      <div className="relative z-10 grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_1.1fr] md:gap-12 md:p-10">
        <div className="flex flex-col justify-center">
          {tier.launchChip && (
            <div className="mb-4">
              <Badge className="bg-[#E2B485]/10 text-[#E2B485] border-[#C8935A]/40 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                {tier.launchChip}
              </Badge>
            </div>
          )}

          <h3 className="font-display text-4xl font-extrabold tracking-tight text-[#E0E0E0] md:text-5xl lg:text-5xl">{tier.displayName}</h3>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#9CA3AF] md:text-lg md:leading-normal">{tier.description}</p>

          <div className="mt-8 flex items-baseline justify-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm self-center w-full group/price transition-all hover:bg-white/10">
            <div className="flex flex-col items-end">
              {tier.originalPrice && (
                <span className="text-sm font-display font-medium text-slate-500 line-through decoration-[#E2B485]/40 opacity-70">
                  ${tier.originalPrice}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-4xl md:text-5xl font-display font-extrabold text-[#E0E0E0] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover/price:scale-105 transition-transform duration-300">
                  ${tier.price}
                </span>
                <span className="text-sm font-display font-bold text-slate-400 uppercase tracking-widest opacity-60">/ mo</span>
              </div>
            </div>
            
            {tier.discountLabel && (
              <div className="flex-shrink-0">
                <Badge className="bg-[#E2B485] text-[#111315] hover:bg-[#E2B485] border-[#E2B485] px-2.5 py-0.5 text-[10px] font-black tracking-tighter uppercase rounded-sm shadow-[0_0_20px_rgba(200,147,90,0.4)] animate-pulse">
                  {tier.discountLabel}
                </Badge>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center w-full">
            <Button
              onClick={() => onSelect(tier.name)}
              disabled={isCurrent || isSubscribing}
              className={cn(
                'h-12 w-full font-bold text-base tracking-wide shadow-xl transition-all duration-300 hover:scale-[1.03]',
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
                  Start 7-Day Trial
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>

            <p className="mt-6 text-xs md:text-sm font-medium text-slate-500 text-center italic">
              * Full experience unlocked during 7-day trial
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center border-l border-[#C8935A]/15 pl-6 md:pl-12">
          <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-[#E2B485]/80">Core Infrastructure</p>
          <ul className="space-y-4">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-base leading-snug text-[#9CA3AF] md:text-lg">
                <Check className="mt-1 h-5 w-5 shrink-0 text-[#E2B485] drop-shadow-[0_0_8px_rgba(200,147,90,0.4)]" />
                <span className="text-slate-200">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
