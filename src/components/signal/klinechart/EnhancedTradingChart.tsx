/**
 * Enhanced Trading Chart - KLineChart Implementation
 * 
 * A professional trading chart component using KLineChart library.
 * Features:
 * - Real-time SSE price updates
 * - Lazy loading historical data
 * - Technical indicators (EMA, SMA, RSI, MACD, Bollinger, ATR)
 * - Strategy overlays (Entry, TP, SL lines)
 * - Dark theme optimized
 */

import React, { useCallback, useEffect, useState, useMemo, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown } from 'lucide-react';

import { useKLineChart } from './useKLineChart';
import { useIndicatorManager } from './useIndicatorManager';
import { useStrategyManager } from './useStrategyManager';
import { ChartControls } from './ChartControls';

import type { EnhancedTradingChartProps } from './types';
import { TIMEFRAMES } from './constants';
import { getPrecisionForSymbol } from './utils';

/**
 * Check if forex market is currently open
 */
const isForexMarketOpen = (): boolean => {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();

  // Market closed: Saturday, and Sunday until 21:00 UTC
  if (utcDay === 6) return false; // Saturday
  if (utcDay === 0 && utcHours < 21) return false; // Sunday before 21:00 UTC
  // Friday close at 21:00 UTC
  if (utcDay === 5 && utcHours >= 21) return false;

  return true;
};

/**
 * Get market status display info
 */
const getMarketStatus = () => {
  const isOpen = isForexMarketOpen();
  return {
    isOpen,
    label: isOpen ? 'Market Open' : 'Market Closed',
    color: isOpen ? 'bg-green-500' : 'bg-red-500',
    textColor: isOpen ? 'text-green-400' : 'text-red-400',
  };
};

/**
 * Enhanced Trading Chart Component
 */
