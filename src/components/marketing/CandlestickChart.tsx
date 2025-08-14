import React, { useEffect, useRef, useState } from 'react';

// Define the shape of our candle data
interface Candle {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

// Helper function to calculate Exponential Moving Average
const calculateEMA = (data: number[], period: number): (number | null)[] => {
    if (data.length < period) {
        return new Array(data.length).fill(null);
    }

    const k = 2 / (period + 1);
    const emaArray: (number | null)[] = new Array(data.length).fill(null);

    // First EMA is the SMA of the first 'period' values
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    emaArray[period - 1] = sum / period;

    // Calculate the rest of the EMAs
    for (let i = period; i < data.length; i++) {
        const prevEma = emaArray[i - 1];
        if (prevEma !== null) {
            emaArray[i] = (data[i] - prevEma) * k + prevEma;
        }
    }

    return emaArray;
};

const DynamicCandlestickChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDisclaimerVisible, setDisclaimerVisible] = useState(true);
  
  const chartDataRef = useRef<Candle[]>([]);
  const chartStateRef = useRef({
    volatility: 10,
    trend: 0.55,
    initialPrice: 3358,
    upperBound: 3400 * 1.1,
    lowerBound: 3270 * 0.9,
  });
  const intervalRef = useRef<number | null>(null);

  // Define constants for chart data
  const VISIBLE_CANDLES = 60;
  const MAX_EMA_PERIOD = 21; // Must be the longest EMA period

  const generateCandleData = (count: number, lastClose: number, volatility: number, trend: number): Candle[] => {
    const data: Candle[] = [];
    let currentClose = lastClose;
    const { upperBound, lowerBound } = chartStateRef.current;
    
    let adjustedTrend = trend;
    if (currentClose > upperBound) {
        adjustedTrend = 0.45;
    } else if (currentClose < lowerBound) {
        adjustedTrend = 0.65;
    }

    for (let i = 0; i < count; i++) {
      const open = currentClose;
      const close = open + (Math.random() - (1 - adjustedTrend)) * volatility;
      const high = Math.max(open, close) + Math.random() * (volatility / 2);
      const low = Math.min(open, close) - Math.random() * (volatility / 2);
      data.push({ o: open, h: high, l: low, c: close, v: Math.random() * 100 });
      currentClose = close;
    }
    return data;
  };

  const drawChartContent = (svgElement: SVGSVGElement, fullData: Candle[]) => {
    const candlesGroup = svgElement.querySelector('.candles');
    const volumeGroup = svgElement.querySelector('.volume-bars');
    const priceLevelsGroup = svgElement.querySelector('.price-levels');
    const emaLinesGroup = svgElement.querySelector('.ema-lines');

    if (!candlesGroup || !volumeGroup || !priceLevelsGroup || !emaLinesGroup) return;

    // We only want to display the last N candles
    const displayData = fullData.slice(-VISIBLE_CANDLES);

    const allPrices = displayData.flatMap(d => [d.h, d.l]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    const y = (price: number) => 480 - ((price - minPrice) / (maxPrice - minPrice)) * 400;

    let candleHtml = '';
    let volumeHtml = '';
    
    displayData.forEach((d, i) => {
      const x = 20 + i * (960 / displayData.length);
      const candleWidth = (960 / displayData.length) * 0.6;
      const isBullish = d.c >= d.o;
      const color = isBullish ? '#22c55e' : '#ef4444';

      candleHtml += `<line x1="${x}" y1="${y(d.h)}" x2="${x}" y2="${y(d.l)}" stroke="${color}" stroke-width="1.5" />`;
      candleHtml += `<rect x="${x - candleWidth / 2}" y="${y(Math.max(d.o, d.c))}" width="${candleWidth}" height="${Math.abs(y(d.o) - y(d.c)) || 1}" fill="${color}" />`;
      volumeHtml += `<rect x="${x - candleWidth / 2}" y="${80 - d.v * 0.8}" width="${candleWidth}" height="${d.v * 0.8}" fill="${isBullish ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}" />`;
    });

    let priceLevelHtml = '';
    const numLevels = 5;
    for (let i = 0; i <= numLevels; i++) {
        const price = minPrice + (i / numLevels) * (maxPrice - minPrice);
        const yPos = y(price);
        priceLevelHtml += `<text x="1005" y="${yPos + 4}" font-size="12" fill="#9ca3af">${price.toFixed(2)}</text>`;
        priceLevelHtml += `<line x1="20" y1="${yPos}" x2="1000" y2="${yPos}" stroke="#374151" stroke-width="1" stroke-dasharray="2 4"/>`;
    }

    candlesGroup.innerHTML = candleHtml;
    volumeGroup.innerHTML = volumeHtml;
    priceLevelsGroup.innerHTML = priceLevelHtml;
    
    // Calculate EMAs on the full dataset, but only display the visible part
    const closingPrices = fullData.map(d => d.c);
    const ema9 = calculateEMA(closingPrices, 9).slice(-VISIBLE_CANDLES);
    const ema21 = calculateEMA(closingPrices, 21).slice(-VISIBLE_CANDLES);
    
    const drawEMALine = (emaData: (number | null)[], color: string) => {
        let pathD = "M";
        let firstPoint = true;
        emaData.forEach((point, i) => {
            if (point !== null) {
                const x = 20 + i * (960 / displayData.length);
                const yCoord = y(point);
                if (firstPoint) {
                    pathD += `${x},${yCoord}`;
                    firstPoint = false;
                } else {
                    pathD += ` L ${x},${yCoord}`;
                }
            }
        });
        return firstPoint ? '' : `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" />`;
    };

    emaLinesGroup.innerHTML = `
        ${drawEMALine(ema9, '#3b82f6')}
        ${drawEMALine(ema21, '#f59e0b')}
    `;
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleScroll = () => {
        if (window.scrollY > 400) {
            setDisclaimerVisible(false);
        } else {
            setDisclaimerVisible(true);
        }
    };
    window.addEventListener('scroll', handleScroll);

    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }

    svgElement.innerHTML = `
      <g class="price-levels"></g>
      <g class="candles"></g>
      <g class="ema-lines"></g>
      <g class="volume-bars" transform="translate(0, 500)"></g>
      <text x="20" y="40" font-size="24" font-weight="bold" fill="white">XAUUSD</text>
      <text class="current-price" x="150" y="40" font-size="24" font-weight="bold" fill="#22c55e"></text>
    `;

    // Generate enough data to "warm up" the longest EMA period
    const initialDataSize = VISIBLE_CANDLES + MAX_EMA_PERIOD;
    chartDataRef.current = generateCandleData(initialDataSize, chartStateRef.current.initialPrice, chartStateRef.current.volatility, chartStateRef.current.trend);
    drawChartContent(svgElement, chartDataRef.current);

    intervalRef.current = window.setInterval(() => {
      const { volatility, trend } = chartStateRef.current;
      
      const newData = [...chartDataRef.current];
      newData.shift(); // Remove oldest candle
      const lastCandle = newData[newData.length - 1];
      const newCandle = generateCandleData(1, lastCandle.c, volatility, trend);
      newData.push(...newCandle); // Add newest candle

      chartDataRef.current = newData;
      drawChartContent(svgElement, chartDataRef.current);
      
      const currentPriceEl = svgElement.querySelector('.current-price');
      if (currentPriceEl) {
        const latestPrice = newData[newData.length - 1].c;
        const prevPrice = lastCandle.c;
        currentPriceEl.textContent = `${latestPrice.toFixed(2)}`;
        currentPriceEl.setAttribute('fill', latestPrice >= prevPrice ? '#22c55e' : '#ef4444');
      }

    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="w-full h-full mx-auto">
        <div className="relative">
            <svg ref={svgRef} viewBox="0 0 1040 600" className="w-full h-full" />
        </div>
        <p className={`w-full text-right italic pr-5 text-xs text-gray-500 transition-opacity duration-300 mt-2 ${isDisclaimerVisible ? 'opacity-100' : 'opacity-0'}`}>
            * For visual representation only. Does not depict actual market conditions.
        </p>
    </div>
  );
};

export default DynamicCandlestickChart;
