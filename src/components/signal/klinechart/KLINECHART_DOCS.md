# KLineChart Documentation Reference

> This document consolidates the key KLineChart API documentation for the trading chart migration.

## Installation

```bash
npm install klinecharts --save
```

---

## 1. Quick Start (React)

```tsx
import { useEffect } from 'react'
import { init, dispose } from 'klinecharts'

export default () => {
  useEffect(() => {
    const chart = init('chart')
    chart.setSymbol({ ticker: 'TestSymbol' })
    chart.setPeriod({ span: 1, type: 'day' })
    chart.setDataLoader({
      getBars: ({ callback }) => {
        callback([
          { timestamp: 1517846400000, open: 7424.6, high: 7511.3, low: 6032.3, close: 7310.1, volume: 224461 },
          // ... more data
        ])
      }
    })

    return () => {
      dispose('chart')
    }
  }, [])

  return <div id="chart" style={{ width: 600, height: 600 }}/>
}
```

---

## 2. Data Format

KLineChart requires data in the following format:

```typescript
{
  timestamp: number    // Required - millisecond timestamp
  open: number         // Required - open price
  close: number        // Required - close price
  high: number         // Required - high price
  low: number          // Required - low price
  volume?: number      // Optional - volume
  turnover?: number    // Optional - turnover (needed for EMV and AVP indicators)
}
```

---

## 3. init(ds, options?) - Chart Initialization

Creates a new chart instance.

### Parameters

- `ds` - Container (DOM element or element id)
- `options` - Optional configuration:
  - `layout` - Custom pane layout array
  - `locale` - Language (`'zh-CN'` | `'en-US'`)
  - `timezone` - Timezone name (e.g., `'Asia/Shanghai'`)
  - `styles` - Style configuration or registered style name
  - `formatter` - Format functions
  - `thousandsSeparator` - Thousands separator config
  - `decimalFold` - Decimal folding config
  - `zoomAnchor` - Zoom anchor (`'cursor'` | `'last_bar'`)

### Returns

Chart instance object.

---

## 4. setDataLoader(dataLoader) - Data Loading

Sets up the data loader for fetching and subscribing to data.

```typescript
chart.setDataLoader({
  // Called when symbol/period changes or chart scrolls to boundary
  getBars: (params: {
    symbol: Symbol
    period: Period
    from: number       // Start timestamp
    to: number         // End timestamp  
    firstDataTimestamp: number
    callback: (data: KLineData[], options?: { more: boolean }) => void
  }) => void | Promise<void>,
  
  // Called after getBars completes - for real-time updates
  subscribeBar?: (params: { symbol: Symbol, period: Period }) => void,
  
  // Called when symbol/period changes
  unsubscribeBar?: (params: { symbol: Symbol, period: Period }) => void
})
```

### Key Points for Lazy Loading:
- `getBars` is triggered when chart scrolls to left/right boundary
- Use `callback(data, { more: true })` to indicate more historical data available
- Use `callback(data, { more: false })` when no more data

---

## 5. createIndicator(indicator, isStack?, paneOptions?)

Creates a technical indicator.

### Built-in Indicators

| Indicator | Default Params | Indicator | Default Params |
|-----------|---------------|-----------|---------------|
| MA | [5, 10, 30, 60] | RSI | [6, 12, 24] |
| EMA | [6, 12, 20] | MACD | [12, 26, 9] |
| SMA | [12, 2] | BOLL | [20, 2] |
| BBI | [3, 6, 12, 24] | KDJ | [9, 3, 3] |
| VOL | [5, 10, 20] | ATR | [14] |

### Overlay-Compatible Indicators
Can be added to candle pane: `BBI`, `BOLL`, `EMA`, `MA`, `SAR`, `SMA`

```typescript
// Add to candle pane
chart.createIndicator('MA', true, { id: 'candle_pane' })

// Add to new pane
chart.createIndicator('MACD')
```

### Parameters

