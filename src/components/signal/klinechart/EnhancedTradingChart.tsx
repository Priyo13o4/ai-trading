/**
 * Enhanced Trading Chart - KLineChart Implementation
 * 
 * A professional trading chart component using KLineChart library.
 * Features:
 * - Real-time SSE price updates
 * - Lazy loading historical data
 * - Technical indicators (EMA, SMA, RSI, MACD, Bollinger, ATR)
 * - Drawing tools (trend lines, fibonacci, channels)
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
import { useDrawingManager } from './useDrawingManager';
import { useNewsOverlay } from './useNewsOverlay';
import { ChartControls } from './ChartControls';
import { IndicatorSettingsModal } from './IndicatorSettingsModal';
import { ChartSettingsModal, type ChartSettings, DEFAULT_SETTINGS } from './ChartSettingsModal';
import { DrawingToolsPanel } from './DrawingToolsPanel';
import { NewsEventPopup } from './NewsEventPopup';

import type { EnhancedTradingChartProps, NewsMarker } from './types';
import { TIMEFRAMES } from './constants';
import { getPrecisionForSymbol } from './utils';

/**
 * Check if forex market is currently open
 * Forex market: Sunday 22:00 UTC - Friday 22:00 UTC
 * Daily rollover: 22:00-23:00 UTC (market closed for settlement)
 */
const isForexMarketOpen = (): boolean => {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();

  // Weekend closure: Friday 22:00 UTC to Sunday 22:00 UTC
  // Saturday - always closed
  if (utcDay === 6) return false;
  // Sunday - closed until 22:00 UTC
  if (utcDay === 0 && utcHours < 22) return false;
  // Friday - closed after 22:00 UTC
  if (utcDay === 5 && utcHours >= 22) return false;

  // Daily rollover period: 22:00-23:00 UTC (Mon-Thu)
  // During this hour, brokers perform settlement and spreads widen significantly
  if (utcHours === 22) return false;

  return true;
};

/**
 * Get market status display info
 */
