import { useEffect, useRef } from "react";

// Candlestick Chart Component
// This creates a visual representation similar to the target design
const CandlestickChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Generate candlestick data
    const candlesticks = [];
    let currentPrice = 45000;
    
    for (let i = 0; i < 20; i++) {
      const open = currentPrice + (Math.random() - 0.5) * 2000;
      const close = open + (Math.random() - 0.5) * 3000;
      const high = Math.max(open, close) + Math.random() * 1500;
      const low = Math.min(open, close) - Math.random() * 1500;
      
      candlesticks.push({ open, high, low, close });
      currentPrice = close;
    }

    // Find min and max for scaling
    const allPrices = candlesticks.flatMap(c => [c.open, c.high, c.low, c.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;

    // Drawing parameters
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const candleWidth = chartWidth / candlesticks.length * 0.6;
    const candleSpacing = chartWidth / candlesticks.length;

    // Helper function to convert price to y coordinate
    const priceToY = (price: number) => {
      return padding + (maxPrice - price) / priceRange * chartHeight;
    };

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
    }

    // Draw trend line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, priceToY(candlesticks[0].close));
    
    candlesticks.forEach((candle, i) => {
      const x = padding + candleSpacing * i + candleSpacing / 2;
      ctx.lineTo(x, priceToY(candle.close));
    });
    ctx.stroke();

    // Draw candlesticks
    candlesticks.forEach((candle, i) => {
      const x = padding + candleSpacing * i + candleSpacing / 2;
      const isGreen = candle.close > candle.open;
      
      // Wick (high-low line)
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(candle.high));
      ctx.lineTo(x, priceToY(candle.low));
      ctx.stroke();

      // Body (open-close rectangle)
      const bodyTop = priceToY(Math.max(candle.open, candle.close));
      const bodyBottom = priceToY(Math.min(candle.open, candle.close));
      const bodyHeight = bodyBottom - bodyTop;

      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw price labels on the right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(0), rect.width - padding + 5, y + 4);
    }

  }, []);

  return (
    <div className="relative w-full h-96 md:h-[500px]">
      {/* Chart Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Chart decorative elements */}
      <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-gray-400 mb-1">BTC/USD</div>
        <div className="text-lg font-mono text-white">$47,234.56</div>
        <div className="text-xs text-green-400">+2.34%</div>
      </div>
      
      {/* Volume indicator */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-gray-400 mb-1">24h Volume</div>
        <div className="text-sm font-mono text-white">$1.2B</div>
      </div>
    </div>
  );
};

export default CandlestickChart;