/**
 * API Response Parsers for FastAPI Backend
 * Transforms FastAPI responses into the UI format expected by the frontend
 */

import type { UIStrategy } from "@/types/signal";

// Transform FastAPI signal response to UI format
export function parseSignalFromAPI(apiResponse: any): UIStrategy | null {
  try {
    if (!apiResponse) return null;

    // The FastAPI returns the signal data directly, not in the n8n nested format
    const signal = apiResponse;

    return {
      strategyName: signal.strategy_name || 'Unknown Strategy',
      direction: signal.direction?.toUpperCase() === 'LONG' ? 'BUY' : 'SELL',
      entry: signal.entry_level || signal.entry || 0,
      takeProfit: signal.take_profit || signal.tp,
      stopLoss: signal.stop_loss || signal.sl,
      timeframe: signal.timeframe,
      confidenceText: signal.confidence || 'Medium',
      confidencePercent: mapConfidenceToPercent(signal.confidence),
      riskReward: signal.risk_reward_ratio || signal.rr,
      status: computeSignalStatus(signal.timestamp, signal.expiry_minutes),
      timestamp: signal.timestamp,
      expiryMinutes: signal.expiry_minutes,
      symbol: signal.pair || signal.symbol,
    };
  } catch (error) {
    console.error('Failed to parse signal from API:', error);
    return null;
  }
}

// Transform FastAPI regime response to UI format  
export function parseRegimeFromAPI(apiResponse: any): string | null {
  try {
    if (!apiResponse) return null;
    
    // Handle both string responses and object responses
    if (typeof apiResponse === 'string') {
      return apiResponse;
    }
    
    return apiResponse.regime_text || apiResponse.text || apiResponse.description || null;
  } catch (error) {
    console.error('Failed to parse regime from API:', error);
    return null;
  }
}

// Transform FastAPI current news response to UI format
export function parseCurrentNewsFromAPI(apiResponse: any[]): { id: string; text: string }[] {
  try {
    if (!Array.isArray(apiResponse)) return [];
    
    return apiResponse.map((item, index) => ({
      id: item.id || `news-${index}`,
      text: item.content || item.text || item.summary || item.title || '',
    })).filter(item => item.text.length > 0);
  } catch (error) {
    console.error('Failed to parse current news from API:', error);
    return [];
  }
}

// Transform FastAPI upcoming news response to UI format
export function parseUpcomingNewsFromAPI(apiResponse: any): 
  { mode: "text"; text: string } | { mode: "html"; items: { id: string; html: string }[] } | null {
  try {
    if (!apiResponse) return null;
    
    if (Array.isArray(apiResponse)) {
      // Handle array of news items
      const items = apiResponse.map((item, index) => ({
        id: item.id || `upcoming-${index}`,
        html: item.content || item.html || item.text || '',
      })).filter(item => item.html.length > 0);
      
      return items.length > 0 ? { mode: "html", items } : null;
    }
    
    // Handle single text response
    const text = apiResponse.text || apiResponse.content || '';
    return text ? { mode: "text", text } : null;
  } catch (error) {
    console.error('Failed to parse upcoming news from API:', error);
    return null;
  }
}

// Helper functions
function mapConfidenceToPercent(confidence?: string): number | undefined {
  if (!confidence) return undefined;
  
  const conf = confidence.toLowerCase();
  if (conf.includes('high')) return 85;
  if (conf.includes('medium')) return 65;
  if (conf.includes('low')) return 40;
  
  // Try to extract numeric value if it exists
  const numMatch = confidence.match(/(\d+)%?/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  
  return undefined;
}

function computeSignalStatus(timestamp?: string, expiryMinutes?: number): "Active" | "Expired" {
  if (!timestamp || !expiryMinutes) return "Active";
  
  try {
    const signalTime = new Date(timestamp).getTime();
    const expiryTime = signalTime + (expiryMinutes * 60 * 1000);
    return Date.now() <= expiryTime ? "Active" : "Expired";
  } catch {
    return "Active";
  }
}
