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
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

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
import { RegimeBadge } from '../RegimeBadge';

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
      badgeCls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    };
  }
  
  return {
    isOpen,
    label: isOpen ? 'Market Open' : 'Market Closed',
    badgeCls: isOpen
      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
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

  // Fetch strategy when symbol or timeframe changes
  useEffect(() => {
    fetchStrategy();
  }, [symbol, timeframe, fetchStrategy]);

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
    /* ── Card shell — use global .trading-card for the premium glass effect ── */
    <Card className="trading-card sa-scope w-full max-w-full">
      {/* ── Header ── */}
      <CardHeader className="pb-3 border-b border-white/[0.06] relative z-40">
        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">

          {/* Left: symbol + badges */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              {/* Symbol selector / title */}
              <CardTitle className="text-xl font-bold text-white flex flex-wrap items-center gap-2">

                {availableSymbols && availableSymbols.length > 1 && onSymbolChange ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto text-xl font-bold text-white hover:bg-transparent hover:text-[var(--sa-accent)] flex items-center gap-1"
                      >
                        <span>{getSymbolDisplayName(symbol)}</span>
                        <ChevronDown className="w-5 h-5 text-[var(--sa-accent)]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[var(--sa-bg-0,#111315)] border-white/10 min-w-[180px]">
                      {availableSymbols.map((sym) => (
                        <DropdownMenuItem
                          key={sym}
                          onClick={() => handleSymbolChange(sym)}
                          className={`text-slate-200 focus:bg-white/15 focus:text-white cursor-pointer ${
                            sym === symbol ? 'bg-[var(--sa-accent-soft,rgba(226,180,133,0.16))] text-[var(--sa-accent)]' : ''
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

                {/* Market Open/Closed badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${marketStatus.badgeCls}`}>
                  {marketStatus.label}
                </span>

                {/* AI Regime badge — sits right after market status */}
                <RegimeBadge symbol={symbol} />

              </CardTitle>

              <CardDescription className="text-[var(--sa-text-muted,#94a3b8)] flex items-center gap-2 mt-1 text-xs">
                <Clock className="w-3 h-3" />
                {currentTimeframeLabel} Chart
                {symbol !== getSymbolDisplayName(symbol) && (
                  <span className="text-slate-600">• {symbol}</span>
                )}
              </CardDescription>
            </div>
          </div>

          {/* Right: price display */}
          {priceInfo && (
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-white font-mono" data-metric="true">
                  {priceInfo.price}
                </div>
                <div className={`flex items-center gap-1 justify-end ${
                  priceInfo.isPositive ? 'text-emerald-400' : 'text-rose-400'
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

      <CardContent className="pt-3 relative z-10">
        {/* Top Control Bar */}
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

        {/* ── Chart container ── */}
        <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">

          {/* Loading overlay */}
          {state.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--sa-bg-2,#050607)]/90 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[var(--sa-accent,#E2B485)] animate-spin" />
                <span className="text-[var(--sa-text-muted,#94a3b8)] text-sm">Loading chart data...</span>
              </div>
            </div>
          )}

          {/* News loading indicator */}
          {showNewsMarkers && newsLoading && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--sa-accent-soft)] text-[var(--sa-accent)] border border-[var(--sa-accent)]/20">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading news…
              </span>
            </div>
          )}

          {/* News markers count */}
          {showNewsMarkers && !newsLoading && newsMarkers.length > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">
                {newsMarkers.length} news events
              </span>
            </div>
          )}

          {/* Error display */}
          {state.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--sa-bg-2,#050607)]/90 z-10">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <span className="text-rose-400 text-sm">{state.error}</span>
              </div>
            </div>
          )}

          {/* Loading more indicator */}
          {state.isLoadingMore && (
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--sa-accent-soft)] text-[var(--sa-accent)] border border-[var(--sa-accent)]/20">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading more…
              </span>
            </div>
          )}

          {/* KLineChart canvas */}
          <div
            id={containerId}
            className="h-[450px] sm:h-[60vh] md:h-[65vh] w-full overflow-hidden rounded-xl bg-[var(--sa-bg-2,#050607)] border border-white/[0.04] touch-none"
          />
        </div>

        {/* Strategy Info Inlay */}
        {showStrategy && strategy && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-2xl sa-scope pointer-events-none">
            <div className="bg-[#0b0c0e]/95  border border-[#E2B485]/20 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative group pointer-events-auto select-none">
              {/* Decorative gradient corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E2B485]/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all duration-700 group-hover:bg-[#E2B485]/10" />
              
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1">
                <div className={cn(
                  "p-2.5 sm:p-3 rounded-xl flex items-center justify-center shadow-inner",
                  strategy.direction === 'long' 
                    ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                )}>
                  {strategy.direction === 'long' ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h4 className="text-white font-bold text-sm sm:text-base truncate leading-tight tracking-tight">
                      {strategy.name}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest leading-none ring-1",
                      strategy.direction === 'long'
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                    )}>
                      {strategy.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#E2B485]/60" />
                      <span className="text-[10px] xs:text-xs font-semibold tracking-wider font-mono text-white/90">
                        {strategy.entry_price?.toFixed(getPrecisionForSymbol(symbol))}
                      </span>
                    </div>
                    {strategy.confidence && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div 
                              key={i} 
                              className={cn(
                                "w-1 h-3 rounded-[1px] transition-all duration-500",
                                i <= (strategy.confidence! * 5)
                                  ? strategy.direction === 'long' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'
                                  : 'bg-white/15'
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Confidence</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto px-1 sm:px-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <div className="flex flex-col gap-1 min-w-[70px]">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">TP</span>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-tighter font-mono leading-none group-hover:text-emerald-300 transition-colors">
                    {strategy.take_profit?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 min-w-[70px]">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">SL</span>
                  <span className="text-rose-400 font-bold text-xs sm:text-sm tracking-tighter font-mono leading-none group-hover:text-rose-300 transition-colors">
                    {strategy.stop_loss?.toFixed(getPrecisionForSymbol(symbol)) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTradingChart;
