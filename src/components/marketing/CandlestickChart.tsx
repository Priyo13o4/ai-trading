import React, { useEffect, useRef, useState } from 'react';

// Define the shape of our candle data
interface Candle {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const clearChildren = (element: Element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const createSvgNode = (tag: string) => document.createElementNS(SVG_NS, tag);

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
    initialPrice: 3310,
    upperBound: 3400 * 0.96,
    lowerBound: 3270,
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

    clearChildren(candlesGroup);
    clearChildren(volumeGroup);
    clearChildren(priceLevelsGroup);
    clearChildren(emaLinesGroup);

    const candleFragment = document.createDocumentFragment();
    const volumeFragment = document.createDocumentFragment();
    
    displayData.forEach((d, i) => {
      const x = 20 + i * (960 / displayData.length);
      const candleWidth = (960 / displayData.length) * 0.6;
      const isBullish = d.c >= d.o;
      const color = isBullish ? '#22c55e' : '#ef4444';

      const wick = createSvgNode('line');
      wick.setAttribute('x1', String(x));
      wick.setAttribute('y1', String(y(d.h)));
      wick.setAttribute('x2', String(x));
      wick.setAttribute('y2', String(y(d.l)));
      wick.setAttribute('stroke', color);
      wick.setAttribute('stroke-width', '1.5');
      candleFragment.appendChild(wick);

      const body = createSvgNode('rect');
      body.setAttribute('x', String(x - candleWidth / 2));
      body.setAttribute('y', String(y(Math.max(d.o, d.c))));
      body.setAttribute('width', String(candleWidth));
      body.setAttribute('height', String(Math.abs(y(d.o) - y(d.c)) || 1));
      body.setAttribute('fill', color);
      candleFragment.appendChild(body);

      const vol = createSvgNode('rect');
      vol.setAttribute('x', String(x - candleWidth / 2));
      vol.setAttribute('y', String(80 - d.v * 0.8));
      vol.setAttribute('width', String(candleWidth));
      vol.setAttribute('height', String(d.v * 0.8));
      vol.setAttribute('fill', isBullish ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)');
      volumeFragment.appendChild(vol);
    });

    const priceLevelFragment = document.createDocumentFragment();
    const numLevels = 5;
    for (let i = 0; i <= numLevels; i++) {
        const price = minPrice + (i / numLevels) * (maxPrice - minPrice);
        const yPos = y(price);

        const label = createSvgNode('text');
        label.setAttribute('x', '1005');
        label.setAttribute('y', String(yPos + 4));
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', '#9ca3af');
        label.textContent = price.toFixed(2);

        const line = createSvgNode('line');
        line.setAttribute('x1', '20');
        line.setAttribute('y1', String(yPos));
        line.setAttribute('x2', '1000');
        line.setAttribute('y2', String(yPos));
        line.setAttribute('stroke', '#374151');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '2 4');

        priceLevelFragment.appendChild(label);
        priceLevelFragment.appendChild(line);
    }

    candlesGroup.appendChild(candleFragment);
    volumeGroup.appendChild(volumeFragment);
    priceLevelsGroup.appendChild(priceLevelFragment);
    
    // Calculate EMAs on the full dataset, but only display the visible part
    const closingPrices = fullData.map(d => d.c);
    const ema9 = calculateEMA(closingPrices, 9).slice(-VISIBLE_CANDLES);
    const ema21 = calculateEMA(closingPrices, 21).slice(-VISIBLE_CANDLES);
    
    const drawEMALine = (emaData: (number | null)[], color: string): SVGPathElement | null => {
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
        if (firstPoint) {
          return null;
        }

        const path = createSvgNode('path');
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5');
        return path;
    };

    const ema9Path = drawEMALine(ema9, '#3b82f6');
    const ema21Path = drawEMALine(ema21, '#f59e0b');
    if (ema9Path) {
      emaLinesGroup.appendChild(ema9Path);
    }
    if (ema21Path) {
      emaLinesGroup.appendChild(ema21Path);
    }
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

    clearChildren(svgElement);

    const priceLevelsGroup = createSvgNode('g');
    priceLevelsGroup.setAttribute('class', 'price-levels');

    const candlesGroup = createSvgNode('g');
    candlesGroup.setAttribute('class', 'candles');

    const emaLinesGroup = createSvgNode('g');
    emaLinesGroup.setAttribute('class', 'ema-lines');

    const volumeGroup = createSvgNode('g');
    volumeGroup.setAttribute('class', 'volume-bars');
    volumeGroup.setAttribute('transform', 'translate(0, 500)');

    const symbolLabel = createSvgNode('text');
    symbolLabel.setAttribute('x', '20');
    symbolLabel.setAttribute('y', '40');
    symbolLabel.setAttribute('font-size', '24');
    symbolLabel.setAttribute('font-weight', 'bold');
    symbolLabel.setAttribute('fill', 'white');
    symbolLabel.textContent = 'XAUUSD';

    const currentPriceLabel = createSvgNode('text');
    currentPriceLabel.setAttribute('class', 'current-price');
    currentPriceLabel.setAttribute('x', '150');
    currentPriceLabel.setAttribute('y', '40');
    currentPriceLabel.setAttribute('font-size', '24');
    currentPriceLabel.setAttribute('font-weight', 'bold');
    currentPriceLabel.setAttribute('fill', '#22c55e');

    svgElement.appendChild(priceLevelsGroup);
    svgElement.appendChild(candlesGroup);
    svgElement.appendChild(emaLinesGroup);
    svgElement.appendChild(volumeGroup);
    svgElement.appendChild(symbolLabel);
    svgElement.appendChild(currentPriceLabel);

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
