import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Crown, Lock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import sseService from '@/services/sseService';

interface SignalsAccessGateProps {
  pageName: 'signals' | 'strategy';
}

const LOCKED_PLAN_PREVIEW = [
  {
    key: 'starter',
    title: 'Core',
    price: '$5/mo',
    features: ['Live signal feed', 'Historical strategy timeline', 'Market news intelligence'],
  },
  {
    key: 'professional',
    title: 'Professional',
    price: 'Coming Soon',
    features: ['Advanced screening', 'Expanded pair universe', 'Priority analytics'],
  },
  {
    key: 'elite',
    title: 'Elite',
    price: 'Coming Soon',
    features: ['All professional features', 'Institutional tooling', 'Concierge support'],
  },
] as const;

export function SignalsAccessGate({ pageName }: SignalsAccessGateProps) {
  const navigate = useNavigate();
  const { subscriptionStatus, canAccessSignals } = useAuth();

  useEffect(() => {
    if (!canAccessSignals) {
      sseService.closeProtectedMarketDataConnections();
    }
  }, [canAccessSignals]);

  if (canAccessSignals) {
    return null;
  }

  const heading = pageName === 'signals' ? 'Signals Access Locked' : 'Strategy Access Locked';

  return (
    <main
      className="circuit-bg relative min-h-screen w-full text-slate-200"
      style={{ paddingTop: 'calc(var(--beta-banner-offset, 0px) + 5rem)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#C8935A]/12 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[20rem] w-[20rem] rounded-full bg-[#E2B485]/6 blur-[90px]" />
      </div>

      <section className="relative z-10 container mx-auto px-4 py-8">
        <div className="lumina-card mx-auto max-w-5xl border border-[#C8935A]/30 p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl border border-[#C8935A]/40 bg-[#C8935A]/10 p-2">
              <Lock className="h-5 w-5 text-[#E2B485]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#E2B485]">Subscription Required</p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">{heading}</h1>
            </div>
            <Badge className="ml-auto border-rose-500/30 bg-rose-500/10 text-rose-200">
              {subscriptionStatus.toUpperCase()}
            </Badge>
          </div>

          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Your subscription or trial is no longer active. Live market streams and protected strategy data are now blocked server-side.
            Choose a plan below to continue.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {LOCKED_PLAN_PREVIEW.map((plan) => (
              <article
                key={plan.key}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{plan.title}</h2>
                  {plan.key === 'starter' ? (
                    <Badge className="border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]">Available</Badge>
                  ) : (
                    <Badge className="border-white/15 bg-white/5 text-slate-300">Roadmap</Badge>
                  )}
                </div>
                <p className="mb-4 text-sm font-semibold text-[#E2B485]">{plan.price}</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Devtools-only DOM edits cannot restore market data access while permissions are revoked.
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => navigate('/pricing')}
              >
                View Plans
              </Button>
              <Button
                type="button"
                className="lumina-button"
                onClick={() => navigate('/profile?checkout=starter')}
              >
                <Crown className="mr-2 h-4 w-4" />
                Open Checkout
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
