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
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown, Target, Search } from 'lucide-react';
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
import { getMarketStatus } from '@/utils/marketHours';
import apiService from '@/services/api';


/**
 * Enhanced Trading Chart Component
 */
export const EnhancedTradingChart: React.FC<EnhancedTradingChartProps> = ({
  symbol,
  timeframe: initialTimeframe,
  onTimeframeChange,
  activeStrategies = [],
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
  const [symbolSearch, setSymbolSearch] = useState('');
  const [chartSettings, setChartSettings] = useState<ChartSettings>(() => {
    try {
      const saved = localStorage.getItem('chart-settings');
      if (!saved) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;

      const next = {
        ...DEFAULT_SETTINGS,
        ...parsed,
      } as ChartSettings;

      if (typeof next.newsMinImportance !== 'number' || !Number.isFinite(next.newsMinImportance)) {
        next.newsMinImportance = DEFAULT_SETTINGS.newsMinImportance;
      }

      next.newsMinImportance = Math.min(5, Math.max(1, Math.round(next.newsMinImportance)));
      return next;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  
  // Force re-render to check for market status timeouts (every 30s)
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch daily reference price for accurate 24h change %
  const [dailyReferencePrice, setDailyReferencePrice] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const fetchDailyData = async () => {
      try {
        const response = await apiService.getHistoricalData(symbol, 'D1', 2);
        if (active && response.data?.candles && response.data.candles.length > 0) {
          const candles = response.data.candles;
          const sorted = [...candles].sort((a, b) => {
            const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
            const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
            return timeA - timeB;
          });
          const currentCandle = sorted[sorted.length - 1];
          
          // For true daily % change and points diff (like MT5), use the previous session's close price.
          let referencePrice;
          if ((currentCandle as any).is_forming) {
            // If the latest candle is still forming (today), yesterday's candle is the second to last.
            referencePrice = sorted.length > 1 ? sorted[sorted.length - 2].close : currentCandle.open;
          } else {
            // If there's no forming candle, the latest candle IS yesterday's fully closed candle.
            referencePrice = currentCandle.close;
          }
          
          setDailyReferencePrice(referencePrice);
        }
      } catch (err) {
        console.error('Failed to fetch daily data for price info', err);
      }
    };
    fetchDailyData();
    return () => { active = false; };
  }, [symbol]);
  
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
    strategyOptions,
    selectedStrategyKey,
    selectStrategy,
    syncStrategyWithChart,
  } = useStrategyManager({
    symbol,
    activeStrategies,
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
    renderNewsOverlay,
    removeNewsOverlay,
  } = useNewsOverlay({
    chartRef,
    symbol,
    timeframe,
    enabled: showNewsMarkers,
    minImportance: chartSettings.newsMinImportance,
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

  // Sync strategies after chart is initialized or data reloaded (e.g. timeframe change)
  useEffect(() => {
    if (chartRef.current && !state.loading) {
      syncStrategyWithChart();
    }
  }, [chartRef.current, state.loading, syncStrategyWithChart]);

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
  const marketStatus = useMemo(() => {
    const baseStatus = getMarketStatus(symbol, state.lastLiveUpdateAt);
    
    // If supposedly open but we have chart data, let's verify with the latest candle
    if (baseStatus.state === 'open' && dataRef.current && dataRef.current.length > 0) {
      const currentBar = dataRef.current[dataRef.current.length - 1];
      
      const minutesMapping: Record<string, number> = {
        'M1': 1, 'M5': 5, 'M15': 15, 'M30': 30,
        'H1': 60, 'H4': 240, 'D1': 1440, 'W1': 10080
      };
      const timeframeMins = minutesMapping[timeframe] || 1;
      
      // The candle closes at timestamp + timeframe
      const candleCloseTime = currentBar.timestamp + (timeframeMins * 60 * 1000);
      
      // If we are more than 5 minutes past when the latest candle should have closed, the feed is definitely down.
      if (Date.now() > candleCloseTime + (5 * 60 * 1000)) {
        return {
          ...baseStatus,
          state: 'delayed' as const,
          label: 'Feed Down',
          badgeCls: 'sa-badge-warning',
        };
      }
    }
    
    return baseStatus;
  }, [symbol, state.lastLiveUpdateAt, ticker, timeframe]);

  // Get current price from data
  const priceInfo = useMemo(() => {
    const data = dataRef.current;
    if (data.length < 1) return null;

    const currentBar = data[data.length - 1];
    
    // We need a reference price. In MT5, the daily percentage change is calculated
    // against the open price of the CURRENT daily candle (the forming D1 candle).
    // We will always use currentBar.open when looking at D1, or fall back to dailyReferencePrice.
    const referencePrice = dailyReferencePrice !== null 
      ? dailyReferencePrice 
      : currentBar.open; // MT5 standard: use the D1 candle open price!

    const precision = getPrecisionForSymbol(symbol);

    const price = currentBar.close;
    const priceChange = price - referencePrice;
    // MT5 displays daily change in points
    const changePoints = priceChange * Math.pow(10, precision);
    const changePercent = referencePrice !== 0
      ? ((priceChange / referencePrice) * 100)
      : 0;

    return {
      price: price.toFixed(precision),
      change: changePoints.toFixed(0),
      changePercent: changePercent.toFixed(2),
      isPositive: priceChange >= 0,
    };
  }, [dataRef.current.length, symbol, dailyReferencePrice]);

  // Current timeframe label
  const currentTimeframeLabel = TIMEFRAMES.find(tf => tf.value === timeframe)?.label || timeframe;

  // Get symbol display name
  const getSymbolDisplayName = useCallback((sym: string) => {
    if (sym === 'XAUUSD') return 'XAUUSD';
    let name = sym;
    if (symbolMetadata && symbolMetadata[sym]) {
      name = symbolMetadata[sym].name;
    }
    if (name === 'Gold') return 'XAUUSD';
    if (name === sym && /^[A-Z]{6}$/.test(sym)) {
      return `${sym.slice(0, 3)}/${sym.slice(3, 6)}`;
    }
    return name;
  }, [symbolMetadata]);

  // Handle symbol change
  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (onSymbolChange && newSymbol !== symbol) {
      onSymbolChange(newSymbol);
    }
  }, [onSymbolChange, symbol]);

  const filteredSymbols = useMemo(() => {
    if (!availableSymbols) return [];
    if (!symbolSearch.trim()) return availableSymbols;
    const searchLower = symbolSearch.toLowerCase();
    return availableSymbols.filter(s => 
      s.toLowerCase().includes(searchLower) || 
      getSymbolDisplayName(s).toLowerCase().includes(searchLower)
    );
  }, [availableSymbols, symbolSearch, getSymbolDisplayName]);

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
                        data-tour="signal.symbol"
                        variant="ghost"
                        className="p-0 h-auto text-xl font-bold text-white hover:bg-transparent hover:text-[var(--sa-accent)] flex items-center gap-1"
                      >
                        <span>{getSymbolDisplayName(symbol)}</span>
                        <ChevronDown className="w-5 h-5 text-[var(--sa-accent)]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[var(--sa-bg-0,#111315)] border-white/10 min-w-[200px]">
                      <div className="p-2 border-b border-white/10 sticky top-0 bg-[var(--sa-bg-0,#111315)] z-10">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search symbol..."
                            value={symbolSearch}
                            onChange={(e) => setSymbolSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--sa-accent)] focus:ring-1 focus:ring-[var(--sa-accent)] transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredSymbols.length > 0 ? (
                          filteredSymbols.map((sym) => (
                            <DropdownMenuItem
                              key={sym}
                              onClick={() => {
                                handleSymbolChange(sym);
                                setSymbolSearch(''); // Reset search on select
                              }}
                              className={`text-slate-200 focus:bg-white/15 focus:text-white cursor-pointer mx-1 my-0.5 rounded-sm ${
                                sym === symbol ? 'bg-[var(--sa-accent-soft,rgba(226,180,133,0.16))] text-[var(--sa-accent)]' : ''
                              }`}
                            >
                              <span className="font-medium">{sym}</span>
                              <span className="text-xs text-slate-500 ml-auto">{getSymbolDisplayName(sym)}</span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="py-4 text-center text-sm text-slate-500">
                            No symbols found
                          </div>
                        )}
                      </div>
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
                {showNewsMarkers && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                    {newsLoading ? 'Loading news…' : `${newsMarkers.length} events`}
                  </span>
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
          strategyOptions={strategyOptions}
          selectedStrategyKey={selectedStrategyKey}
          onSelectStrategy={selectStrategy}
          onResetZoom={scrollToRealTime}
        />

        {/* Strategy Info Inlay */}
        {showStrategy && strategy && (
          <div className="mb-3 w-full sa-scope">
            <div className="bg-[#0b0c0e]/95 border border-[#E2B485]/20 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative group select-none">
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

        {/* Drawing Tools Bar */}
        <div className="mb-2" data-tour="signal.drawing">
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

      </CardContent>
    </Card>
  );
};

export default EnhancedTradingChart;
