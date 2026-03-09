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
