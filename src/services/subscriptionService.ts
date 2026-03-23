/**
 * Subscription Service
 * Handles all subscription-related API calls to Supabase
 */

import { supabase } from '@/lib/supabase';
import type { 
  SubscriptionPlan, 
  UserSubscription,
  ActiveSubscriptionResponse,
  PaymentHistory,
  UserPairSelection,
  PairSelectionResponse
} from '@/types/subscription';

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get user's active/current subscription
   * Uses the get_active_subscription() database function
   */
  async getActiveSubscription(userId: string): Promise<ActiveSubscriptionResponse | null> {
    const { data, error } = await supabase
      .rpc('get_active_subscription', { p_user_id: userId });

    if (error) {
      console.error('Error fetching active subscription:', error);
      throw error;
    }

    return data?.[0] || null;
  }

  /**
   * Check if user can access a specific trading pair
   * Uses the can_access_pair() database function
   */
  async canAccessPair(userId: string, tradingPair: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_access_pair', { 
        p_user_id: userId,
        p_trading_pair: tradingPair 
      });

    if (error) {
      console.error('Error checking pair access:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Create a new subscription
   * Uses the create_subscription() database function
   */
  async createSubscription(
    userId: string,
    planId: string,
    options?: {
      paymentProvider?: 'stripe' | 'razorpay' | 'paypal' | 'plisio' | 'manual';
      externalId?: string;
      trialDays?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_subscription', {
        p_user_id: userId,
        p_plan_id: planId,
        p_payment_provider: options?.paymentProvider || 'manual',
        p_external_id: options?.externalId || null,
        p_trial_days: options?.trialDays || 0,
        p_metadata: options?.metadata || {}
      });

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Cancel a subscription
   * Uses the cancel_subscription() database function
   */
  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('cancel_subscription', {
        p_subscription_id: subscriptionId,
        p_immediate: immediate
      });

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }

    return data || false;
  }

  /**
   * Renew a subscription
   * Uses the renew_subscription() database function
   */
  async renewSubscription(subscriptionId: string, paymentId?: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('renew_subscription', {
        p_subscription_id: subscriptionId,
        p_payment_id: paymentId || null
      });

    if (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }

    return data || false;
  }

  /**
   * Get user's subscription history
   */
  async getSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Record a payment
   * Uses the record_payment() database function
   */
  async recordPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    provider: string,
    externalPaymentId: string,
    status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled' = 'succeeded',
    metadata?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('record_payment', {
        p_user_id: userId,
        p_subscription_id: subscriptionId,
        p_amount: amount,
        p_currency: currency,
        p_provider: provider,
        p_external_payment_id: externalPaymentId,
        p_status: status,
        p_metadata: metadata || {}
      });

    if (error) {
      console.error('Error recording payment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Select trading pairs for Starter/Professional plans
   * Uses the select_trading_pairs() database function
   */
  async selectTradingPairs(userId: string, selectedPairs: string[]): Promise<PairSelectionResponse> {
    const { data, error } = await supabase
      .rpc('select_trading_pairs', {
        p_user_id: userId,
        p_selected_pairs: selectedPairs
      });

    if (error) {
      console.error('Error selecting trading pairs:', error);
      throw error;
    }

    return data as PairSelectionResponse;
  }

  /**
   * Get user's selected trading pairs
   */
  async getUserPairSelections(userId: string): Promise<UserPairSelection[]> {
    const { data, error } = await supabase
      .from('user_pair_selections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pair selections:', error);
      throw error;
    }

    return data || [];
  }

}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
