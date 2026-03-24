/**
 * Subscription Types
 * Based on supabase_migration_v3.sql schema
 */

export interface SubscriptionPlan {
  id: string;
  name: 'trial' | 'core' | 'starter' | 'professional' | 'elite';
  display_name: string;
  description: string;
  price_usd: number;
  billing_period: 'monthly' | 'yearly' | 'lifetime';
  features: Record<string, unknown>;
  pairs_allowed: string[];
  ai_analysis_enabled: boolean;
  priority_support: boolean;
  api_access_enabled: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending_activation' | 'suspended';
  started_at: string;
  expires_at: string;
  trial_ends_at?: string;
  cancelled_at?: string;
  payment_provider?: 'stripe' | 'razorpay' | 'paypal' | 'coinbase' | 'plisio' | 'manual';
  external_subscription_id?: string;
  last_payment_amount?: number;
  last_payment_date?: string;
  next_billing_date?: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActiveSubscriptionResponse {
  subscription_id: string;
  plan_name: string;
  display_name: string;
  status: string;
  started_at: string;
  expires_at: string;
  days_remaining: number;
  is_trial: boolean;
  is_current: boolean;
  pairs_allowed: string[];
  features: Record<string, unknown>;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  provider: string;
  external_payment_id?: string;
  external_invoice_id?: string;
  invoice_url?: string;
  receipt_url?: string;
  payment_method_type?: string;
  payment_method_last4?: string;
  failure_reason?: string;
  failure_code?: string;
  refunded_at?: string;
  refund_amount?: number;
  refund_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserPairSelection {
  id: string;
  user_id: string;
  subscription_id: string;
  selected_pairs: string[];
  locked_until?: string;
  can_change_pairs: boolean;
  last_changed_at: string;
  change_count: number;
  created_at: string;
  updated_at: string;
}

export interface PairSelectionResponse {
  success: boolean;
  error?: string;
  selected_pairs?: string[];
  locked_until?: string;
}