export const EnhancedTradingChart: React.FC<EnhancedTradingChartProps> = ({
  symbol,
  timeframe: initialTimeframe,
  onTimeframeChange,
  availableSymbols,
  symbolMetadata,
  onSymbolChange,
}) => {
  // Generate unique container ID for this chart instance
  const uniqueId = useId();
  const containerId = `klinechart-${uniqueId.replace(/:/g, '-')}`;
  
  // State
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [showNewsMarkers, setShowNewsMarkers] = useState(false);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  
  // KLineChart hook
  const {
    chartRef,
    state,
    dataRef,
    initChart,
    destroyChart,
    loadData,
    createIndicator,
    removeIndicator,
    createStrategyOverlay,
    removeOverlay,
    scrollToRealTime,
    resize,
  } = useKLineChart({
    containerId,
    symbol,
    timeframe,
  });

  // Indicator manager hook
  const {
    indicators,
    toggleIndicator,
    getActiveOverlayCount,
    getActiveOscillatorCount,
    syncIndicatorsWithChart,
  } = useIndicatorManager({
    createIndicator,
    removeIndicator,
  });

  // Strategy manager hook
  const {
    strategy,
    showStrategy,
    toggleStrategy,
    fetchStrategy,
    syncStrategyWithChart,
  } = useStrategyManager({
    symbol,
    createStrategyOverlay,
    removeOverlay,
  });

  // Initialize chart on mount
  useEffect(() => {
    console.log('[EnhancedTradingChart] Component mounted with symbol=' + symbol + ', timeframe=' + timeframe);
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initChart();
    }, 100);
    
    return () => {
      console.log('[EnhancedTradingChart] Component unmounting - cleaning up chart');
      clearTimeout(timer);
      destroyChart();
    };
  }, [initChart, destroyChart]);

  // Sync indicators after chart is initialized
  useEffect(() => {
    if (chartRef.current && !state.loading) {
      syncIndicatorsWithChart();
    }
  }, [chartRef.current, state.loading, syncIndicatorsWithChart]);

  // Fetch strategy when symbol changes
  useEffect(() => {
    fetchStrategy();
  }, [symbol, fetchStrategy]);

  // Sync strategy overlays when strategy data or visibility changes
  useEffect(() => {
    if (chartRef.current) {
      syncStrategyWithChart();
    }
  }, [chartRef.current, strategy, showStrategy, syncStrategyWithChart]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
  }, [onTimeframeChange]);

  // Note: Removed automatic reload on symbol/timeframe change
  // The chart will reload automatically via getBars when setPeriod/setSymbol is called
  // This prevents double-loading and unnecessary resets

  // Handle resize
  useEffect(() => {
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resize]);

  // Handle news toggle
  const handleToggleNews = useCallback(() => {
    setShowNewsMarkers(prev => !prev);
    // TODO: Implement news markers overlay
  }, []);

  // Market status
  const marketStatus = useMemo(() => getMarketStatus(), []);

  // Get current price from data
  const priceInfo = useMemo(() => {
    const data = dataRef.current;
    if (data.length < 2) return null;

    const currentBar = data[data.length - 1];
    const prevBar = data[data.length - 2];

    if (!currentBar || !prevBar) return null;

    const precision = getPrecisionForSymbol(symbol);

    const price = currentBar.close;
    const change = currentBar.close - prevBar.close;
    const changePercent = prevBar.close !== 0
      ? ((change / prevBar.close) * 100)
      : 0;

    return {
      price: price.toFixed(precision),
      change: change.toFixed(precision),
      changePercent: changePercent.toFixed(2),
      isPositive: change >= 0,
    };
  }, [dataRef.current.length, symbol]);

  // Current timeframe label
  const currentTimeframeLabel = TIMEFRAMES.find(tf => tf.value === timeframe)?.label || timeframe;

  // Get symbol display name
  const getSymbolDisplayName = useCallback((sym: string) => {
    if (symbolMetadata && symbolMetadata[sym]) {
      return symbolMetadata[sym].name;
    }
    return sym;
  }, [symbolMetadata]);

  // Handle symbol change
  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (onSymbolChange && newSymbol !== symbol) {
      onSymbolChange(newSymbol);
    }
  }, [onSymbolChange, symbol]);

  return (
    <Card className="bg-[#0a0e14] border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div>
              {/* Symbol Selector integrated into title */}
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                {availableSymbols && availableSymbols.length > 1 && onSymbolChange ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-xl font-bold text-white hover:bg-transparent hover:text-orange-400 flex items-center gap-1"
                      >
                        <span>{getSymbolDisplayName(symbol)}</span>
                        <ChevronDown className="w-5 h-5 text-orange-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0f1419] border-slate-700 min-w-[180px]">
                      {availableSymbols.map((sym) => (
                        <DropdownMenuItem
                          key={sym}
                          onClick={() => handleSymbolChange(sym)}
                          className={`text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer ${
                            sym === symbol ? 'bg-orange-500/20 text-orange-400' : ''
                          }`}
                        >
                          <span className="font-medium">{getSymbolDisplayName(sym)}</span>
                          <span className="ml-2 text-slate-500 text-xs">{sym}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span>{getSymbolDisplayName(symbol)}</span>
                )}
                <Badge className={`ml-2 ${marketStatus.color} text-white text-xs`}>
                  {marketStatus.label}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400 flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3" />
                {currentTimeframeLabel} Chart
                {symbol !== getSymbolDisplayName(symbol) && (
                  <span className="text-slate-500">• {symbol}</span>
                )}
              </CardDescription>
            </div>
          </div>

          {/* Price Display */}
          {priceInfo && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white font-mono">
                  {priceInfo.price}
                </div>
                <div className={`flex items-center gap-1 justify-end ${
                  priceInfo.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceInfo.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {priceInfo.isPositive ? '+' : ''}{priceInfo.change} ({priceInfo.changePercent}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart Controls */}
        <ChartControls
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
          showIndicatorPanel={showIndicatorPanel}
          onIndicatorPanelChange={setShowIndicatorPanel}
          activeOverlayCount={getActiveOverlayCount()}
          activeOscillatorCount={getActiveOscillatorCount()}
          showNewsMarkers={showNewsMarkers}
          onToggleNews={handleToggleNews}
          showStrategy={showStrategy}
          onToggleStrategy={toggleStrategy}
          onResetZoom={scrollToRealTime}
        />

        {/* Chart Container */}
        <div className="relative">
          {/* Loading Overlay */}
          {state.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/80 z-10 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="text-slate-400 text-sm">Loading chart data...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/80 z-10 rounded-lg">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            </div>
          )}

          {/* Loading More Indicator */}
          {state.isLoadingMore && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-orange-500/20 text-orange-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading more...
              </Badge>
            </div>
          )}

          {/* KLineChart Container */}
          <div
            id={containerId}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '600px', backgroundColor: '#0a0e14' }}
          />
        </div>

        {/* Strategy Info Panel */}
        {showStrategy && strategy && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-400">Entry:</span>
                <span className="text-white font-mono">
                  {strategy.entry_price?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-400">Take Profit:</span>
                <span className="text-green-400 font-mono">
                  {strategy.take_profit?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Stop Loss:</span>
                <span className="text-red-400 font-mono">
                  {strategy.stop_loss?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Direction:</span>
                <Badge className={`${
                  strategy.direction === 'long' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {strategy.direction?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTradingChart;
