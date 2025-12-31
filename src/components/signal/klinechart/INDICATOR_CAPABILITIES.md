# KLineChart Indicator Capabilities & Customization

## How Indicators are Calculated

**Answer: FRONTEND (Browser) - Not Backend**

KLineChart calculates all indicators **in the browser using JavaScript**. The process:

1. **Historical data** comes from your backend API (just OHLCV candles)
2. **KLineChart** applies mathematical formulas client-side
3. **No backend calculation** needed - KLineChart handles it all

This is similar to TradingView's approach - you provide raw candle data, and the library calculates indicators in real-time.

---

## All Available Built-in Indicators (30+ Total)

### Overlay Indicators (Display on Candlestick Chart)
These can be added with `chart.createIndicator('NAME', true, { id: 'candle_pane' })`

| Indicator | Default Params | Description |
|-----------|---------------|-------------|
| **MA** | [5, 10, 30, 60] | Moving Average |
| **EMA** | [6, 12, 20] | Exponential Moving Average |
| **SMA** | [12, 2] | Simple Moving Average |
| **BBI** | [3, 6, 12, 24] | Bull and Bear Index |
| **BOLL** | [20, 2] | Bollinger Bands |
| **SAR** | [2, 2, 20] | Parabolic SAR |

### Oscillator Indicators (Display in Separate Panes)
These create their own pane below the chart

#### Volume-Based
| Indicator | Default Params | Description |
|-----------|---------------|-------------|
| **VOL** | [5, 10, 20] | Volume |
| **OBV** | [30] | On-Balance Volume |
| **PVT** | None | Price Volume Trend |
| **AVP** | None | Average Price |

#### Momentum Indicators
| Indicator | Default Params | Description |
|-----------|---------------|-------------|
| **MACD** | [12, 26, 9] | Moving Average Convergence Divergence |
| **RSI** | [6, 12, 24] | Relative Strength Index |
| **KDJ** | [9, 3, 3] | Stochastic Oscillator |
| **WR** | [6, 10, 14] | Williams %R |
| **MTM** | [6, 10] | Momentum |
| **ROC** | [12, 6] | Rate of Change |
| **PSY** | [12, 6] | Psychological Line |
| **AO** | [5, 34] | Awesome Oscillator |

#### Trend Indicators
| Indicator | Default Params | Description |
|-----------|---------------|-------------|
| **DMI** | [14, 6] | Directional Movement Index |
| **DMA** | [10, 50, 10] | Different Moving Average |
| **TRIX** | [12, 20] | Triple Exponential Average |
| **CCI** | [13] | Commodity Channel Index |
| **EMV** | [14, 9] | Ease of Movement |

#### Other Indicators
| Indicator | Default Params | Description |
|-----------|---------------|-------------|
| **BIAS** | [6, 12, 24] | Bias Ratio |
| **BRAR** | [26] | Bull-Bear Ratio |
| **VR** | [24, 30] | Volume Ratio |
| **CR** | [26, 10, 20, 40, 60] | Energy Index |

---

## User Customization (Like MT5 Mobile App)

### ✅ YES - You Can Customize:

#### 1. **Change Indicator Parameters**
```typescript
// Create MA with custom periods
chart.createIndicator({
  name: 'MA',
  calcParams: [9, 21, 50, 200],  // Custom periods
  precision: 2,
  shouldFormatBigNumber: true,
  visible: true,
  zLevel: 0,
  minValue: null,
  maxValue: null,
  styles: {
    lines: [
      { color: '#FF6D00' }, // MA9
      { color: '#2196F3' }, // MA21
      { color: '#00C853' }, // MA50
      { color: '#9C27B0' }  // MA200
    ]
  }
}, true, { id: 'candle_pane' })

// Change RSI period
chart.createIndicator({
  name: 'RSI',
  calcParams: [21],  // Default is [6, 12, 24], change to single 21-period
  styles: {
    lines: [
      { color: '#A855F7', size: 2 }
    ]
  }
}, false)

// MACD with custom settings
chart.createIndicator({
  name: 'MACD',
  calcParams: [8, 17, 9],  // Fast, Slow, Signal (default: 12, 26, 9)
  styles: {
    bars: [
      { upColor: '#26A69A', downColor: '#EF5350' }
    ],
    lines: [
      { color: '#FF6D00' },  // DIF
      { color: '#2196F3' },  // DEA
    ]
  }
}, false)
```

#### 2. **Update Existing Indicators**
```typescript
// Update indicator parameters dynamically
chart.overrideIndicator({
  name: 'MA',
  calcParams: [10, 20, 50],  // Change from previous settings
  styles: {
    lines: [
      { color: '#FF0000' },
      { color: '#00FF00' },
      { color: '#0000FF' }
    ]
  }
}, 'candle_pane')
```