```typescript
createIndicator(
  indicator: string | IndicatorConfig,
  isStack?: boolean,  // Stack on existing pane
  paneOptions?: {
    id?: string
    height?: number
    minHeight?: number
    dragEnabled?: boolean
    order?: number
    state?: 'normal' | 'maximize' | 'minimize'
    axis?: AxisConfig
  }
) => string | null  // Returns indicator ID
```

---

## 6. createOverlay(value)

Creates overlays (drawing tools).

### Built-in Overlay Types

- Lines: `horizontalRayLine`, `horizontalSegment`, `horizontalStraightLine`, `verticalRayLine`, `verticalSegment`, `verticalStraightLine`, `rayLine`, `segment`, `straightLine`
- Price: `priceLine`, `priceChannelLine`, `parallelStraightLine`
- Fibonacci: `fibonacciLine`
- Annotations: `simpleAnnotation`, `simpleTag`

```typescript
// Create horizontal line at price
chart.createOverlay({
  name: 'priceLine',
  points: [{ timestamp: Date.now(), value: 100.50 }],
  styles: {
    line: { color: '#22C55E', style: 'dashed' }
  }
})
```

---

## 7. Style Configuration

### Dark Theme Example

```typescript
const darkStyles = {
  grid: {
    show: true,
    horizontal: { color: '#1F2937', style: 'dashed', dashedValue: [2, 2] },
    vertical: { color: '#1F2937', style: 'dashed', dashedValue: [2, 2] }
  },
  candle: {
    type: 'candle_solid',  // 'candle_solid' | 'candle_stroke' | 'ohlc' | 'area'
    bar: {
      upColor: '#22C55E',
      downColor: '#EF4444',
      upBorderColor: '#22C55E',
      downBorderColor: '#EF4444',
      upWickColor: '#22C55E',
      downWickColor: '#EF4444'
    },
    priceMark: {
      show: true,
      high: { show: true, color: '#D9D9D9' },
      low: { show: true, color: '#D9D9D9' },
      last: {
        show: true,
        upColor: '#22C55E',
        downColor: '#EF4444',
        line: { show: true, style: 'dashed', dashedValue: [4, 4] }
      }
    }
  },
  xAxis: {
    show: true,
    axisLine: { color: '#374151' },
    tickText: { color: '#9CA3AF' }
  },
  yAxis: {
    show: true,
    axisLine: { color: '#374151' },
    tickText: { color: '#9CA3AF' }
  },
  crosshair: {
    show: true,
    horizontal: {
      line: { color: '#F97316', style: 'dashed' },
      text: { backgroundColor: '#F97316' }
    },
    vertical: {
      line: { color: '#F97316', style: 'dashed' },
      text: { backgroundColor: '#F97316' }
    }
  }
}
```

---

## 8. Instance Methods Reference

### Data Methods
- `setDataLoader(loader)` - Set data loader
- `resetData()` - Clear and reload data
- `getDataList()` - Get current data array
- `getVisibleRange()` - Get visible data range

### Symbol & Period
- `setSymbol(symbol)` - Set trading symbol
- `getSymbol()` - Get current symbol
- `setPeriod(period)` - Set timeframe period
- `getPeriod()` - Get current period

### Indicators
- `createIndicator(indicator, isStack?, paneOptions?)` - Create indicator
- `overrideIndicator(indicator, paneId?)` - Update indicator config
- `getIndicators(paneId?)` - Get indicators
- `removeIndicator(paneId?, name?)` - Remove indicator

### Overlays
- `createOverlay(value)` - Create overlay
- `overrideOverlay(overlay)` - Update overlay
- `getOverlays(paneId?)` - Get overlays
- `removeOverlay(id?)` - Remove overlay

### View Control
- `setStyles(styles)` - Update styles
- `getStyles()` - Get current styles
- `resize()` - Resize chart
- `scrollToRealTime()` - Scroll to latest data
- `scrollToTimestamp(timestamp)` - Scroll to specific time
- `scrollToDataIndex(index)` - Scroll to data index

### Zoom & Scroll
- `setZoomEnabled(enabled)` - Enable/disable zoom
- `setScrollEnabled(enabled)` - Enable/disable scroll
- `zoomAtCoordinate(scale, coord?, animationDuration?)` - Zoom at coordinate

