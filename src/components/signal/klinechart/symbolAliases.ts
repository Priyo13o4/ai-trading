/**
 * Symbol Aliases
 * 
 * Provides a mapping for instrument aliases to ensure news events 
 * natively tagging different terminologies (e.g., GOLD vs XAUUSD) 
 * will seamlessly match the active chart symbol.
 */

const ALIAS_MAP: Record<string, string[]> = {
  // Gold
  XAUUSD: ['XAUUSD', 'GOLD', 'XAU'],
  GOLD: ['XAUUSD', 'GOLD', 'XAU'],
  XAU: ['XAUUSD', 'GOLD', 'XAU'],
  
  // Silver
  XAGUSD: ['XAGUSD', 'SILVER', 'XAG'],
  SILVER: ['XAGUSD', 'SILVER', 'XAG'],
  
  // Crypto
  BTCUSD: ['BTCUSD', 'BTC', 'BITCOIN'],
  BTC: ['BTCUSD', 'BTC', 'BITCOIN'],
  ETHUSD: ['ETHUSD', 'ETH', 'ETHEREUM'],
  ETH: ['ETHUSD', 'ETH', 'ETHEREUM'],
  
  // Indices
  NAS100: ['NAS100', 'NASDAQ100', 'US100', 'NASDAQ'],
  NASDAQ100: ['NAS100', 'NASDAQ100', 'US100', 'NASDAQ'],
  US100: ['NAS100', 'NASDAQ100', 'US100', 'NASDAQ'],
  
  US30: ['US30', 'DOWJONES', 'DOW'],
  US500: ['US500', 'SPX500', 'SPX', 'S&P500'],
  SPX500: ['US500', 'SPX500', 'SPX', 'S&P500'],
  
  // Oil
  WTI: ['WTI', 'USOIL', 'USCRUDE', 'OIL'],
  USOIL: ['WTI', 'USOIL', 'USCRUDE', 'OIL'],
  USCRUDE: ['WTI', 'USOIL', 'USCRUDE', 'OIL'],
  UKOIL: ['UKOIL', 'BRENT', 'OIL'],
};

/**
 * Returns an array of valid alias strings for a given normalized symbol.
 * If no aliases are defined, returns an array containing just the normalized symbol.
 */
export const getSymbolAliases = (normalizedSymbol: string): string[] => {
  if (!normalizedSymbol) return [];
  
  const aliases = ALIAS_MAP[normalizedSymbol];
  if (aliases && aliases.length > 0) {
    return aliases;
  }
  
  return [normalizedSymbol];
};
