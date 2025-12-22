import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles, ArrowRight, TrendingUp, Shield, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionPlan, ActiveSubscriptionResponse } from '@/types/subscription';

// Hardcoded pricing tiers with incremental features
const PRICING_TIERS = [
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for beginners',
    price: 5,
    icon: Zap,
    features: [
      'AI-powered news analysis',
      '1 trading pair of your choice',
      'Email notifications',
      'Mobile app access'
    ],
    popular: false
  },
  {
    name: 'professional',
    displayName: 'Professional',
    description: 'For active traders',
    price: 8,
    icon: Sparkles,
    features: [
      'Everything in Starter',
      '3 trading pairs of your choice',
      'Advanced analytics dashboard',
      'API access for automation'
    ],
    popular: false
  },
  {
    name: 'elite',
    displayName: 'Elite',
    description: 'Full access + Beta features',
    price: 12,
    icon: Crown,
    features: [
      'Everything in Professional',
      'All 5 trading pairs (XAUUSD, EURUSD, GBPUSD, USDJPY, BTCUSD)',
      'Priority customer support',
      '🚀 Beta Access - Free until Jan 1, 2026'
    ],
    popular: true
  }
] as const;

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false); // No need to load plans from DB anymore
    if (isAuthenticated && user) {
      loadCurrentSubscription();
    }
  }, [isAuthenticated, user]);

  const loadCurrentSubscription = async () => {
    if (!user?.id) return;
    
    try {
      const subscription = await subscriptionService.getActiveSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load current subscription:', error);
    }
  };

  const handleSubscribe = async (tierName: string) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to subscribe');
      navigate('/?signin=true');
      return;
    }

    if (!user?.id) {
      toast.error('User information not available');
      return;
    }

    setSubscribingTo(tierName);

    try {
      // BETA: During beta, Elite plan users get free access
      if (tierName === 'elite') {
        toast.info('🚀 Beta Access Active!', {
          description: 'You have free Elite access until January 1, 2026. Enjoy all features!'
        });
        setSubscribingTo(null);
        return;
      }

      // TODO: Integrate with payment gateway
      const tier = PRICING_TIERS.find(t => t.name === tierName);
      toast.info(`Payment integration coming soon for ${tier?.displayName}!`, {
        description: 'We\'re setting up secure payment processing. Check back soon!'
      });

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription');
    } finally {
      setSubscribingTo(null);
    }
  };

  const isCurrentPlan = (tierName: string): boolean => {
    // Map beta to elite since they're combined now
    const normalizedTierName = currentSubscription?.plan_name === 'beta' ? 'elite' : currentSubscription?.plan_name;
    return normalizedTierName === tierName && currentSubscription?.is_current;
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading subscription plans..." />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] overflow-hidden">
      {/* Subtle static background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-6 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-semibold">Choose Your Plan</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-white bg-[length:200%_auto] animate-gradient">
            Simple, Transparent Pricing
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            Start with a <span className="text-[#D4AF37] font-semibold">free trial</span>. 
            Upgrade anytime to unlock more trading pairs and premium features.
          </p>
          
          {currentSubscription && currentSubscription.is_current && (
            <div className="mt-8 inline-block bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-400/30 rounded-xl px-8 py-4 backdrop-blur-sm transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <p className="text-blue-200">
                  <span className="font-semibold">Current Plan:</span> {currentSubscription.display_name}
                  {currentSubscription.is_trial && (
                    <span className="ml-2 text-sm bg-blue-500/20 px-2 py-1 rounded">
                      {currentSubscription.days_remaining} days remaining
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => {
              const isCurrent = isCurrentPlan(tier.name);
              const isSubscribing = subscribingTo === tier.name;
              const Icon = tier.icon;

              return (
                <Card
                  key={tier.name}
                  className={`relative flex flex-col transition-all duration-300 ${
                    tier.popular
                      ? 'border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 md:scale-105 bg-gradient-to-br from-slate-800/90 to-slate-900/90'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  } backdrop-blur-sm ${isCurrent ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-900 px-4 py-1 text-sm font-bold shadow-lg">
                        ⭐ MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-4 z-10">
                      <Badge className="bg-blue-500 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                        ✓ ACTIVE
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4 pt-6">
                    <div className={`mx-auto mb-3 p-3 rounded-full inline-flex ${
                      tier.popular 
                        ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#E5C158]/20 text-[#D4AF37]' 
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white mb-1">
                      {tier.displayName}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm mb-4">
                      {tier.description}
                    </CardDescription>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xl text-slate-400">$</span>
                      <span className={`text-5xl font-display font-bold ${
                        tier.popular 
                          ? 'bg-clip-text text-transparent bg-gradient-to-br from-[#D4AF37] to-[#E5C158]' 
                          : 'text-white'
                      }`}>
                        {tier.price}
                      </span>
                      <span className="text-slate-400 text-base">/mo</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 px-6 pb-6">
                    <div className="space-y-2.5">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2.5">
                          <div className="flex-shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                          <span className="text-slate-200 text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      onClick={() => handleSubscribe(tier.name)}
                      disabled={isCurrent || isSubscribing}
                      className={`w-full h-11 font-semibold transition-all duration-300 ${
                        tier.popular
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#D4AF37] text-slate-900 shadow-lg'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white'
                      } ${isCurrent ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      {isSubscribing ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : isCurrent ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Current Plan
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Get Started 
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative pb-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-lg">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {/* BETA: Beta-specific FAQ (REMOVE AFTER BETA) */}
            <AccordionItem 
              value="beta-access" 
              className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 backdrop-blur-sm rounded-lg border border-blue-500/30 px-6 data-[state=open]:shadow-xl data-[state=open]:shadow-blue-500/10 transition-all"
            >
              <AccordionTrigger className="text-left text-blue-200 hover:text-blue-100 font-semibold py-5 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  🚀 What is Beta Access?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-blue-100 pb-5 leading-relaxed">
                All new users get free Elite access (worth $12/month) until January 1, 2026! 
                This includes all 5 trading pairs, AI news analysis, and all premium features. 
                We're building this together with your feedback.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="after-beta" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                What happens after beta ends?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                When beta ends, you'll have the option to subscribe to any of our production plans: 
                Starter ($5), Professional ($8), or Elite ($12). Your trading data and preferences will be preserved.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="change-pairs" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                Can I change my trading pairs?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                During beta, you have access to all pairs. After beta, Starter plan lets you choose 1 pair, 
                Professional lets you choose 3 pairs (locked until next payment), and Elite gives you all pairs automatically.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="available-pairs" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                Which trading pairs are available?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                We currently support <span className="text-[#D4AF37] font-semibold">XAUUSD (Gold)</span>, 
                <span className="text-blue-300"> EURUSD</span>, 
                <span className="text-blue-300"> GBPUSD</span>, 
                <span className="text-blue-300"> USDJPY</span>, and 
                <span className="text-blue-300"> BTCUSD</span>. 
                More pairs will be added based on user demand during beta!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="refunds" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                Do you offer refunds?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                Yes! After beta ends, we'll offer a <span className="text-green-400 font-semibold">7-day money-back guarantee</span> on all paid plans. 
                If you're not satisfied, contact us within 7 days for a full refund.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="payment-methods" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                We accept all major credit cards, debit cards, and popular payment methods through our secure payment processor. 
                Your payment information is encrypted and never stored on our servers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="cancel-anytime" 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 px-6 data-[state=open]:shadow-xl data-[state=open]:border-slate-600 transition-all"
            >
              <AccordionTrigger className="text-left text-white hover:text-slate-200 font-semibold py-5 hover:no-underline">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 pb-5 leading-relaxed">
                Absolutely! You can cancel your subscription at any time from your profile settings. 
                You'll continue to have access until the end of your current billing period. No hidden fees or cancellation charges.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-900/50 to-[#D4AF37]/10 rounded-3xl p-12 md:p-16 text-center border border-[#D4AF37]/30 shadow-2xl">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-[#D4AF37]/10 to-blue-600/10 animate-gradient"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-6 py-2 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-semibold">Join Thousands of Smart Traders</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ready to Start Trading{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#E5C158]">
                  Smarter?
                </span>
              </h2>
              
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of traders using AI-powered insights to make better decisions.
                Start with full access during beta.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!isAuthenticated ? (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate('/?signup=true')}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#D4AF37] text-slate-900 font-bold text-lg px-8 py-6 shadow-lg hover:shadow-[#D4AF37]/50 transform hover:scale-105 transition-all"
                    >
                      <Rocket className="mr-2 h-5 w-5" />
                      Start Your Free Trial
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/signal')}
                      className="border-2 border-slate-600 text-white hover:bg-slate-800/50 font-semibold text-lg px-8 py-6 backdrop-blur-sm"
                    >
                      View Live Signals
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => navigate('/signal')}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#D4AF37] text-slate-900 font-bold text-lg px-8 py-6 shadow-lg hover:shadow-[#D4AF37]/50 transform hover:scale-105 transition-all"
                  >
                    <TrendingUp className="mr-2 h-5 w-5" />
                    View Trading Signals
                  </Button>
                )}
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm mb-4">Trusted by traders worldwide</p>
                <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span className="text-sm">Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span className="text-sm">7-Day Money Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                    <span className="text-sm">Real-Time Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
