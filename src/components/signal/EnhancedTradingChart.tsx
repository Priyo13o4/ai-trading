import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, LineStyle, CrosshairMode, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  Newspaper,
  Maximize2,
  ChevronDown,
  Settings2,
  BarChart3,
  Activity,
  Layers,
  Target,
  Eye,
  EyeOff,
  Check,
  Clock,
} from 'lucide-react';

interface EnhancedTradingChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface StrategyData {
  name: string;
  direction: 'long' | 'short';
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  confidence?: number;
}

// Indicator Configuration Types
interface IndicatorConfig {
  id: string;
  name: string;
  category: 'overlay' | 'oscillator';
  enabled: boolean;
  params: Record<string, number>;
  colors: string[];
}

// Timeframes
const TIMEFRAMES = [
  { value: 'M1', label: '1 min', seconds: 60 },
  { value: 'M5', label: '5 min', seconds: 300 },
  { value: 'M15', label: '15 min', seconds: 900 },
  { value: 'M30', label: '30 min', seconds: 1800 },
  { value: 'H1', label: '1 hour', seconds: 3600 },
  { value: 'H4', label: '4 hour', seconds: 14400 },
  { value: 'D1', label: '1 day', seconds: 86400 },
  { value: 'W1', label: '1 week', seconds: 604800 },
];

// Default Indicator Configurations
const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // Overlay Indicators (on main chart)
  { id: 'ema9', name: 'EMA 9', category: 'overlay', enabled: false, params: { period: 9 }, colors: ['#F97316'] },
  { id: 'ema21', name: 'EMA 21', category: 'overlay', enabled: true, params: { period: 21 }, colors: ['#3B82F6'] },
  { id: 'ema50', name: 'EMA 50', category: 'overlay', enabled: false, params: { period: 50 }, colors: ['#10B981'] },
  { id: 'sma200', name: 'SMA 200', category: 'overlay', enabled: false, params: { period: 200 }, colors: ['#8B5CF6'] },
  { id: 'bb', name: 'Bollinger Bands', category: 'overlay', enabled: false, params: { period: 20, stdDev: 2 }, colors: ['#06B6D4', '#06B6D4', '#06B6D4'] },
  { id: 'pivots', name: 'Pivot Points', category: 'overlay', enabled: false, params: {}, colors: ['#FBBF24', '#22C55E', '#EF4444'] },
  // Oscillator Indicators (separate panes)
  { id: 'rsi', name: 'RSI', category: 'oscillator', enabled: false, params: { period: 14, overbought: 70, oversold: 30 }, colors: ['#A855F7'] },
  { id: 'macd', name: 'MACD', category: 'oscillator', enabled: false, params: { fast: 12, slow: 26, signal: 9 }, colors: ['#3B82F6', '#F97316', '#22C55E'] },
  { id: 'atr', name: 'ATR', category: 'oscillator', enabled: false, params: { period: 14 }, colors: ['#EAB308'] },
];

// Calculation Functions
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let ema = data[0];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      emaArray.push(data[i]);
    } else {
      ema = data[i] * k + ema * (1 - k);
      emaArray.push(ema);
    }
  }
  return emaArray;
}

function calculateSMA(data: number[], period: number): number[] {
  const smaArray: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      smaArray.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      smaArray.push(sum / period);
    }
  }
  return smaArray;
}

function calculateRSI(closes: number[], period: number): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsi.push(NaN);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i < period) {
      gains += gain;
      losses += loss;
      rsi.push(NaN);
    } else if (i === period) {
      gains += gain;
      losses += loss;
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    } else {
      const avgGain = (gains * (period - 1) + gain) / period;
      const avgLoss = (losses * (period - 1) + loss) / period;
      gains = avgGain * period;
      losses = avgLoss * period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
}

function calculateMACD(closes: number[], fast: number, slow: number, signal: number): { macd: number[], signal: number[], histogram: number[] } {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);
  
  // Pad signal line to match length
  const paddedSignal = Array(closes.length - signalLine.length).fill(NaN).concat(signalLine);
  
  const histogram = macdLine.map((v, i) => !isNaN(v) && !isNaN(paddedSignal[i]) ? v - paddedSignal[i] : NaN);
  
  return { macd: macdLine, signal: paddedSignal, histogram };
}

