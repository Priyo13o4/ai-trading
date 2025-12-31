/**
 * Symbols Service - Dynamic symbol management
 * Fetches available trading symbols from the backend API
 */

import { apiService } from './api';

// Types
export interface SymbolMetadata {
  name: string;
  type: 'forex' | 'commodity' | 'crypto' | 'unknown';
  precision: number;
}

export interface SymbolsResponse {
  symbols: string[];
  metadata: Record<string, SymbolMetadata>;
  count: number;
}

// Cache for symbols data
let cachedSymbols: SymbolsResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch available trading symbols from API
 */
export async function fetchSymbols(): Promise<SymbolsResponse> {
  // Check cache
  const now = Date.now();
  if (cachedSymbols && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSymbols;
  }

  try {
    const response = await apiService.get('/api/symbols');
    
    if (response && response.symbols) {
      cachedSymbols = response as SymbolsResponse;
      cacheTimestamp = now;
      return cachedSymbols;
    }
    
    // Fallback to defaults if API fails
    console.warn('Failed to fetch symbols, using defaults');
    return getDefaultSymbols();
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return getDefaultSymbols();
  }
}

/**
 * Get default symbols (fallback)
 */
export function getDefaultSymbols(): SymbolsResponse {
  return {
    symbols: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'],
    metadata: {
      XAUUSD: { name: 'Gold', type: 'commodity', precision: 2 },
      EURUSD: { name: 'EUR/USD', type: 'forex', precision: 5 },
      GBPUSD: { name: 'GBP/USD', type: 'forex', precision: 5 },
      USDJPY: { name: 'USD/JPY', type: 'forex', precision: 3 },
      AUDUSD: { name: 'AUD/USD', type: 'forex', precision: 5 },
    },
    count: 5
  };
}

/**
 * Get symbol display name
 */
export function getSymbolDisplayName(symbol: string, metadata?: Record<string, SymbolMetadata>): string {
  if (metadata && metadata[symbol]) {
    return metadata[symbol].name;
  }
  return symbol;
}

/**
 * Get symbol precision
 */
export function getSymbolPrecision(symbol: string, metadata?: Record<string, SymbolMetadata>): number {
  if (metadata && metadata[symbol]) {
    return metadata[symbol].precision;
  }
  // Default precision based on symbol type
  return symbol.includes('JPY') ? 3 : (symbol.includes('XAU') ? 2 : 5);
}

/**
 * Check if symbol is commodity
 */
export function isCommidity(symbol: string, metadata?: Record<string, SymbolMetadata>): boolean {
  if (metadata && metadata[symbol]) {
    return metadata[symbol].type === 'commodity';
  }
  return symbol.startsWith('XAU') || symbol.startsWith('XAG');
}

/**
 * Clear symbols cache
 */
export function clearSymbolsCache(): void {
  cachedSymbols = null;
  cacheTimestamp = 0;
}