const getMarketStatus = () => {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcDay = now.getUTCDay();
  const isOpen = isForexMarketOpen();
  
  // Check if we're in rollover period (22:00-23:00 UTC on weekdays)
  const isRollover = utcHours === 22 && utcDay >= 1 && utcDay <= 4;
  
  if (isRollover) {
    return {
      isOpen: false,
      label: 'Rollover',
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
    };
  }
  
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
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false);
  const [initialIndicatorId, setInitialIndicatorId] = useState<string | null>(null);
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [newsPopupOpen, setNewsPopupOpen] = useState(false);
  const [newsPopupEvents, setNewsPopupEvents] = useState<NewsMarker[]>([]);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(() => {
    try {
      const saved = localStorage.getItem('chart-settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  
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
    updateIndicator,
    resetToDefaults,
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

  // Drawing manager hook
  const {
    activeTool,
    drawingCount,
    drawings,
    setActiveTool,
    clearAllDrawings,
    removeDrawing,
  } = useDrawingManager({
    chartRef,
  });

  // News overlay hook
  const handleNewsClick = useCallback((events: NewsMarker[], position: { x: number; y: number }) => {
    setNewsPopupEvents(events);
    setNewsPopupOpen(true);
  }, []);

  const {
    newsMarkers,
    isLoading: newsLoading,
    fetchNews,
    clearNews,
    renderNewsOverlay,
    removeNewsOverlay,
  } = useNewsOverlay({
    chartRef,
    symbol,
    timeframe,
    enabled: showNewsMarkers,
    onNewsClick: handleNewsClick,
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
    const newValue = !showNewsMarkers;
    setShowNewsMarkers(newValue);
    
    if (!newValue) {
      // When turning off, remove overlays and clear popup
      removeNewsOverlay();
      setNewsPopupOpen(false);
      setNewsPopupEvents([]);
    }
    // When turning on, the useNewsOverlay hook will automatically fetch and render
  }, [showNewsMarkers, removeNewsOverlay]);

  // Re-render news overlays when chart is ready and data changes
  useEffect(() => {
    if (showNewsMarkers && chartRef.current && !state.loading && newsMarkers.length > 0) {
      const timer = setTimeout(() => {
        renderNewsOverlay();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showNewsMarkers, chartRef.current, state.loading, newsMarkers, renderNewsOverlay]);

  // Apply chart settings to the KLineChart instance
  const applyChartSettings = useCallback(() => {
    if (!chartRef.current) return;

    const tooltipRule = chartSettings.showTooltipAlways ? 'always' : 'none';

    chartRef.current.setStyles({
      candle: {
        bar: {
          upColor: chartSettings.upColor,
          downColor: chartSettings.downColor,
          upBorderColor: chartSettings.upColor,
          downBorderColor: chartSettings.downColor,
          upWickColor: chartSettings.upColor,
          downWickColor: chartSettings.downColor,
        },
        priceMark: {
          high: { show: chartSettings.showHighLowMarks },
          low: { show: chartSettings.showHighLowMarks },
          last: {
            show: chartSettings.showLastPriceLine,
            upColor: chartSettings.upColor,
            downColor: chartSettings.downColor,
          },
        },
        tooltip: {
          showRule: tooltipRule,
        },
      },
      indicator: {
        tooltip: {
          showRule: tooltipRule,
        },
      },
      grid: {
        show: chartSettings.showGrid,
        horizontal: {
          show: chartSettings.showHorizontalGrid,
          color: chartSettings.gridColor,
        },
        vertical: {
          show: chartSettings.showVerticalGrid,
          color: chartSettings.gridColor,
        },
      },
      crosshair: {
        show: chartSettings.showCrosshair,
        horizontal: {
          line: { color: chartSettings.crosshairColor },
          text: { backgroundColor: chartSettings.crosshairColor },
        },
        vertical: {
          line: { color: chartSettings.crosshairColor },
          text: { backgroundColor: chartSettings.crosshairColor },
        },
      },
    });

    // Save settings to localStorage
    try {
      localStorage.setItem('chart-settings', JSON.stringify(chartSettings));
    } catch (err) {
      console.error('Failed to save chart settings:', err);
    }
  }, [chartRef, chartSettings]);

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
    <Card className="w-full max-w-full overflow-hidden bg-gradient-to-b from-[#0f1419] to-[#0a0e14] border-slate-700/50 shadow-xl shadow-black/20 shadow-[#D4AF37]/5">
      <CardHeader className="pb-3 border-b border-slate-700/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              {/* Symbol Selector integrated into title */}
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                {availableSymbols && availableSymbols.length > 1 && onSymbolChange ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-xl font-bold text-white hover:bg-transparent hover:text-[#D4AF37] flex items-center gap-1"
                      >
                        <span>{getSymbolDisplayName(symbol)}</span>
                        <ChevronDown className="w-5 h-5 text-[#D4AF37]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0f1419] border-slate-700/50 min-w-[180px]">
                      {availableSymbols.map((sym) => (
                        <DropdownMenuItem
                          key={sym}
                          onClick={() => handleSymbolChange(sym)}
                          className={`text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer ${
                            sym === symbol ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''
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
                <div className="text-2xl font-bold text-white font-mono" data-metric="true">
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
                  <span className="text-sm font-medium" data-metric="true">
                    {priceInfo.isPositive ? '+' : ''}{priceInfo.change} ({priceInfo.changePercent}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        {/* Top Control Bar - Timeframe, Indicators, etc. */}
        <ChartControls
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
          showIndicatorPanel={showIndicatorPanel}
          onIndicatorPanelChange={setShowIndicatorPanel}
          activeOverlayCount={getActiveOverlayCount()}
          activeOscillatorCount={getActiveOscillatorCount()}
          onOpenIndicatorSettings={(indicatorId?: string) => {
            setInitialIndicatorId(indicatorId || null);
            setShowIndicatorSettings(true);
          }}
          onOpenChartSettings={() => setShowChartSettings(true)}
          showNewsMarkers={showNewsMarkers}
          onToggleNews={handleToggleNews}
          showStrategy={showStrategy}
          onToggleStrategy={toggleStrategy}
          onResetZoom={scrollToRealTime}
        />

        {/* Drawing Tools Bar */}
        <div className="mb-2">
          <DrawingToolsPanel
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            onClearAll={clearAllDrawings}
            drawingCount={drawingCount}
            drawings={drawings}
            onRemoveDrawing={removeDrawing}
          />
        </div>

        {/* Indicator Settings Modal */}
        <IndicatorSettingsModal
          open={showIndicatorSettings}
          onOpenChange={(open) => {
            setShowIndicatorSettings(open);
            if (!open) setInitialIndicatorId(null);
          }}
          indicators={indicators}
          onUpdateIndicator={updateIndicator}
          onToggleIndicator={toggleIndicator}
          onResetToDefaults={resetToDefaults}
          initialIndicatorId={initialIndicatorId}
        />

        {/* Chart Settings Modal */}
        <ChartSettingsModal
          open={showChartSettings}
          onOpenChange={setShowChartSettings}
          settings={chartSettings}
          onUpdateSettings={setChartSettings}
          onApplySettings={applyChartSettings}
        />

        {/* News Event Popup */}
        <NewsEventPopup
          open={newsPopupOpen}
          onOpenChange={setNewsPopupOpen}
          events={newsPopupEvents}
        />

        {/* Chart Container */}
        <div className="relative rounded-lg overflow-hidden border border-slate-700/30">
          {/* Loading Overlay */}
          {state.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/90 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                <span className="text-slate-400 text-sm">Loading chart data...</span>
              </div>
            </div>
          )}

          {/* News Loading Indicator */}
          {showNewsMarkers && newsLoading && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] flex items-center gap-1 border border-[#D4AF37]/30">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading news...
              </Badge>
            </div>
          )}

          {/* News Markers Count */}
          {showNewsMarkers && !newsLoading && newsMarkers.length > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {newsMarkers.length} news events
              </Badge>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/90 z-10">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            </div>
          )}

          {/* Loading More Indicator */}
          {state.isLoadingMore && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] flex items-center gap-1 border border-[#D4AF37]/30">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading more...
              </Badge>
            </div>
          )}

          {/* KLineChart Container */}
          <div
            id={containerId}
            className="h-[450px] sm:h-[60vh] md:h-[65vh] w-full overflow-hidden rounded-lg bg-[#0a0e14] border border-slate-800 touch-none"
          />
        </div>

        {/* Strategy Info Panel */}
        {showStrategy && strategy && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-400">Entry:</span>
                <span className="text-white font-mono" data-metric="true">
                  {strategy.entry_price?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-400">Take Profit:</span>
                <span className="text-green-400 font-mono" data-metric="true">
                  {strategy.take_profit?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Stop Loss:</span>
                <span className="text-red-400 font-mono" data-metric="true">
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
