import { useState, useCallback, useEffect } from 'react';
import { 
  Copy, 
  Share2, 
  TrendingUp, 
  Loader2, 
  Gift, 
  Award,
  HelpCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiService, toSafeUserErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';

const glassCard = 'lumina-card p-6 shadow-2xl transition-all';
const inputStyle = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-[#E2B485] outline-none';

interface ReferralProfile {
  referral_code?: string;
  total_referrals?: number;
  active_referrals?: number;
  referral_earnings?: number;
  referral_link?: string;
  qualified_referrals?: number;
  months_available_to_activate?: number;
  next_reward_in_referrals?: number;
}

interface ManualActivationResponse {
  activated_months: number;
  next_threshold: number;
  remaining_referrals_for_next: number;
  qualified_referrals: number;
}

const FAQ_ITEMS = [
  {
    q: "How does the referral program work?",
    a: "It's simple. Share your unique referral link or code with friends. When they sign up and make their first successful subscription payment, you get a 'qualified referral.' Once you hit 5 qualified referrals, you can activate a free month of our Core plan!"
  },
  {
    q: "What counts as a 'Qualified Referral'?",
    a: "A referral is considered 'qualified' only after the referred user completes their first successful subscription payment. Free trials or signups without a payment do not count toward your reward threshold."
  },
  {
    q: "Is there a limit to how many free months I can earn?",
    a: "No! You can stack rewards. Every 5 qualified referrals earns you another free month. If you have multiple rewards available, activating them will extend your subscription pause window accordingly."
  },
  {
    q: "How do I activate my rewards?",
    a: "Once you have at least 5 qualified referrals, an 'Activate' button will appear in your rewards section. Clicking it will pause your current billing cycle for 30 days, effectively giving you that month for free. No activation code is required!"
  },
  {
    q: "Why is my referral not showing as 'Qualified' yet?",
    a: "We maintain a standard 7-day hold period after a payment is made. This period allows us to verify the transaction and handle any initial refund requests. Once the 7 days pass, your referral will automatically move to 'Qualified' status."
  }
];

export function ReferralSection() {
  const [referralData, setReferralData] = useState<ReferralProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferralProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getReferralProfile();
      if (response.error) {
        setError(toSafeUserErrorMessage(response.error, response.status, 'Referral data currently unavailable.'));
        setReferralData(null);
      } else {
        setReferralData((response.data as ReferralProfile) || {});
      }
    } catch (err) {
      setError('Unable to load referral data. Please try again.');
      setReferralData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferralProfile();
  }, [loadReferralProfile]);

  const referralCode = referralData?.referral_code || '---';
  const referralLink = referralData?.referral_link || '';
  const totalReferrals = referralData?.total_referrals || 0;
  const activeReferrals = referralData?.active_referrals || 0;
  const qualifiedReferrals = referralData?.qualified_referrals || 0;
  
  const progressValue = (qualifiedReferrals % 5) * 20; // 5 = 100%
  const referralsToNext = 5 - (qualifiedReferrals % 5);
  const monthsAvailable = referralData?.months_available_to_activate ?? Math.floor(qualifiedReferrals / 5);

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === '---') return;
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
      }
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const shareLink = () => {
    if (!referralLink) {
      toast.error('Referral link not available');
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: 'PipFactor AI Trading',
        text: 'Join me on PipFactor AI for institutional-grade trading signals!',
        url: referralLink,
      }).catch(() => copyToClipboard(referralLink, 'Link'));
    } else {
      copyToClipboard(referralLink, 'Link');
    }
  };

  const handleActivate = async () => {
    if (monthsAvailable < 1) return;
    
    setActivating(true);
    try {
      const response = await apiService.activateReferralCode(''); // Empty code for standard activation
      if (response.error) {
        toast.error(toSafeUserErrorMessage(response.error, response.status, 'Failed to activate reward'));
      } else {
        const data = response.data as ManualActivationResponse;
        toast.success(`✓ Successfully activated ${data.activated_months} free month${data.activated_months > 1 ? 's' : ''}!`);
        await loadReferralProfile();
      }
    } catch (err) {
      toast.error('Activation failed. Please try again later.');
    } finally {
      setActivating(false);
    }
  };

  if (loading && !referralData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E2B485]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION 1: Referral Invite */}
      <section className={glassCard}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-[#E2B485]" />
            <h3 className="text-lg font-bold text-slate-100">Referral Invite</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={async () => {
              await loadReferralProfile();
              toast.success('Referral data refreshed');
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Referral Code</label>
            <div className="group relative flex items-center">
              <div className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-slate-200">
                {referralCode}
              </div>
              <button 
                onClick={() => copyToClipboard(referralCode, 'Code')}
                className="absolute right-2 p-1.5 text-slate-500 hover:text-[#E2B485] transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share Your Link</label>
            <div className="group relative flex items-center">
              <div className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-slate-400 text-sm truncate pr-10">
                {referralLink || 'Sign up to generate link'}
              </div>
              <button 
                onClick={shareLink}
                className="absolute right-2 p-1.5 text-slate-500 hover:text-[#E2B485] transition-colors"
                title="Share link"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Performance & Progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={glassCard}>
          <div className="mb-6 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#E2B485]" />
            <h3 className="text-lg font-bold text-slate-100">Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-100">{totalReferrals}</p>
            </div>
            <div className="space-y-1 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</p>
              <p className="text-2xl font-bold text-[#E2B485]">{activeReferrals}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span className="text-slate-500">Progress to Reward</span>
              <span className="text-[#E2B485]">{qualifiedReferrals % 5} / 5 Qualified</span>
            </div>
            <Progress value={progressValue} className="h-2 bg-white/5" />
            <p className="text-[11px] leading-relaxed text-slate-500 italic text-center">
              {referralsToNext} more qualified referral{referralsToNext !== 1 ? 's' : ''} until your next free month.
            </p>
          </div>
        </section>

        {/* SECTION 3: Rewards & Activation */}
        <section className={cn(glassCard, "relative overflow-hidden")}>
          {/* Subtle background glow */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#E2B485]/10 blur-3xl pointer-events-none" />
          
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-[#E2B485]" />
              <h3 className="text-lg font-bold text-slate-100">Available Rewards</h3>
            </div>
            {monthsAvailable > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#E2B485]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E2B485]">
                <Award className="h-3 w-3" /> Ready
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-200">Qualified Referrals</p>
                <p className="text-xs text-slate-500">Successfully verified payments</p>
              </div>
              <p className="text-xl font-bold text-slate-100">{qualifiedReferrals}</p>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-200">Earned Free Months</p>
                <p className="text-xs text-slate-500">Available to activate now</p>
              </div>
              <p className="text-xl font-bold text-emerald-400">{monthsAvailable}</p>
            </div>

            <Button
              className={cn(
                "w-full py-6 text-sm font-bold uppercase tracking-widest transition-all",
                monthsAvailable > 0 
                  ? "lumina-button" 
                  : "border-white/5 bg-white/5 text-slate-500 opacity-50 cursor-not-allowed"
              )}
              disabled={activating || monthsAvailable < 1}
              onClick={handleActivate}
            >
              {activating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Activate {monthsAvailable > 0 ? monthsAvailable : ''} Free Month{monthsAvailable > 1 ? 's' : ''}</>
              )}
            </Button>
            
            <p className="text-[10px] items-center gap-1.5 flex justify-center text-slate-500 text-center">
              <CheckCircle2 className="h-3 w-3" /> No code entry required. Click to apply to your current plan.
            </p>
          </div>
        </section>
      </div>

      {/* SECTION 4: FAQ Accordion (Landing Page Style) */}
      <section className={cn(glassCard, "relative overflow-hidden")}>
        {/* Decorative background like landing page */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E2B485]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
          {/* Left Column: Header */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-5 w-5 text-[#E2B485]" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E2B485]">Support</h3>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-100 mb-4">
              Referral <span className="text-[#E2B485]">FAQ</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Everything you need to know about our referral program, rewards, and how we verify your successful invites.
            </p>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="border border-[#C8935A]/20 bg-[#111315]/40 rounded-2xl px-6 py-1 overflow-hidden data-[state=open]:bg-[#C8935A]/5 transition-all shadow-sm"
                >
                  <AccordionTrigger className="text-sm md:text-base font-medium text-[#E0E0E0] hover:text-[#E2B485] py-4 hover:no-underline text-left transition-colors [&[data-state=open]]:text-[#E2B485]">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400 leading-relaxed text-sm pb-6 border-t border-[#C8935A]/10 mt-2 pt-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Bottom Footer Info */}
      <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-xs text-slate-500 leading-relaxed">
          The PipFactor Referral Program is governed by our terms of service.<br />
          Abuse of the program may result in disqualification and revocation of earned rewards.
        </p>
      </div>
    </div>
  );
}