### Events
- `subscribeAction(type, callback)` - Subscribe to events
- `unsubscribeAction(type, callback?)` - Unsubscribe

### Action Types
- `'onZoom'` - Zoom event
- `'onScroll'` - Scroll event
- `'onVisibleRangeChange'` - Visible range changed
- `'onTooltipIconClick'` - Tooltip icon clicked
- `'onCrosshairChange'` - Crosshair position changed
- `'onCandleBarClick'` - Candle bar clicked
- `'onPaneDrag'` - Pane drag event

---

## 9. Internationalization

```typescript
// Register custom locale
klinecharts.registerLocale('en-US', {
  time: 'Time: ',
  open: 'Open: ',
  high: 'High: ',
  low: 'Low: ',
  close: 'Close: ',
  volume: 'Vol: ',
  second: 's',
  minute: 'm',
  hour: 'h',
  day: 'd',
  week: 'w',
  month: 'M',
  year: 'Y'
})

// Use locale
const chart = init('chart', { locale: 'en-US' })
// or
chart.setLocale('en-US')
```

---

## 10. API Comparison: Lightweight Charts vs KLineChart

| Feature | Lightweight Charts | KLineChart |
|---------|-------------------|------------|
| **Init** | `createChart(container, options)` | `init(container, options)` |
| **Dispose** | `chart.remove()` | `dispose(container)` |
| **Add Candles** | `chart.addSeries(CandlestickSeries)` | Built-in candle pane |
| **Set Data** | `series.setData(data)` | `setDataLoader({ getBars })` |
| **Update Bar** | `series.update(bar)` | Via `subscribeBar` callback |
| **Indicators** | Manual line series | `createIndicator('MA')` |
| **Time Format** | Seconds since epoch | Milliseconds timestamp |
| **Lazy Load** | Manual via `subscribeVisibleTimeRangeChange` | Built-in via `getBars` callback |
| **Overlays** | Custom implementation | `createOverlay()` with built-in tools |
| **Resize** | `chart.applyOptions({ width, height })` | `chart.resize()` |
| **Styles** | Via options object | Via `setStyles()` or init options |

### Data Format Conversion

```typescript
// Lightweight Charts format (seconds)
{ time: 1517846400, open: 100, high: 110, low: 95, close: 105 }

// KLineChart format (milliseconds)
{ timestamp: 1517846400000, open: 100, high: 110, low: 95, close: 105, volume: 1000 }
```

---

## 11. Migration Notes

### Breaking Changes from Lightweight Charts

1. **Time units**: KLineChart uses milliseconds, not seconds
2. **Data loading**: Use `setDataLoader` instead of manually setting data
3. **Indicators**: Built-in support, no need for manual calculation
4. **Series concept**: No separate series - use indicators and overlays
5. **Resize**: Call `chart.resize()` instead of applying options

### Real-time Updates

```typescript
// In setDataLoader
chart.setDataLoader({
  getBars: ({ symbol, period, callback }) => {
    // Fetch historical data
    fetchData(symbol, period).then(data => {
      callback(data, { more: true })
    })
  },
  subscribeBar: ({ symbol, period }) => {
    // Subscribe to SSE or WebSocket
    sseService.subscribe(symbol, (newBar) => {
      // KLineChart automatically handles real-time updates
      // via the callback mechanism
    })
  },
  unsubscribeBar: ({ symbol, period }) => {
    sseService.unsubscribe(symbol)
  }
})
```

### Strategy Lines (Entry/TP/SL)

Use `createOverlay` with `priceLine`:

```typescript
chart.createOverlay({
  name: 'priceLine',
  id: 'entry-line',
  points: [{ value: entryPrice }],
  styles: {
    line: { color: '#3B82F6', style: 'dashed', size: 2 },
    text: { color: '#3B82F6' }
  }
})
```

---

## 12. Environment Requirements

- Requires browser with Canvas support
- For older browsers, may need polyfills:
  - `core-js` for Map support
  - `intl` for Intl API
