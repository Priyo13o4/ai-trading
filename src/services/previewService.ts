import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SignalPreview {
  id: string;
  trading_pair: string;
  signal_data: any;
  signal_time: string;
  is_current: boolean;
  created_at: string;
}

export class PreviewService {
  /**
   * Get the latest preview signal for main page display
   * This is publicly accessible (no auth required)
   */
  static async getLatestPreview(tradingPair: string = 'XAUUSD'): Promise<SignalPreview | null> {
    try {
      const { data, error } = await supabase
        .from('signal_previews')
        .select('*')
        .eq('trading_pair', tradingPair)
        .order('signal_time', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching preview:', error);
        return null;
      }

      return data as SignalPreview;
    } catch (err) {
      console.error('Preview fetch error:', err);
      return null;
    }
  }

  /**
   * Get old preview signal (2 signals back) for main page teaser
   */
  static async getOldPreview(tradingPair: string = 'XAUUSD'): Promise<SignalPreview | null> {
    try {
      const { data, error } = await supabase
        .from('signal_previews')
        .select('*')
        .eq('trading_pair', tradingPair)
        .order('signal_time', { ascending: false })
        .limit(1)
        .range(1, 1); // Get the 2nd most recent (0-indexed, so index 1)

      if (error || !data || data.length === 0) {
        console.error('Error fetching old preview:', error);
        return null;
      }

      return data[0] as SignalPreview;
    } catch (err) {
      console.error('Old preview fetch error:', err);
      return null;
    }
  }

  /**
   * Check if we have enough preview data
   */
  static async hasPreviewData(tradingPair: string = 'XAUUSD'): Promise<boolean> {
    try {
      const { count } = await supabase
        .from('signal_previews')
        .select('*', { count: 'exact', head: true })
        .eq('trading_pair', tradingPair);

      return (count ?? 0) >= 2; // Need at least 2 signals for "old" preview
    } catch (err) {
      console.error('Preview data check error:', err);
      return false;
    }
  }
}

/**
 * Hook for using preview data in components
 */
export function usePreviewSignal(tradingPair: string = 'XAUUSD') {
  const [previewSignal, setPreviewSignal] = useState<SignalPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get old preview (2 signals back) for main page teaser
      const preview = await PreviewService.getOldPreview(tradingPair);
      setPreviewSignal(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [tradingPair]);

  return { previewSignal, isLoading, error, refetch: fetchPreview };
}