function calculateBollingerBands(closes: number[], period: number, stdDev: number): { upper: number[], middle: number[], lower: number[] } {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const sd = Math.sqrt(variance);
      upper.push(mean + stdDev * sd);
      lower.push(mean - stdDev * sd);
    }
  }

  return { upper, middle: sma, lower };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const tr: number[] = [];
  const atr: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
      atr.push(NaN);
    } else {
      const trValue = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      tr.push(trValue);

      if (i < period) {
        atr.push(NaN);
      } else if (i === period) {
        atr.push(tr.slice(0, period + 1).reduce((a, b) => a + b, 0) / (period + 1));
      } else {
        atr.push((atr[i - 1] * (period - 1) + trValue) / period);
      }
    }
  }
  return atr;
}

function calculatePivotPoints(high: number, low: number, close: number): { pp: number, r1: number, r2: number, r3: number, s1: number, s2: number, s3: number } {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const s1 = 2 * pp - high;
  const r2 = pp + (high - low);
  const s2 = pp - (high - low);
  const r3 = high + 2 * (pp - low);
  const s3 = low - 2 * (high - pp);
  return { pp, r1, r2, r3, s1, s2, s3 };
}

export function EnhancedTradingChart({ symbol, timeframe, onTimeframeChange }: EnhancedTradingChartProps) {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<{ open: boolean; reason: string } | null>(null);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    const saved = localStorage.getItem('chartIndicators');
    return saved ? JSON.parse(saved) : DEFAULT_INDICATORS;
  });
  const [showNewsMarkers, setShowNewsMarkers] = useState(() => {
    const saved = localStorage.getItem('showNewsMarkers');
    return saved ? JSON.parse(saved) : false;
  });
  const [showStrategy, setShowStrategy] = useState(() => {
    const saved = localStorage.getItem('showStrategy');
    return saved ? JSON.parse(saved) : true;
  });
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [hoveredNews, setHoveredNews] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const atrContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const atrChartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const seriesMarkersRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());
  const strategyLinesRef = useRef<Map<string, any>>(new Map());
  const newsDataRef = useRef<Map<number, any>>(new Map());
  const oldestTimestampRef = useRef<number | null>(null);
  const lastLoadTimestampRef = useRef<number | null>(null);
  const timeframeRef = useRef<string>(timeframe);

  // Keep timeframeRef in sync with timeframe prop
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);

  // Fetch market status
  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/market-status');
        if (response.ok) {
          const data = await response.json();
          setMarketStatus({ open: data.market_open, reason: data.reason });
        }
      } catch (err) {
        console.error('Failed to fetch market status:', err);
      }
    };

    fetchMarketStatus();
    const interval = setInterval(fetchMarketStatus, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Chart theme configuration
  const chartTheme = {
    layout: {
      background: { color: 'transparent' },
      textColor: '#9CA3AF',
    },
    grid: {
      vertLines: { color: '#1F2937' },
      horzLines: { color: '#1F2937' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: '#F97316',
        labelBackgroundColor: '#F97316',
      },
      horzLine: {
        color: '#F97316',
        labelBackgroundColor: '#F97316',
      },
    },
    rightPriceScale: {
      borderColor: '#374151',
    },
    timeScale: {
      borderColor: '#374151',
      timeVisible: true,
      secondsVisible: false,
    },
  };

  // Initialize main chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const width = chartContainerRef.current.clientWidth || 800;
    const height = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      ...chartTheme,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
      borderVisible: false,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Click handler for news markers
    chart.subscribeClick((param: any) => {
      if (!param.point || !param.time) return;
      const clickedTime = Math.floor(param.time);
      const newsDataArray = newsDataRef.current.get(clickedTime);
      if (newsDataArray && newsDataArray.length > 0) {
        setHoveredNews(newsDataArray);
        setTooltipPosition({ x: param.point.x, y: param.point.y });
      }
    });

    // Close tooltip on click outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.news-tooltip') && !target.closest('canvas')) {
        setHoveredNews(null);
        setTooltipPosition(null);
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Lazy loading on scroll
    let debounceTimer: NodeJS.Timeout;
    chart.timeScale().subscribeVisibleTimeRangeChange((newRange) => {
      if (newRange && oldestTimestampRef.current) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const visibleRange = (newRange.to as number) - (newRange.from as number);
          const buffer = visibleRange * 0.5;
          if ((newRange.from as number) - buffer <= oldestTimestampRef.current! && 
              oldestTimestampRef.current !== lastLoadTimestampRef.current) {
            loadMoreHistoricalData();
          }
        }, 300);
      }
    });

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        const newHeight = chartContainerRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          chartRef.current.applyOptions({ width: newWidth, height: newHeight });
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
      chart.remove();
    };
  }, []);

  // Initialize oscillator charts (RSI, MACD, ATR)
  useEffect(() => {
    const rsiEnabled = indicators.find(i => i.id === 'rsi')?.enabled;
    const macdEnabled = indicators.find(i => i.id === 'macd')?.enabled;
    const atrEnabled = indicators.find(i => i.id === 'atr')?.enabled;

    // RSI Chart
    if (rsiEnabled && rsiContainerRef.current && !rsiChartRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        width: rsiContainerRef.current.clientWidth,
        height: 100,
        ...chartTheme,
        rightPriceScale: {
          ...chartTheme.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
      rsiChartRef.current = rsiChart;

      // Sync crosshair with main chart
      if (chartRef.current) {
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range && rsiChartRef.current) {
            rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
          }
        });
      }
    } else if (!rsiEnabled && rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    // MACD Chart
    if (macdEnabled && macdContainerRef.current && !macdChartRef.current) {
      const macdChart = createChart(macdContainerRef.current, {
        width: macdContainerRef.current.clientWidth,
        height: 100,
        ...chartTheme,
        rightPriceScale: {
          ...chartTheme.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
      macdChartRef.current = macdChart;

      if (chartRef.current) {
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range && macdChartRef.current) {
            macdChartRef.current.timeScale().setVisibleLogicalRange(range);
          }
        });
      }
    } else if (!macdEnabled && macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    // ATR Chart
    if (atrEnabled && atrContainerRef.current && !atrChartRef.current) {
      const atrChart = createChart(atrContainerRef.current, {
        width: atrContainerRef.current.clientWidth,
        height: 80,
        ...chartTheme,
        rightPriceScale: {
          ...chartTheme.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
      atrChartRef.current = atrChart;

      if (chartRef.current) {
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range && atrChartRef.current) {
            atrChartRef.current.timeScale().setVisibleLogicalRange(range);
          }
        });
      }
    } else if (!atrEnabled && atrChartRef.current) {
      atrChartRef.current.remove();
      atrChartRef.current = null;
    }
  }, [indicators]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const limits: Record<string, number> = {
        'M1': 10000,
        'M5': 5000,
        'M15': 3000,
        'M30': 3000,
        'H1': 3000,
        'H4': 2000,
        'D1': 750,
        'W1': 500,
      };
      const limit = limits[timeframe] || 3000;
      
      const response = await apiService.getHistoricalData(symbol, timeframe, limit);
      
      if (response.error) throw new Error(response.error);

      if (response.data?.candles && candlestickSeriesRef.current) {
        const data = response.data.candles.map((candle: Candle) => ({
          time: (new Date(candle.time).getTime() / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0,
        }));

        if (data.length === 0) {
          setError('No historical data available');
          setLoading(false);
          return;
        }

        candlestickSeriesRef.current.setData(data);
        setChartData(data);
        
        if (data.length > 0) {
          oldestTimestampRef.current = data[0].time as number;
        }

        // Update all indicators
        updateIndicators(data);
        
        // Fit content
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Fetch strategy data
  const fetchStrategy = useCallback(async () => {
    try {
      const response = await apiService.getStrategy(symbol);
      if (response.data && !response.error) {
        setStrategy(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch strategy:', err);
    }
  }, [symbol]);

  // Load more historical data
  const loadMoreHistoricalData = async () => {
    if (isLoadingMore || !oldestTimestampRef.current || !candlestickSeriesRef.current) return;
    if (oldestTimestampRef.current === lastLoadTimestampRef.current) return;

    // Use ref to get current timeframe (avoids stale closure)
    const currentTimeframe = timeframeRef.current;

    setIsLoadingMore(true);
    lastLoadTimestampRef.current = oldestTimestampRef.current;
    
    try {
      const limits: Record<string, number> = {
        'M1': 10000,
        'M5': 5000,
        'M15': 3000,
        'M30': 3000,
        'H1': 3000,
        'H4': 2000,
        'D1': 750,
        'W1': 500,
      };
      const limit = limits[currentTimeframe] || 3000;
      
      const response = await apiService.getHistoricalData(symbol, currentTimeframe, limit, oldestTimestampRef.current);
      
      if (response.error) {
        lastLoadTimestampRef.current = null;
        return;
      }

      if (response.data?.candles && response.data.candles.length > 0) {
        const formattedData = response.data.candles.map((candle: any) => ({
          time: Math.floor(new Date(candle.time).getTime() / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        const currentData = candlestickSeriesRef.current.data() as any[];
        const timeMap = new Map();
        
        formattedData.forEach((candle: any) => timeMap.set(candle.time, candle));
        currentData.forEach((candle: any) => timeMap.set(candle.time, candle));
        
        const mergedData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
        
        candlestickSeriesRef.current.setData(mergedData);
        setChartData(mergedData);
        updateIndicators(mergedData);
        
        oldestTimestampRef.current = mergedData[0].time as number;
      }
    } catch (error) {
      console.error('Error loading more data:', error);
      lastLoadTimestampRef.current = null;
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update all indicators
  const updateIndicators = useCallback((data: any[]) => {
    if (!chartRef.current || data.length === 0) return;

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    // Clear existing indicator series
    indicatorSeriesRef.current.forEach((series, key) => {
      if (key.startsWith('overlay_')) {
        chartRef.current?.removeSeries(series);
      }
    });
    indicatorSeriesRef.current.clear();

    // Add overlay indicators
    indicators.filter(i => i.category === 'overlay' && i.enabled).forEach(indicator => {
      switch (indicator.id) {
        case 'ema9':
        case 'ema21':
        case 'ema50': {
          const values = calculateEMA(closes, indicator.params.period);
          const lineData = data.map((candle, i) => ({
            time: candle.time,
            value: values[i],
          })).filter(d => !isNaN(d.value));

          const series = chartRef.current!.addSeries(LineSeries, {
            color: indicator.colors[0],
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: indicator.name,
          });
          series.setData(lineData);
          indicatorSeriesRef.current.set(`overlay_${indicator.id}`, series);
          break;
        }
        case 'sma200': {
          const values = calculateSMA(closes, indicator.params.period);
          const lineData = data.map((candle, i) => ({
            time: candle.time,
            value: values[i],
          })).filter(d => !isNaN(d.value));

          const series = chartRef.current!.addSeries(LineSeries, {
            color: indicator.colors[0],
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: indicator.name,
          });
          series.setData(lineData);
          indicatorSeriesRef.current.set(`overlay_${indicator.id}`, series);
          break;
        }
        case 'bb': {
          const bb = calculateBollingerBands(closes, indicator.params.period, indicator.params.stdDev);
          
          const upperData = data.map((candle, i) => ({ time: candle.time, value: bb.upper[i] })).filter(d => !isNaN(d.value));
          const middleData = data.map((candle, i) => ({ time: candle.time, value: bb.middle[i] })).filter(d => !isNaN(d.value));
          const lowerData = data.map((candle, i) => ({ time: candle.time, value: bb.lower[i] })).filter(d => !isNaN(d.value));

          const upperSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.colors[0],
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const middleSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.colors[1],
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: 'BB Middle',
          });
          const lowerSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.colors[2],
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
          });

          upperSeries.setData(upperData);
          middleSeries.setData(middleData);
          lowerSeries.setData(lowerData);

          indicatorSeriesRef.current.set(`overlay_bb_upper`, upperSeries);
          indicatorSeriesRef.current.set(`overlay_bb_middle`, middleSeries);
          indicatorSeriesRef.current.set(`overlay_bb_lower`, lowerSeries);
          break;
        }
        case 'pivots': {
          // Use the last complete candle for pivot calculation
          if (data.length < 2) break;
          const lastCandle = data[data.length - 2];
          const pivots = calculatePivotPoints(lastCandle.high, lastCandle.low, lastCandle.close);
          
          const pivotLevels = [
            { level: pivots.r3, color: '#EF4444', label: 'R3', style: LineStyle.Dotted },
            { level: pivots.r2, color: '#EF4444', label: 'R2', style: LineStyle.Dashed },
            { level: pivots.r1, color: '#EF4444', label: 'R1', style: LineStyle.Solid },
            { level: pivots.pp, color: '#FBBF24', label: 'PP', style: LineStyle.Solid },
            { level: pivots.s1, color: '#22C55E', label: 'S1', style: LineStyle.Solid },
            { level: pivots.s2, color: '#22C55E', label: 'S2', style: LineStyle.Dashed },
            { level: pivots.s3, color: '#22C55E', label: 'S3', style: LineStyle.Dotted },
          ];

          pivotLevels.forEach(({ level, color, label, style }) => {
            const series = chartRef.current!.addSeries(LineSeries, {
              color,
              lineWidth: 1,
              lineStyle: style,
              priceLineVisible: false,
              lastValueVisible: true,
              title: label,
            });
            const pivotData = data.map(candle => ({ time: candle.time, value: level }));
            series.setData(pivotData);
            indicatorSeriesRef.current.set(`overlay_pivot_${label}`, series);
          });
          break;
        }
      }
    });

    // Update RSI
    if (rsiChartRef.current && indicators.find(i => i.id === 'rsi')?.enabled) {
      const rsiConfig = indicators.find(i => i.id === 'rsi')!;
      const rsiValues = calculateRSI(closes, rsiConfig.params.period);
      const rsiData = data.map((candle, i) => ({ time: candle.time, value: rsiValues[i] })).filter(d => !isNaN(d.value));

      // Clear existing series
      rsiChartRef.current.getSeries().forEach(s => rsiChartRef.current!.removeSeries(s));

      // Add overbought/oversold lines
      const obLine = rsiChartRef.current.addSeries(LineSeries, {
        color: '#EF444480',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const osLine = rsiChartRef.current.addSeries(LineSeries, {
        color: '#22C55E80',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const midLine = rsiChartRef.current.addSeries(LineSeries, {
        color: '#9CA3AF40',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      obLine.setData(data.map(d => ({ time: d.time, value: rsiConfig.params.overbought })));
      osLine.setData(data.map(d => ({ time: d.time, value: rsiConfig.params.oversold })));
      midLine.setData(data.map(d => ({ time: d.time, value: 50 })));

      // Add RSI line
      const rsiSeries = rsiChartRef.current.addSeries(LineSeries, {
        color: rsiConfig.colors[0],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'RSI',
      });
      rsiSeries.setData(rsiData);
    }

    // Update MACD
    if (macdChartRef.current && indicators.find(i => i.id === 'macd')?.enabled) {
      const macdConfig = indicators.find(i => i.id === 'macd')!;
      const macdResult = calculateMACD(closes, macdConfig.params.fast, macdConfig.params.slow, macdConfig.params.signal);
      
      macdChartRef.current.getSeries().forEach(s => macdChartRef.current!.removeSeries(s));

      // Histogram
      const histogramSeries = macdChartRef.current.addSeries(HistogramSeries, {
        color: '#22C55E',
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const histData = data.map((candle, i) => ({
        time: candle.time,
        value: macdResult.histogram[i],
        color: macdResult.histogram[i] >= 0 ? '#22C55E' : '#EF4444',
      })).filter(d => !isNaN(d.value));
      histogramSeries.setData(histData);

      // MACD Line
      const macdSeries = macdChartRef.current.addSeries(LineSeries, {
        color: macdConfig.colors[0],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'MACD',
      });
      const macdData = data.map((candle, i) => ({ time: candle.time, value: macdResult.macd[i] })).filter(d => !isNaN(d.value));
      macdSeries.setData(macdData);

      // Signal Line
      const signalSeries = macdChartRef.current.addSeries(LineSeries, {
        color: macdConfig.colors[1],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'Signal',
      });
      const signalData = data.map((candle, i) => ({ time: candle.time, value: macdResult.signal[i] })).filter(d => !isNaN(d.value));
      signalSeries.setData(signalData);
    }

    // Update ATR
    if (atrChartRef.current && indicators.find(i => i.id === 'atr')?.enabled) {
      const atrConfig = indicators.find(i => i.id === 'atr')!;
      const atrValues = calculateATR(highs, lows, closes, atrConfig.params.period);
      
      atrChartRef.current.getSeries().forEach(s => atrChartRef.current!.removeSeries(s));

      const atrSeries = atrChartRef.current.addSeries(LineSeries, {
        color: atrConfig.colors[0],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'ATR',
      });
      const atrData = data.map((candle, i) => ({ time: candle.time, value: atrValues[i] })).filter(d => !isNaN(d.value));
      atrSeries.setData(atrData);
    }

    // Update strategy lines
    updateStrategyLines(data);
  }, [indicators, strategy, showStrategy]);

  // Update strategy visualization
  const updateStrategyLines = useCallback((data: any[]) => {
    if (!chartRef.current || !strategy || !showStrategy || data.length === 0) {
      // Clear existing strategy lines
      strategyLinesRef.current.forEach(series => {
        try { chartRef.current?.removeSeries(series); } catch {}
      });
      strategyLinesRef.current.clear();
      return;
    }

    // Clear existing
    strategyLinesRef.current.forEach(series => {
      try { chartRef.current?.removeSeries(series); } catch {}
    });
    strategyLinesRef.current.clear();

    const strategyLevels = [
      { key: 'entry', value: strategy.entry_price, color: '#3B82F6', label: 'Entry' },
      { key: 'tp', value: strategy.take_profit, color: '#22C55E', label: 'TP' },
      { key: 'sl', value: strategy.stop_loss, color: '#EF4444', label: 'SL' },
    ];

    strategyLevels.forEach(({ key, value, color, label }) => {
      if (!value) return;
      
      const series = chartRef.current!.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: true,
        title: label,
      });
      const lineData = data.map(candle => ({ time: candle.time, value }));
      series.setData(lineData);
      strategyLinesRef.current.set(key, series);
    });
  }, [strategy, showStrategy]);

  // Toggle indicator
  const toggleIndicator = (indicatorId: string) => {
    setIndicators(prev => {
      const updated = prev.map(ind => 
        ind.id === indicatorId ? { ...ind, enabled: !ind.enabled } : ind
      );
      localStorage.setItem('chartIndicators', JSON.stringify(updated));
      return updated;
    });
  };

  // Reset zoom
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  // Toggle news markers
  const toggleNewsMarkers = async () => {
    const newValue = !showNewsMarkers;
    setShowNewsMarkers(newValue);
    localStorage.setItem('showNewsMarkers', JSON.stringify(newValue));

    if (newValue && candlestickSeriesRef.current) {
      // Fetch and display news markers
      try {
        const response = await fetch(`http://localhost:8080/api/news/markers/${symbol}?min_importance=3`);
        const data = await response.json();
        
        if (data.markers && data.markers.length > 0) {
          newsDataRef.current.clear();
          
          const markers = data.markers.map((news: any) => {
            const timestamp = Math.floor(new Date(news.time).getTime() / 1000);
            newsDataRef.current.set(timestamp, [news]);
            
            return {
              time: timestamp as any,
              position: 'aboveBar' as const,
              color: news.color || '#64748b',
              shape: news.breaking ? 'arrowDown' as const : 'circle' as const,
              text: news.importance >= 4 ? '!' : '',
              size: news.importance >= 4 ? 2 : 1,
            };
          });

          markers.sort((a: any, b: any) => a.time - b.time);
          
          // Create or update series markers using v5 API
          if (seriesMarkersRef.current) {
            seriesMarkersRef.current.setMarkers(markers);
          } else {
            seriesMarkersRef.current = createSeriesMarkers(candlestickSeriesRef.current, markers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch news markers:', error);
      }
    } else if (seriesMarkersRef.current) {
      seriesMarkersRef.current.setMarkers([]);
      newsDataRef.current.clear();
    }
  };

  // Toggle strategy display
  const toggleStrategy = () => {
    const newValue = !showStrategy;
    setShowStrategy(newValue);
    localStorage.setItem('showStrategy', JSON.stringify(newValue));
    if (chartData.length > 0) {
      updateStrategyLines(chartData);
    }
  };

  // Effects
  useEffect(() => {
    oldestTimestampRef.current = null;
    lastLoadTimestampRef.current = null;
    fetchChartData();
    fetchStrategy();
  }, [symbol, timeframe, fetchChartData, fetchStrategy]);

  useEffect(() => {
    if (chartData.length > 0) {
      updateIndicators(chartData);
    }
  }, [indicators, chartData, updateIndicators]);

  // SSE subscription
  useEffect(() => {
    if (!symbol || !candlestickSeriesRef.current) return;

    const timer = setTimeout(() => {
      const unsubscribe = sseService.subscribeToCandleUpdates(
        symbol,
        'ALL',
        (data) => {
          if (data.type === 'candle_update' && data.symbol === symbol && data.timeframe === timeframe && candlestickSeriesRef.current) {
            const newCandle = {
              time: data.candle.time.split('T')[0],
              open: data.candle.open,
              high: data.candle.high,
              low: data.candle.low,
              close: data.candle.close,
            };
            candlestickSeriesRef.current.update(newCandle);
          }
        },
        (error) => console.error('SSE error:', error)
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [symbol, timeframe]);

  // Get active indicators count
  const activeOverlayCount = indicators.filter(i => i.category === 'overlay' && i.enabled).length;
  const activeOscillatorCount = indicators.filter(i => i.category === 'oscillator' && i.enabled).length;

  return (
    <Card className="mesh-gradient-card border-slate-700/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-display font-semibold text-white">{symbol} Chart</h2>
            <p className="text-xs text-slate-500">Professional trading chart with 100+ indicators & drawing tools</p>
          </div>
          {marketStatus && !marketStatus.open && (
            <Badge variant="outline" className="bg-slate-800/50 border-slate-600/50 text-slate-400 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Market Closed
            </Badge>
          )}
        </div>
        
        {/* Strategy Badge */}
        {strategy && showStrategy && (
          <Badge className={`${strategy.direction === 'long' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <Target className="w-3 h-3 mr-1" />
            {strategy.name} - {strategy.direction.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        {/* Timeframe Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-orange-600/20 border-orange-500/50 text-orange-400 hover:bg-orange-600/30 min-w-[100px] justify-between"
            >
              <span className="font-medium">{TIMEFRAMES.find(tf => tf.value === timeframe)?.label || timeframe}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0f1419] border-slate-700 w-36 z-50" align="start" sideOffset={5}>
            <DropdownMenuLabel className="text-slate-400 text-xs">Timeframe</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            {TIMEFRAMES.map(tf => (
              <DropdownMenuItem
                key={tf.value}
                onClick={() => onTimeframeChange(tf.value)}
                className={`cursor-pointer ${
                  timeframe === tf.value
                    ? 'bg-orange-600/20 text-orange-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{tf.label}</span>
                  {timeframe === tf.value && <Check className="w-4 h-4 text-orange-400" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tool Buttons */}
        <div className="flex gap-2">
          {/* News Toggle */}
          <Button
            onClick={toggleNewsMarkers}
            variant="outline"
            size="sm"
            className={`${
              showNewsMarkers
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 hover:bg-blue-600/30'
                : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 mr-2" />
            News
          </Button>

          {/* Strategy Toggle */}
          <Button
            onClick={toggleStrategy}
            variant="outline"
            size="sm"
            className={`${
              showStrategy
                ? 'bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600/30'
                : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Strategy
          </Button>

          {/* Reset Zoom */}
          <Button
            onClick={resetZoom}
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
            title="Reset zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Indicators Menu */}
          <DropdownMenu open={showIndicatorPanel} onOpenChange={setShowIndicatorPanel}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Indicators
                {(activeOverlayCount + activeOscillatorCount) > 0 && (
                  <Badge className="ml-2 bg-orange-500/20 text-orange-400 text-xs">
                    {activeOverlayCount + activeOscillatorCount}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0f1419] border-slate-700 w-64" align="end">
              {/* Overlay Indicators */}
              <DropdownMenuLabel className="text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Overlay Indicators
              </DropdownMenuLabel>
              {indicators.filter(i => i.category === 'overlay').map(indicator => (
                <DropdownMenuCheckboxItem
                  key={indicator.id}
                  checked={indicator.enabled}
                  onCheckedChange={() => toggleIndicator(indicator.id)}
                  className="text-slate-200"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: indicator.colors[0] }}
                    />
                    <span>{indicator.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator className="bg-slate-700" />

              {/* Oscillator Indicators */}
              <DropdownMenuLabel className="text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Oscillators
              </DropdownMenuLabel>
              {indicators.filter(i => i.category === 'oscillator').map(indicator => (
                <DropdownMenuCheckboxItem
                  key={indicator.id}
                  checked={indicator.enabled}
                  onCheckedChange={() => toggleIndicator(indicator.id)}
                  className="text-slate-200"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: indicator.colors[0] }}
                    />
                    <span>{indicator.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="text-slate-400 text-sm">Loading chart data...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-red-400 text-center">
              <div className="text-lg font-semibold mb-1">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-[400px]" />

        {/* News Tooltip */}
        {hoveredNews && tooltipPosition && (
          <div
            className="news-tooltip absolute z-50 bg-slate-900 border border-orange-500/50 rounded-lg shadow-xl p-4 max-w-md max-h-80 overflow-y-auto"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: tooltipPosition.x > 400 ? 'translateX(-100%)' : 'translateX(10px)'
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="text-sm font-semibold text-orange-400">
                {Array.isArray(hoveredNews) && hoveredNews.length > 1 
                  ? `${hoveredNews.length} News Events` 
                  : 'News Event'}
              </h4>
              <button
                onClick={() => {
                  setHoveredNews(null);
                  setTooltipPosition(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {(Array.isArray(hoveredNews) ? hoveredNews : [hoveredNews]).map((newsItem: any, idx: number) => (
                <div key={idx} className={`${idx > 0 ? 'pt-3 border-t border-slate-700' : ''}`}>
                  <h5 className="text-sm font-medium text-white mb-2">
                    {newsItem.full_headline || newsItem.headline}
                  </h5>
                  <div className="text-xs text-slate-400">
                    {new Date(newsItem.time).toLocaleString()}
                    {newsItem.breaking && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded">BREAKING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Oscillator Panels */}
      {indicators.find(i => i.id === 'rsi')?.enabled && (
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-medium">RSI (14)</span>
            <div className="flex gap-2 text-xs">
              <span className="text-red-400">OB: 70</span>
              <span className="text-green-400">OS: 30</span>
            </div>
          </div>
          <div ref={rsiContainerRef} className="w-full h-[100px]" />
        </div>
      )}

      {indicators.find(i => i.id === 'macd')?.enabled && (
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-medium">MACD (12, 26, 9)</span>
          </div>
          <div ref={macdContainerRef} className="w-full h-[100px]" />
        </div>
      )}

      {indicators.find(i => i.id === 'atr')?.enabled && (
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-medium">ATR (14)</span>
          </div>
          <div ref={atrContainerRef} className="w-full h-[80px]" />
        </div>
      )}

      {/* Chart Controls Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-3">
        <div className="flex gap-4">
          <span>🖱️ Scroll to zoom</span>
          <span>✋ Drag to pan</span>
          <span>🖱️ Double-click to reset</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingMore && <span className="text-orange-400">Loading more data...</span>}
          <span className="text-slate-600">{symbol} • {timeframe}</span>
        </div>
      </div>
    </Card>
  );
}