#### 3. **Color Customization**
```typescript
chart.createIndicator({
  name: 'BOLL',
  calcParams: [20, 2],
  styles: {
    lines: [
      { color: '#06B6D4', size: 1 },  // Upper band
      { color: '#FBBF24', size: 2 },  // Middle band
      { color: '#06B6D4', size: 1 }   // Lower band
    ],
    bands: [
      { color: 'rgba(6, 182, 212, 0.1)' }  // Fill between bands
    ]
  }
}, true, { id: 'candle_pane' })
```

---

## Implementation Example: User-Configurable Indicators

Here's how you can build an MT5-like indicator settings panel:

```typescript
// User selects MA and opens settings
const indicatorSettings = {
  MA: {
    periods: [9, 21, 50, 200],  // Editable array
    colors: ['#FF6D00', '#2196F3', '#00C853', '#9C27B0'],  // Editable
    lineWidth: 2,  // Editable
    applyTo: 'close',  // close, open, high, low
  },
  RSI: {
    period: 14,  // Editable single value
    overbought: 70,  // Editable levels
    oversold: 30,
    color: '#A855F7',
  },
  MACD: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    histogram: true,
  }
}

// Apply user settings
function applyIndicatorSettings(indicatorName, settings) {
  // Remove old indicator
  chart.removeIndicator({ name: indicatorName })
  
  // Create with new settings
  if (indicatorName === 'MA') {
    chart.createIndicator({
      name: 'MA',
      calcParams: settings.periods,
      styles: {
        lines: settings.colors.map((color, i) => ({
          color,
          size: settings.lineWidth
        }))
      }
    }, true, { id: 'candle_pane' })
  } else if (indicatorName === 'RSI') {
    chart.createIndicator({
      name: 'RSI',
      calcParams: [settings.period],
      styles: {
        lines: [{ color: settings.color }],
        bands: [
          { value: settings.overbought, color: '#EF4444' },
          { value: settings.oversold, color: '#22C55E' }
        ]
      }
    }, false)
  }
}
```

---

## Advanced: Custom Indicators

You can even create your **own custom indicators** (like MT5's MQL5):

```typescript
import { registerIndicator } from 'klinecharts'

// Example: Custom SuperTrend indicator
registerIndicator({
  name: 'SUPERTREND',
  shortName: 'ST',
  calcParams: [10, 3],  // Period, Multiplier
  figures: [
    { key: 'supertrend', title: 'ST: ', type: 'line' }
  ],
  calc: (dataList, indicator) => {
    const params = indicator.calcParams
    const period = params[0]
    const multiplier = params[1]
    
    return dataList.map((kLineData, i) => {
      // Your custom calculation logic here
      const atr = calculateATR(dataList, i, period)
      const hl2 = (kLineData.high + kLineData.low) / 2
      const upperBand = hl2 + multiplier * atr
      const lowerBand = hl2 - multiplier * atr
      
      return { supertrend: /* your value */ }
    })
  }
})

// Then use it like built-in indicators
chart.createIndicator('SUPERTREND', false)
```

---

## Comparison with MT5 Mobile

| Feature | MT5 Mobile | KLineChart (Your Implementation) |
|---------|-----------|----------------------------------|
| **Built-in Indicators** | 30+ | 30+ ✅ |
| **Custom Periods** | ✅ Yes | ✅ Yes (via calcParams) |
| **Custom Colors** | ✅ Yes | ✅ Yes (via styles) |
| **Multiple MA Types** | ✅ (Simple, Exponential, etc.) | ✅ (MA, EMA, SMA, etc.) |
| **Oscillator Levels** | ✅ (RSI 70/30 lines) | ✅ (via bands in styles) |
| **Save Settings** | ✅ Cloud sync | ⚠️ You need to implement (localStorage) |
| **Custom Indicators** | ✅ (MQL5) | ✅ (registerIndicator) |
| **Indicator Templates** | ✅ | You can build this |

---

## What You Need to Build

To match MT5's user experience, create:

1. **Indicator Settings Modal**
   - Period inputs (text fields for numbers)
   - Color pickers for each line
   - Line width sliders
   - Enable/disable toggles

2. **Indicator Presets**
   - "Default", "Conservative", "Aggressive"
   - Save/load from localStorage

3. **Real-time Updates**
   - User changes period → remove old → create new
   - Indicators auto-update with new candle data

---

## Summary

✅ **Indicators calculated**: Frontend (browser), not backend  
✅ **Available indicators**: 30+ built-in  
✅ **User customization**: Fully supported (periods, colors, styles)  
✅ **Custom indicators**: Yes, via `registerIndicator()`  
✅ **MT5-like experience**: 100% achievable  

Your implementation is already set up correctly - KLineChart handles all calculations. You just need to build the UI for users to customize parameters!
