import { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { Button } from '@/components/ui/button';
import { TrendingUp, Newspaper, Maximize2 } from 'lucide-react';

interface TradingChartProps {
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
  volume: number;
}

interface Indicator {
  id: string;
  name: string;
  period: number;
  color: string;
  type: 'ema' | 'sma';
}

const TIMEFRAMES = [
  { value: 'M5', label: 'M5' },
  { value: 'M15', label: 'M15' },
  { value: 'H1', label: 'H1' },
  { value: 'H4', label: 'H4' },
  { value: 'D1', label: 'D1' },
];

const DEFAULT_INDICATORS: Indicator[] = [
  { id: 'ema9', name: 'EMA 9', period: 9, color: '#F97316', type: 'ema' },
  { id: 'ema21', name: 'EMA 21', period: 21, color: '#3B82F6', type: 'ema' },
  { id: 'ema50', name: 'EMA 50', period: 50, color: '#10B981', type: 'ema' },
  { id: 'sma200', name: 'SMA 200', period: 200, color: '#8B5CF6', type: 'sma' },
];

// Calculate EMA
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

// Calculate SMA
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

export function TradingChart({ symbol, timeframe, onTimeframeChange }: TradingChartProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('activeIndicators');
    return saved ? JSON.parse(saved) : ['ema21'];
  });
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(() => {
    // Load legend preference from localStorage
    const saved = localStorage.getItem('showChartLegend');
    return saved ? JSON.parse(saved) : true;
  });
  const [showNewsMarkers, setShowNewsMarkers] = useState(() => {
    // Load news markers preference from localStorage
    const saved = localStorage.getItem('showNewsMarkers');
    return saved ? JSON.parse(saved) : false;
  });
  const [showPeriodSeparators, setShowPeriodSeparators] = useState(() => {
    // Load period separator preference from localStorage
    const saved = localStorage.getItem('showPeriodSeparators');
    return saved ? JSON.parse(saved) : false;
  });
  const [hoveredNews, setHoveredNews] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());
  const newsMarkersRef = useRef<any[]>([]);
  const newsDataRef = useRef<Map<number, any>>(new Map());  // Store news details by timestamp
  const visibleTimeRangeRef = useRef<{ from: number; to: number } | null>(null);  // Track time range, not logical range
  const centerTimeRef = useRef<number | null>(null);  // Track center point for timeframe switching
  const oldestTimestampRef = useRef<number | null>(null);  // Use ref instead of state
  const lastLoadTimestampRef = useRef<number | null>(null);  // Track last loaded timestamp to prevent duplicates

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Ensure container has dimensions
    const width = chartContainerRef.current.clientWidth || 600;
    const height = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: showPeriodSeparators ? '#1F2937' : 'transparent' },
        horzLines: { color: '#1F2937' },
      },
      crosshair: {
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
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Click elsewhere to close tooltip
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on tooltip or chart canvas
      if (!target.closest('.news-tooltip') && !target.closest('canvas')) {
        setHoveredNews(null);
        setTooltipPosition(null);
      }
    };

    // Add click handler for news markers
    chart.subscribeClick((param: any) => {
      if (!param.point || !param.time) {
        return;
      }

      const clickedTime = Math.floor(param.time);
      const newsDataArray = newsDataRef.current.get(clickedTime);
      
      if (newsDataArray && newsDataArray.length > 0) {
        console.log('[Chart] Clicked on news marker:', newsDataArray);
        // Store the array of news items
        setHoveredNews(newsDataArray);
        setTooltipPosition({ x: param.point.x, y: param.point.y });
      }
    });

    document.addEventListener('click', handleClickOutside);

    // Track visible range changes to maintain zoom and trigger lazy loading
    let debounceTimer: NodeJS.Timeout;
    chart.timeScale().subscribeVisibleTimeRangeChange((newRange) => {
      if (newRange) {
        visibleTimeRangeRef.current = { from: newRange.from as number, to: newRange.to as number };
        // Save center point for timeframe switching
        centerTimeRef.current = ((newRange.from as number) + (newRange.to as number)) / 2;
        
        // Debounce lazy loading checks
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          // Check if user scrolled near the beginning - trigger lazy load
          if (oldestTimestampRef.current && !isLoadingMore) {
            const visibleRange = (newRange.to as number) - (newRange.from as number);
            const buffer = visibleRange * 0.5; // Load when within 50% of edge
            
            const shouldLoad = (newRange.from as number) - buffer <= oldestTimestampRef.current;
            
            if (shouldLoad && oldestTimestampRef.current !== lastLoadTimestampRef.current) {
              console.log('[Chart] Near edge, loading more data...');
              loadMoreHistoricalData();
            }
          }
        }, 300); // 300ms debounce
      }
    });

    // Handle resize
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

  // Fetch and update chart data
  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Initial load with optimized limits for historical data
      const limits: Record<string, number> = {
        'M5': 5000,   // ~17 days
        'M15': 3000,  // ~31 days
        'H1': 3000,   // ~125 days
        'H4': 2000,   // ~333 days
        'D1': 750,    // ~2 years
      };
      const limit = limits[timeframe] || 3000;
      
      const response = await apiService.getHistoricalData(symbol, timeframe, limit);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.candles && candlestickSeriesRef.current) {
        // Convert to Lightweight Charts format
        const chartData = response.data.candles.map((candle: Candle) => ({
          time: (new Date(candle.time).getTime() / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        if (chartData.length === 0) {
          console.warn('[Chart] No data received from API');
          setError('No historical data available for this symbol/timeframe');
          setLoading(false);
          return;
        }

        candlestickSeriesRef.current.setData(chartData);
        
        // Track oldest timestamp for lazy loading
        if (chartData.length > 0) {
          oldestTimestampRef.current = chartData[0].time as number;
          console.log('[Chart] Set oldest timestamp:', new Date(oldestTimestampRef.current * 1000).toISOString());
        }
        
        // Calculate and add indicators
        updateIndicators(chartData);
        
        // Restore zoom level or fit content
        if (chartRef.current && chartData.length > 0) {
          const firstTime = chartData[0].time as number;
          const lastTime = chartData[chartData.length - 1].time as number;
          
          if (centerTimeRef.current) {
            // Calculate appropriate visible range based on timeframe
            const timeframeDurations: Record<string, number> = {
              'M5': 60 * 60 * 24 * 3,      // 3 days worth of 5-min candles
              'M15': 60 * 60 * 24 * 7,     // 7 days worth of 15-min candles
              'H1': 60 * 60 * 24 * 30,     // 30 days worth of 1-hour candles
              'H4': 60 * 60 * 24 * 90,     // 90 days worth of 4-hour candles
              'D1': 60 * 60 * 24 * 180,    // 180 days worth of daily candles
            };
            const duration = timeframeDurations[timeframe] || 60 * 60 * 24 * 30;
            const halfDuration = duration / 2;
            
            // Center on the saved center point
            let from = centerTimeRef.current - halfDuration;
            let to = centerTimeRef.current + halfDuration;
            
            // Clamp to available data
            from = Math.max(from, firstTime);
            to = Math.min(to, lastTime);
            
            // Ensure we have some visible range
            if (to - from < 60) {
              to = from + duration;
            }
            
            chartRef.current.timeScale().setVisibleRange({ from, to });
          } else {
            chartRef.current.timeScale().fitContent();
          }
        }
      } else {
        setError('No data available');
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch and display news markers
  const fetchNewsMarkers = async () => {
    if (!candlestickSeriesRef.current) return;

    try {
      console.log('[Chart] Fetching news markers for', symbol);
      const response = await fetch(`http://localhost:8080/api/news/markers/${symbol}?min_importance=3`);
      const data = await response.json();
      
      console.log('[Chart] Received', data.markers?.length || 0, 'news markers');

      if (data.markers && data.markers.length > 0) {
        // Clear existing markers
        candlestickSeriesRef.current.setMarkers([]);
        newsMarkersRef.current = [];
        newsDataRef.current.clear();

        let processedMarkers = data.markers;

        // Aggregate markers for larger timeframes to reduce clutter
        // M5 and M15: Show individual markers
        // H1, H4, D1: Aggregate by candle period
        if (timeframe === 'H1' || timeframe === 'H4' || timeframe === 'D1') {
          console.log(`[Chart] Starting aggregation for ${timeframe}, input: ${processedMarkers.length} markers`);
          const timeGroups = new Map<number, any[]>();
          
          processedMarkers.forEach((news: any) => {
            const timestamp = Math.floor(new Date(news.time).getTime() / 1000); // Convert to seconds
            let groupKey: number;
            
            if (timeframe === 'H1') {
              // Group by hour (3600 seconds)
              groupKey = Math.floor(timestamp / 3600) * 3600;
            } else if (timeframe === 'H4') {
              // Group by 4-hour block (14400 seconds)
              groupKey = Math.floor(timestamp / 14400) * 14400;
            } else {
              // D1: Group by day (86400 seconds)
              groupKey = Math.floor(timestamp / 86400) * 86400;
            }
            
            if (!timeGroups.has(groupKey)) {
              timeGroups.set(groupKey, []);
            }
            timeGroups.get(groupKey)!.push(news);
          });
          
          console.log(`[Chart] Created ${timeGroups.size} time groups for ${timeframe}`);
          
          // Create aggregated markers with all news items
          processedMarkers = Array.from(timeGroups.entries()).map(([groupTimestamp, newsItems]) => {
            // Sort by importance (highest first)
            newsItems.sort((a, b) => b.importance - a.importance);
            const highestImportance = newsItems[0];
            
            console.log(`[Chart] Group at ${new Date(groupTimestamp * 1000).toISOString()}: ${newsItems.length} items`);
            
            return {
              time: new Date(groupTimestamp * 1000).toISOString(),
              importance: highestImportance.importance,
              color: highestImportance.color,
              breaking: newsItems.some(n => n.breaking),
              aggregatedNews: newsItems, // Store all original news items
              aggregatedCount: newsItems.length,
            };
          });
          
          console.log(`[Chart] Aggregated ${data.markers.length} → ${processedMarkers.length} markers for ${timeframe}`);
        } else {
          console.log(`[Chart] No aggregation for ${timeframe}, showing ${processedMarkers.length} individual markers`);
        }

        // Create all markers
        const markers = processedMarkers.map((news: any) => {
          const timestamp = Math.floor(new Date(news.time).getTime() / 1000);
          
          // Store news data for click handler
          // If it's an aggregated marker, store the array; otherwise store as single-item array
          const newsData = news.aggregatedNews ? news.aggregatedNews : [news];
          newsDataRef.current.set(timestamp, newsData);
          
          return {
            time: timestamp as any,
            position: 'aboveBar' as const,
            color: news.color || '#64748b',
            shape: news.breaking ? 'arrowDown' as const : 'circle' as const,
            text: news.aggregatedCount > 1 ? `${news.aggregatedCount}` : (news.importance >= 4 ? '!' : ''),
            size: news.aggregatedCount > 1 ? 2 : (news.importance >= 4 ? 2 : 1),
          };
        });

        // Sort markers by time in ascending order (required by lightweight-charts)
        markers.sort((a, b) => a.time - b.time);

        // Set all markers at once
        candlestickSeriesRef.current.setMarkers(markers);
        newsMarkersRef.current = markers;
        
        console.log(`[Chart] Added ${markers.length} news markers (all time, importance >= 3)`);
      }
    } catch (error) {
      console.error('Failed to fetch news markers:', error);
    }
  };

  // Toggle news markers
  const toggleNewsMarkers = () => {
    const newValue = !showNewsMarkers;
    setShowNewsMarkers(newValue);
    localStorage.setItem('showNewsMarkers', JSON.stringify(newValue));

    if (newValue) {
      fetchNewsMarkers();
    } else {
      // Remove all markers
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setMarkers([]);
      }
      newsMarkersRef.current = [];
      newsDataRef.current.clear();
    }
  };

  // Reset zoom to fit all data
  const resetZoom = () => {
    if (chartRef.current) {
      visibleTimeRangeRef.current = null;
      chartRef.current.timeScale().fitContent();
    }
  };

  // Lazy load more historical data when scrolling back
  const loadMoreHistoricalData = async () => {
    if (isLoadingMore || !oldestTimestampRef.current || !candlestickSeriesRef.current) return;
    
    // Prevent loading same timestamp again
    if (oldestTimestampRef.current === lastLoadTimestampRef.current) {
      console.log('[Chart] Already loaded this timestamp, skipping');
      return;
    }

    setIsLoadingMore(true);
    lastLoadTimestampRef.current = oldestTimestampRef.current; // Mark as loading
    
    try {
      console.log('[Chart] Loading more data before', new Date(oldestTimestampRef.current * 1000));
      
      const limits: Record<string, number> = {
        'M5': 5000,
        'M15': 3000,
        'H1': 3000,
        'H4': 2000,
        'D1': 750,
      };
      const limit = limits[timeframe] || 3000;
      
      // Fetch data before the oldest timestamp using apiService
      const response = await apiService.getHistoricalData(
        symbol, 
        timeframe, 
        limit, 
        oldestTimestampRef.current
      );
      
      console.log('[Chart] Lazy load response:', {
        hasData: !!response.data,
        hasCandlesKey: !!response.data?.candles,
        candlesLength: response.data?.candles?.length || 0,
        error: response.error
      });

      if (response.error) {
        console.error('[Chart] API error:', response.error);
        lastLoadTimestampRef.current = null; // Reset to allow retry
        return;
      }

      if (response.data?.candles && response.data.candles.length > 0) {
        console.log('[Chart] Loaded', response.data.candles.length, 'more candles');
        
        const formattedData = response.data.candles.map((candle: any) => ({
          time: Math.floor(new Date(candle.time).getTime() / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        // Get current data (already in ascending order)
        const currentData = candlestickSeriesRef.current.data() as any[];
        
        // Merge and deduplicate by timestamp
        const timeMap = new Map();
        
        // Add new older data first
        formattedData.forEach((candle: any) => {
          timeMap.set(candle.time, candle);
        });
        
        // Add existing data (will overwrite any duplicates)
        currentData.forEach((candle: any) => {
          timeMap.set(candle.time, candle);
        });
        
        // Convert to array and sort by time (ascending)
        const mergedData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
        
        console.log('[Chart] Merged data length:', mergedData.length, 'Oldest:', new Date(mergedData[0].time * 1000).toISOString());
        
        // Update chart
        candlestickSeriesRef.current.setData(mergedData);
        
        // Update indicators with merged data
        updateIndicators(mergedData);
        
        // Update oldest timestamp
        oldestTimestampRef.current = mergedData[0].time as number;
        console.log('[Chart] New oldest timestamp:', new Date(oldestTimestampRef.current * 1000).toISOString());
      } else {
        console.log('[Chart] No more historical data available - reached earliest data');
        // Mark as loaded to prevent further attempts
        lastLoadTimestampRef.current = oldestTimestampRef.current;
      }
    } catch (error) {
      console.error('[Chart] Error loading more data:', error);
      lastLoadTimestampRef.current = null; // Reset on error so we can retry
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Subscribe to real-time updates via SSE (symbol-based, not timeframe-based)
  useEffect(() => {
    if (!symbol || !candlestickSeriesRef.current) return;

    console.log(`[Chart] Subscribing to SSE: ${symbol} (all timeframes)`);

    let unsubscribe: (() => void) | null = null;

    // Small delay to avoid React Strict Mode double-mount issues
    const timer = setTimeout(() => {
      unsubscribe = sseService.subscribeToCandleUpdates(
        symbol,
        'ALL',  // Subscribe to all timeframes for this symbol
        (data) => {
          // Filter for current timeframe on client side
          if (data.type === 'candle_update' && 
              data.symbol === symbol && 
              data.timeframe === timeframe && 
              candlestickSeriesRef.current) {
            const newCandle = {
              time: data.candle.time.split('T')[0], // Convert ISO to YYYY-MM-DD
              open: data.candle.open,
              high: data.candle.high,
              low: data.candle.low,
              close: data.candle.close,
            };

            console.log(`[Chart] New ${timeframe} candle received:`, newCandle);

            // Update the chart with new candle
            candlestickSeriesRef.current.update(newCandle);

            // Update indicators if active
            if (activeIndicators.length > 0) {
              // Fetch latest data and recalculate indicators
              fetchChartData();
            }

            // If news markers are shown, check for new news at this time
            if (showNewsMarkers) {
              fetchNewsMarkers();
            }
          }
        },
        (error) => {
          console.error('[Chart] SSE error:', error);
        }
      );
    }, 100);

    // Cleanup on unmount or when symbol changes (NOT timeframe)
    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        console.log(`[Chart] Unsubscribing from SSE: ${symbol}`);
        unsubscribe();
      }
    };
  }, [symbol]);  // Only depend on symbol, not timeframe

  // Fetch news markers when enabled or symbol changes
  useEffect(() => {
    if (showNewsMarkers && candlestickSeriesRef.current) {
      fetchNewsMarkers();
    }
  }, [showNewsMarkers, symbol]);

  // Update indicators based on active list
  const updateIndicators = (chartData: any[]) => {
    if (!chartRef.current) return;

    // Remove all existing indicator series
    indicatorSeriesRef.current.forEach((series) => {
      chartRef.current.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Get close prices
    const closePrices = chartData.map(d => d.close);

    // Add active indicators
    activeIndicators.forEach(indicatorId => {
      const indicator = DEFAULT_INDICATORS.find(ind => ind.id === indicatorId);
      if (!indicator) return;

      // Calculate indicator values
      const values = indicator.type === 'ema' 
        ? calculateEMA(closePrices, indicator.period)
        : calculateSMA(closePrices, indicator.period);

      // Create line series data
      const lineData = chartData.map((candle, i) => ({
        time: candle.time,
        value: values[i],
      })).filter(d => !isNaN(d.value));

      // Add line series to chart
      const lineSeries = chartRef.current.addLineSeries({
        color: indicator.color,
        lineWidth: 2,
        title: indicator.name,
        priceLineVisible: false,
        lastValueVisible: showLegend,
        priceScaleId: 'right',
      });
      
      lineSeries.setData(lineData);
      indicatorSeriesRef.current.set(indicatorId, lineSeries);
    });
  };

  // Toggle indicator on/off
  const toggleIndicator = (indicatorId: string) => {
    setActiveIndicators(prev => {
      const newIndicators = prev.includes(indicatorId) 
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId];
      
      // Save to localStorage
      localStorage.setItem('activeIndicators', JSON.stringify(newIndicators));
      return newIndicators;
    });
  };

  // Toggle legend visibility
  const toggleLegend = () => {
    setShowLegend(prev => {
      const newValue = !prev;
      localStorage.setItem('showChartLegend', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Toggle period separators
  const togglePeriodSeparators = () => {
    setShowPeriodSeparators(prev => {
      const newValue = !prev;
      localStorage.setItem('showPeriodSeparators', JSON.stringify(newValue));
      // Update chart grid options
      if (chartRef.current) {
        chartRef.current.applyOptions({
          grid: {
            vertLines: { color: newValue ? '#1F2937' : 'transparent' },
            horzLines: { color: '#1F2937' },
          },
        });
      }
      return newValue;
    });
  };

  useEffect(() => {
    if (candlestickSeriesRef.current) {
      // Reset lazy loading refs on any change
      oldestTimestampRef.current = null;
      lastLoadTimestampRef.current = null;
      // centerTimeRef is preserved across timeframe changes to maintain position
      fetchChartData();
    }
  }, [symbol, timeframe, activeIndicators, showLegend, showPeriodSeparators]);

  return (
    <div className="flex flex-col h-full">
      {/* Timeframe Buttons */}
      <div className="flex justify-between items-center gap-2 mb-3">
        <div className="flex gap-2">
          {TIMEFRAMES.map(tf => (
            <Button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              variant={timeframe === tf.value ? 'default' : 'outline'}
              size="sm"
              className={`${
                timeframe === tf.value
                  ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600'
                  : 'bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* Indicators Button */}
        <div className="flex gap-2">
          {/* News Markers Toggle */}
          <Button
            onClick={toggleNewsMarkers}
            variant="outline"
            size="sm"
            className={`${
              showNewsMarkers
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                : 'bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 mr-2" />
            News
          </Button>

          {/* Period Separator Toggle */}
          <Button
            onClick={togglePeriodSeparators}
            variant="outline"
            size="sm"
            className={`${
              showPeriodSeparators
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                : 'bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
            title="Toggle period separators"
          >
            |
          </Button>

          {/* Reset Zoom Button */}
          <Button
            onClick={resetZoom}
            variant="outline"
            size="sm"
            className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white"
            title="Reset zoom to fit all data"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Indicators Button */}
          <div className="relative">
            <Button
              onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
              variant="outline"
              size="sm"
              className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Indicators
            </Button>

          {/* Indicators Dropdown */}
          {showIndicatorMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-2">
              {/* Legend Toggle */}
              <button
                onClick={toggleLegend}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center justify-between border-b border-gray-700 mb-2 pb-2"
              >
                <span className="text-gray-300">Show Labels</span>
                {showLegend && (
                  <span className="text-green-500">✓</span>
                )}
              </button>

              {/* Indicator List */}
              {DEFAULT_INDICATORS.map(indicator => (
                <button
                  key={indicator.id}
                  onClick={() => toggleIndicator(indicator.id)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: indicator.color }}
                    />
                    <span className="text-gray-300">{indicator.name}</span>
                  </span>
                  {activeIndicators.includes(indicator.id) && (
                    <span className="text-green-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative flex-1 min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <div className="text-gray-400 text-sm">Loading chart data...</div>
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

        <div ref={chartContainerRef} className="w-full h-full" />

        {/* News Tooltip */}
        {hoveredNews && tooltipPosition && (
          <div
            className="news-tooltip absolute z-50 bg-gray-900 border border-orange-500/50 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto"
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
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Display all news items */}
            <div className="space-y-3">
              {(Array.isArray(hoveredNews) ? hoveredNews : [hoveredNews]).map((newsItem: any, idx: number) => (
                <div key={idx} className={`${idx > 0 ? 'pt-3 border-t border-gray-700' : ''}`}>
                  <h5 className="text-sm font-medium text-white mb-2">
                    {newsItem.full_headline || newsItem.headline}
                  </h5>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>{new Date(newsItem.time).toLocaleString()}</span>
                      {newsItem.breaking && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                          BREAKING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Importance:</span>
                        <span className="text-orange-400 font-semibold">
                          {'★'.repeat(newsItem.importance)}{'☆'.repeat(5 - newsItem.importance)}
                        </span>
                      </div>
                      {newsItem.impact && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Impact:</span>
                          <span className={
                            newsItem.impact === 'bullish' ? 'text-green-400' :
                            newsItem.impact === 'bearish' ? 'text-red-400' :
                            'text-gray-400'
                          }>
                            {newsItem.impact.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {newsItem.volatility && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Volatility:</span>
                        <span className="text-yellow-400">{newsItem.volatility.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart Controls Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-4">
          <span>🖱️ Scroll to zoom</span>
          <span>✋ Drag to pan</span>
          <span>🖱️ Double-click to reset</span>
        </div>
        <div className="text-gray-600">
          {symbol} • {timeframe}
        </div>
      </div>
    </div>
  );
}
