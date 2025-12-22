/**
 * Custom hook for subscription management
 * Provides easy access to subscription data and actions
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionPlan, ActiveSubscriptionResponse } from '@/types/subscription';

export const useSubscription = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscriptionResponse | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription plans
  useEffect(() => {
    loadPlans();
  }, []);

  // Load user's current subscription when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCurrentSubscription();
    } else {
      setCurrentSubscription(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const loadPlans = async () => {
    try {
      setError(null);
      const data = await subscriptionService.getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Failed to load subscription plans');
    }
  };

  const loadCurrentSubscription = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const subscription = await subscriptionService.getActiveSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (err) {
      console.error('Failed to load current subscription:', err);
      setError('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user can access a specific trading pair
   */
  const canAccessPair = async (tradingPair: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      return await subscriptionService.canAccessPair(user.id, tradingPair);
    } catch (err) {
      console.error('Failed to check pair access:', err);
      return false;
    }
  };

  /**
   * Check if user has an active subscription
   */
  const hasActiveSubscription = (): boolean => {
    return currentSubscription?.is_current || false;
  };

  /**
   * Check if user is on a trial
   */
  const isOnTrial = (): boolean => {
    return currentSubscription?.is_trial && currentSubscription?.is_current || false;
  };

  /**
   * Get days remaining in current subscription
   */
  const getDaysRemaining = (): number => {
    return currentSubscription?.days_remaining || 0;
  };

  /**
   * Check if subscription is expiring soon (within 7 days)
   */
  const isExpiringSoon = (): boolean => {
    const days = getDaysRemaining();
    return days > 0 && days <= 7;
  };

  /**
   * Get the current plan details
   */
  const getCurrentPlan = (): SubscriptionPlan | null => {
    if (!currentSubscription) return null;
    return plans.find(p => p.name === currentSubscription.plan_name) || null;
  };

  /**
   * Check if user can upgrade (not on premium already)
   */
  const canUpgrade = (): boolean => {
    if (!currentSubscription) return true;
    return currentSubscription.plan_name !== 'premium';
  };

  /**
   * Get recommended upgrade plan
   */
  const getRecommendedUpgrade = (): SubscriptionPlan | null => {
    if (!currentSubscription) {
      return plans.find(p => p.name === 'basic') || null;
    }

    if (currentSubscription.plan_name === 'free') {
      return plans.find(p => p.name === 'basic') || null;
    }

    if (currentSubscription.plan_name === 'basic') {
      return plans.find(p => p.name === 'premium') || null;
    }

    return null;
  };

  /**
   * Create a new subscription
   */
  const subscribe = async (
    planId: string,
    options?: {
      paymentProvider?: 'stripe' | 'razorpay' | 'paypal' | 'manual';
      externalId?: string;
      trialDays?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<string | null> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const subscriptionId = await subscriptionService.createSubscription(
        user.id,
        planId,
        options
      );
      
      // Reload current subscription
      await loadCurrentSubscription();
      
      return subscriptionId;
    } catch (err) {
      console.error('Failed to create subscription:', err);
      throw err;
    }
  };

  /**
   * Cancel current subscription
   */
  const cancelSubscription = async (immediate: boolean = false): Promise<boolean> => {
    if (!currentSubscription?.subscription_id) {
      throw new Error('No active subscription to cancel');
    }

    try {
      const success = await subscriptionService.cancelSubscription(
        currentSubscription.subscription_id,
        immediate
      );
      
      // Reload current subscription
      await loadCurrentSubscription();
      
      return success;
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      throw err;
    }
  };

  /**
   * Renew current subscription
   */
  const renewSubscription = async (paymentId?: string): Promise<boolean> => {
    if (!currentSubscription?.subscription_id) {
      throw new Error('No subscription to renew');
    }

    try {
      const success = await subscriptionService.renewSubscription(
        currentSubscription.subscription_id,
        paymentId
      );
      
      // Reload current subscription
      await loadCurrentSubscription();
      
      return success;
    } catch (err) {
      console.error('Failed to renew subscription:', err);
      throw err;
    }
  };

  return {
    // State
    currentSubscription,
    plans,
    loading,
    error,
    
    // Computed values
    hasActiveSubscription: hasActiveSubscription(),
    isOnTrial: isOnTrial(),
    daysRemaining: getDaysRemaining(),
    isExpiringSoon: isExpiringSoon(),
    currentPlan: getCurrentPlan(),
    canUpgrade: canUpgrade(),
    recommendedUpgrade: getRecommendedUpgrade(),
    
    // Actions
    canAccessPair,
    subscribe,
    cancelSubscription,
    renewSubscription,
    refresh: loadCurrentSubscription,
  };
};

export default useSubscription;
