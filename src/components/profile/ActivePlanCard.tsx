import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPlanTier, normalizePlanName } from '@/components/subscription/planCatalog';
import { cn } from '@/lib/utils';

interface ActivePlanCardProps {
  setShowCheckoutModal: (show: boolean) => void;
  setShowManageBillingModal: (show: boolean) => void;
}

export function ActivePlanCard({ 
  setShowCheckoutModal, 
  setShowManageBillingModal 
}: ActivePlanCardProps) {
  const { 
    subscription, 
    subscriptionTier, 
    subscriptionStatus 
  } = useAuth();

  const normalizedTier = normalizePlanName(subscriptionTier);
  const tier = getPlanTier(normalizedTier);
  const displayedPlanName = tier.displayName;

  const isCancellationPending = Boolean(
    subscription && subscription.status === 'active' && subscription.cancel_at_period_end
  );

  return (
    <div className="lumina-card relative flex flex-col justify-between overflow-hidden border border-[#C8935A]/30 bg-gradient-to-br from-[#1A1C1E] to-[#0D0E10] p-6 shadow-2xl transition-all hover:shadow-[#E2B485]/10">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2B485]">Active Plan</p>
          <Badge className={cn(
            "border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            subscriptionStatus === 'active' ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"
          )}>
            {subscriptionStatus}
          </Badge>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{displayedPlanName}</h2>
        
        <div className="mt-8 space-y-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-slate-100 capitalize">{subscriptionStatus}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-slate-400">Expires</span>
            <span className="font-bold text-[#E2B485]">
              {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {isCancellationPending && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Cancellation Pending
          </div>
        )}
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowManageBillingModal(true)}
          className="border-[#C8935A]/40 bg-transparent text-xs font-bold uppercase tracking-wider text-[#E2B485] hover:bg-[#E2B485]/10"
        >
          Manage Billing
        </Button>
        <Button
          onClick={() => setShowCheckoutModal(true)}
          className="lumina-button border-none text-xs font-bold uppercase tracking-wider"
        >
          Open Checkout
        </Button>
      </div>
    </div>
  );
}
