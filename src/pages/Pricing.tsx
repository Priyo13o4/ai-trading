import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PricingPlanCard, type PricingTierCardData } from '@/components/subscription/PricingPlanCard';
import { getPlanTier, normalizePlanName } from '@/components/subscription/planCatalog';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionService } from '@/services/subscriptionService';
import type { ActiveSubscriptionResponse } from '@/types/subscription';

const PRICING_TIERS: PricingTierCardData[] = [
  {
    name: 'starter',
    displayName: 'Core',
    launchChip: 'Launch Price',
    description:
      'Join early traders and get context-aware market signals while PipFactor is being expanded for broader market coverage.',
    price: 5,
    originalPrice: 10,
    discountLabel: '50% OFF',
    icon: Zap,
    features: [
      'AI-generated strategy ideas across major Forex, commodities, and crypto pairs',
      'Market regime intelligence for trend, transition, and risk-state context',
      'AI-powered market news analysis with sentiment and relevance scoring',
      'Priority product updates and member support channel',
    ],
    comingSoon: [
      'Expanded pair coverage across additional FX crosses and digital assets',
      'Real-time news sentiment and breaking news analysis',
      'Strategy history, performance review',
    ],
  },
];

const FAQ_ITEMS = [
  {
    id: 'plans',
    question: 'Can I switch plans later?',
    answer:
      'Yes. You can move between plans as your workflow changes. Your account history and preferences stay attached to your profile.',
  },
  {
    id: 'pairs',
    question: 'Which trading pairs are supported?',
    answer:
      'Current support includes XAUUSD, EURUSD, GBPUSD, USDJPY, and BTCUSD. Additional pairs will be added based on usage and demand.',
  },
  {
    id: 'billing',
    question: 'What payment methods do you support?',
    answer:
      'Major cards are supported through our payment processor. Payment integration is rolling out and remains enabled by plan and region.',
  },
  {
    id: 'cancel',
    question: 'Can I cancel any time?',
    answer:
      'Yes. You can cancel from profile settings and keep access until the end of your billing period.',
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const loadCurrentSubscription = useCallback(async () => {
    if (!user?.id) return;
    try {
      const subscription = await subscriptionService.getActiveSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load current subscription:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(false);
    if (isAuthenticated && user) {
      void loadCurrentSubscription();
    }
  }, [isAuthenticated, user, loadCurrentSubscription]);

  const handleSubscribe = async (tierName: string) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue');
      navigate('/?signin=true');
      return;
    }

    if (!user?.id) {
      toast.error('User information not available');
      return;
    }

    setSubscribingTo(tierName);

    try {
      if (tierName === 'elite') {
        toast.info('Elite access is currently available.', {
          description: 'Checkout is not required right now for this plan.',
        });
        setSubscribingTo(null);
        return;
      }

      const tier = PRICING_TIERS.find((item) => item.name === tierName);
      toast.info(`Checkout for ${tier?.displayName} is being finalized.`, {
        description: 'Secure payment processing is being connected.',
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription');
    } finally {
      setSubscribingTo(null);
    }
  };

  const isCurrentPlan = (tierName: string): boolean => {
    const normalizedCurrent = normalizePlanName(currentSubscription?.plan_name);
    return normalizedCurrent === tierName && Boolean(currentSubscription?.is_current);
  };

  const currentPlanLabel = currentSubscription
    ? getPlanTier(currentSubscription.plan_name).displayName
    : null;

  if (loading) {
    return <LoadingScreen message="Loading subscription plans..." />;
  }

  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#C8935A]/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[28rem] w-[28rem] rounded-full bg-[#E2B485]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-[#00FF41]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="mx-auto max-w-6xl">
          <section className="relative px-4 pb-14 pt-28 sm:pt-32">
            <div className="sa-container max-w-5xl text-center">
              <div className="mx-auto mb-6 w-fit inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-[#E2B485] bg-[#E2B485]/10 border border-[#C8935A]/30">
                <Sparkles className="h-3.5 w-3.5" />
                Launch Pricing
              </div>
              <h1 className="text-[#E0E0E0] text-4xl font-display font-bold leading-tight md:text-6xl">
                Core Plan
                <span className="mt-2 block text-[#E2B485]">Built for active traders</span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#9CA3AF] md:text-xl">
                Professional access to context-aware market intelligence at launch-stage pricing.
              </p>

              {currentSubscription?.is_current && (
                <div className="lumina-card mx-auto mt-8 inline-flex items-center gap-3 rounded-xl px-5 py-3">
                  <Shield className="h-4 w-4 text-[#C8935A]" />
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold">Current plan:</span> {currentPlanLabel}
                    {currentSubscription.is_trial && (
                      <span className="ml-2 text-[#9CA3AF]">({currentSubscription.days_remaining} days remaining)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="relative px-4 pb-16">
            <div className="sa-container max-w-6xl">
              <div className="mx-auto grid w-full max-w-5xl gap-6">
                {PRICING_TIERS.map((tier) => (
                  <PricingPlanCard
                    key={tier.name}
                    tier={tier}
                    isCurrent={isCurrentPlan(tier.name)}
                    isSubscribing={subscribingTo === tier.name}
                    onSelect={handleSubscribe}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 pb-20">
            <div className="sa-container max-w-4xl">
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-display font-bold text-[#E0E0E0]">Pricing FAQs</h2>
                <p className="mx-auto mt-3 max-w-2xl text-[#9CA3AF]">
                  Answers to the most common subscription and billing questions.
                </p>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ_ITEMS.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="lumina-card px-6 transition-colors data-[state=open]:border-[#C8935A]/40"
                  >
                    <AccordionTrigger className="text-left py-4 text-base font-semibold text-slate-100 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-relaxed text-[#9CA3AF]">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          <section className="px-4 pb-24">
            <div className="sa-container max-w-5xl">
              <div className="lumina-card relative overflow-hidden rounded-3xl p-10 text-center md:p-14">
                <div className="mx-auto mb-6 w-fit inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-[#E2B485] bg-[#E2B485]/10 border border-[#C8935A]/30">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Ready to start?
                </div>
                <h3 className="text-4xl font-display font-bold leading-tight text-[#E0E0E0] md:text-5xl">
                  Upgrade your trading workflow
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
                  Get higher coverage, stronger insights, and faster decision support with a plan that matches your pace.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  {!isAuthenticated ? (
                    <>
                      <Button
                        size="lg"
                        onClick={() => navigate('/?signup=true')}
                        className="lumina-button min-w-52"
                      >
                        <Rocket className="mr-2 h-5 w-5" />
                        Create Account
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/signal')}
                        className="lumina-button-outline min-w-52"
                      >
                        View Signals
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="lg" onClick={() => navigate('/signal')} className="lumina-button min-w-52">
                      <Check className="mr-2 h-5 w-5" />
                      Continue to Signals
                    </Button>
                  )}
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1">Encrypted billing</Badge>
                  <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/30 px-3 py-1">Real-time analysis</Badge>
                  <Badge className="bg-[#E2B485]/10 text-[#E2B485] border-[#C8935A]/30 px-3 py-1">Flexible upgrades</Badge>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
