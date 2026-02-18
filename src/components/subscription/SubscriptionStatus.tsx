import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Crown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanTier } from '@/components/subscription/planCatalog';
import { toast } from 'sonner';

export const SubscriptionStatus = () => {
  const navigate = useNavigate();
  const {
    currentSubscription,
    loading,
    hasActiveSubscription,
    isOnTrial,
    daysRemaining,
    isExpiringSoon,
    currentPlan,
    canUpgrade,
    recommendedUpgrade,
    cancelSubscription,
  } = useSubscription();

  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.'
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      await cancelSubscription(false);
      toast.success('Subscription cancellation scheduled for period end.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = () => navigate('/pricing');

  if (loading) {
    return (
      <Card className="sa-scope sa-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-slate-300">
            Loading subscription...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentSubscription) {
    return (
      <Card className="sa-scope sa-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="h-5 w-5 text-amber-300" />
            No Active Subscription
          </CardTitle>
          <CardDescription className="sa-muted">
            Choose a plan to unlock trading signals and analysis.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleUpgrade} className="sa-btn-accent w-full">
            View Plans
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const planTier = getPlanTier(currentSubscription.plan_name);
  const totalDays = isOnTrial ? 3 : 30;
  const progressPercentage = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));

  return (
    <Card className="sa-scope sa-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className={`h-5 w-5 ${planTier.accentClass}`} />
              {planTier.displayName}
            </CardTitle>
            <CardDescription className="mt-1 sa-muted">
              {currentPlan?.description || planTier.description}
            </CardDescription>
          </div>
          <Badge className={hasActiveSubscription ? 'sa-badge-success' : 'sa-badge-danger'}>
            {currentSubscription.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isOnTrial && (
          <Alert className="sa-card-muted border border-blue-500/35">
            <AlertCircle className="h-4 w-4 text-blue-300" />
            <AlertDescription className="text-blue-200">
              You are currently on a trial period. Upgrade any time to keep full access.
            </AlertDescription>
          </Alert>
        )}

        {isExpiringSoon && !currentSubscription.auto_renew && (
          <Alert className="sa-card-muted border border-amber-400/35">
            <AlertCircle className="h-4 w-4 text-amber-300" />
            <AlertDescription className="text-amber-200">
              Your subscription expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}.
            </AlertDescription>
          </Alert>
        )}

        {currentSubscription.cancel_at_period_end && (
          <Alert className="sa-card-muted border border-rose-400/35">
            <XCircle className="h-4 w-4 text-rose-300" />
            <AlertDescription className="text-rose-200">
              Subscription ends on{' '}
              {new Date(currentSubscription.expires_at).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="sa-muted">Status</span>
            <span className={hasActiveSubscription ? 'text-emerald-300' : 'text-rose-300'}>
              {hasActiveSubscription ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Expired
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="sa-muted">Started</span>
            <span className="text-white">
              {new Date(currentSubscription.started_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="sa-muted">
              {currentSubscription.cancel_at_period_end ? 'Ends' : 'Renews'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-white">
              <Calendar className="h-4 w-4 sa-muted" />
              {new Date(currentSubscription.expires_at).toLocaleDateString()}
            </span>
          </div>

          {hasActiveSubscription && (
            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="sa-muted">Days Remaining</span>
                <span className={isExpiringSoon ? 'text-amber-300' : 'text-white'}>
                  {daysRemaining}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-slate-800" />
            </div>
          )}

          <div className="border-t border-slate-700/60 pt-3">
            <span className="mb-2 block sa-muted">Trading Pairs</span>
            <div className="flex flex-wrap gap-2">
              {currentSubscription.pairs_allowed.map((pair) => (
                <Badge key={pair} className="sa-badge-info">
                  {pair}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {canUpgrade && recommendedUpgrade && hasActiveSubscription && (
          <Button onClick={handleUpgrade} className="sa-btn-accent w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade to {recommendedUpgrade.display_name}
          </Button>
        )}

        {!hasActiveSubscription && (
          <Button onClick={handleUpgrade} className="sa-btn-accent w-full">
            Renew Subscription
          </Button>
        )}

        {hasActiveSubscription &&
          !currentSubscription.cancel_at_period_end &&
          currentSubscription.status !== 'trial' && (
            <Button
              onClick={handleCancel}
              disabled={cancelling}
              variant="outline"
              className="sa-btn-neutral w-full"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          )}

        <Button onClick={handleUpgrade} variant="ghost" className="sa-btn-ghost w-full">
          View All Plans
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionStatus;
