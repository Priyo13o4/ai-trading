/**
 * useSymbols Hook - Dynamic symbol management for frontend
 * Fetches available trading symbols from the backend API on mount
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchSymbols, 
  getDefaultSymbols,
  SymbolsResponse, 
  SymbolMetadata 
} from '@/services/symbolsService';

interface UseSymbolsReturn {
  symbols: string[];
  metadata: Record<string, SymbolMetadata>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getDisplayName: (symbol: string) => string;
  getPrecision: (symbol: string) => number;
  isCommidity: (symbol: string) => boolean;
}

export function useSymbols(): UseSymbolsReturn {
  const [data, setData] = useState<SymbolsResponse>(getDefaultSymbols());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSymbols = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSymbols();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load symbols');
      // Keep default symbols on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSymbols();
  }, [loadSymbols]);

  const getDisplayName = useCallback((symbol: string): string => {
    if (data.metadata && data.metadata[symbol]) {
      return data.metadata[symbol].name;
    }
    return symbol;
  }, [data.metadata]);

  const getPrecision = useCallback((symbol: string): number => {
    if (data.metadata && data.metadata[symbol]) {
      return data.metadata[symbol].precision;
    }
    return symbol.includes('JPY') ? 3 : (symbol.includes('XAU') ? 2 : 5);
  }, [data.metadata]);

  const isCommidity = useCallback((symbol: string): boolean => {
    if (data.metadata && data.metadata[symbol]) {
      return data.metadata[symbol].type === 'commodity';
    }
    return symbol.startsWith('XAU') || symbol.startsWith('XAG');
  }, [data.metadata]);

  return {
    symbols: data.symbols,
    metadata: data.metadata,
    loading,
    error,
    refresh: loadSymbols,
    getDisplayName,
    getPrecision,
    isCommidity,
  };
}

export default useSymbols;
