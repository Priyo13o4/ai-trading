/**
 * Subscription Status Component
 * Displays current subscription information with upgrade options
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
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
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      return;
    }

    try {
      setCancelling(true);
      await cancelSubscription(false); // Cancel at period end
      toast.success('Subscription cancelled. You can continue using it until the end of your billing period.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400">Loading subscription...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentSubscription) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            No Active Subscription
          </CardTitle>
          <CardDescription className="text-slate-400">
            Start your free trial to access trading signals
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleUpgrade} className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-900">
            Start Free Trial
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate progress percentage for trial/subscription period
  const totalDays = isOnTrial ? 3 : 30; // Assuming 3 days trial or 30 days for paid
  const progressPercentage = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#D4AF37]" />
              {currentSubscription.display_name}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {currentPlan?.description || 'Your current subscription plan'}
            </CardDescription>
          </div>
          <Badge 
            variant={hasActiveSubscription ? 'default' : 'destructive'}
            className={hasActiveSubscription ? 'bg-green-600' : 'bg-red-600'}
          >
            {currentSubscription.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trial Badge */}
        {isOnTrial && (
          <Alert className="bg-blue-900/30 border-blue-400/30">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              You're on a free trial. Upgrade anytime to continue after trial ends.
            </AlertDescription>
          </Alert>
        )}

        {/* Expiring Soon Warning */}
        {isExpiringSoon && !currentSubscription.auto_renew && (
          <Alert className="bg-yellow-900/30 border-yellow-400/30">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              Your subscription expires in {daysRemaining} days. Renew to continue accessing all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Cancelled Subscription */}
        {currentSubscription.cancel_at_period_end && (
          <Alert className="bg-red-900/30 border-red-400/30">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              Your subscription is set to cancel on {new Date(currentSubscription.expires_at).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold flex items-center gap-2 ${
              hasActiveSubscription ? 'text-green-400' : 'text-red-400'
            }`}>
              {hasActiveSubscription ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Expired
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Started:</span>
            <span className="text-white">
              {new Date(currentSubscription.started_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {currentSubscription.cancel_at_period_end ? 'Ends' : 'Renews'}:
            </span>
            <span className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(currentSubscription.expires_at).toLocaleDateString()}
            </span>
          </div>

          {hasActiveSubscription && (
            <>
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Days Remaining:</span>
                  <span className={`font-semibold ${
                    isExpiringSoon ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {daysRemaining} days
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </>
          )}

          {/* Trading Pairs */}
          <div className="pt-2 border-t border-slate-700">
            <span className="text-slate-400 text-sm block mb-2">Trading Pairs:</span>
            <div className="flex flex-wrap gap-2">
              {currentSubscription.pairs_allowed.map((pair) => (
                <Badge key={pair} variant="outline" className="bg-blue-900/30 text-blue-200 border-blue-400/30">
                  {pair}
                </Badge>
              ))}
            </div>
          </div>

          {/* Plan Features */}
          {currentPlan && Object.keys(currentPlan.features).length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <span className="text-slate-400 text-sm block mb-2">Features:</span>
              <div className="space-y-1">
                {currentPlan.ai_analysis_enabled && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    AI-powered analysis
                  </div>
                )}
                {currentPlan.priority_support && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Priority support
                  </div>
                )}
                {currentPlan.api_access_enabled && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    API access
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {/* Upgrade Button */}
        {canUpgrade && recommendedUpgrade && hasActiveSubscription && (
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-900"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade to {recommendedUpgrade.display_name}
          </Button>
        )}

        {/* Renew Button for Expired */}
        {!hasActiveSubscription && (
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-900"
          >
            Renew Subscription
          </Button>
        )}

        {/* Cancel Button */}
        {hasActiveSubscription && !currentSubscription.cancel_at_period_end && currentSubscription.status !== 'trial' && (
          <Button 
            onClick={handleCancel}
            disabled={cancelling}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        )}

        {/* View All Plans */}
        <Button 
          onClick={handleUpgrade}
          variant="ghost"
          className="w-full text-slate-400 hover:text-white"
        >
          View All Plans
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionStatus;
