import { useEffect, useRef, useState } from "react";
import anime from "animejs";

interface CandleData {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

interface ChartState {
  volatility: number;
  trend: number;
  gridJitter: number;
  signalPulse?: string;
}

interface ContentCard {
  title: string;
  description: string;
  state: ChartState;
  variant: 'success' | 'destructive' | 'accent' | 'brand';
}

const contentCards: ContentCard[] = [
  {
    title: "AI-Powered Signals",
    description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
    state: { volatility: 8, trend: 0.75, gridJitter: 0 },
    variant: 'success'
  },
  {
    title: "Multi-Factor Analysis", 
    description: "Trends, volatility, momentum, and news sentiment are combined for a holistic market view.",
    state: { volatility: 12, trend: 0.35, gridJitter: 0, signalPulse: "SELL" },
    variant: 'destructive'
  },
  {
    title: "AI Regime Analysis",
    description: "The market is chaotic. Our AI identifies the underlying regime—like high volatility—to adapt your strategy in real-time.",
    state: { volatility: 40, trend: 0.5, gridJitter: 5 },
    variant: 'accent'
  },
  {
    title: "Instant Trade Signals",
    description: "Stop analyzing, start acting. Get clear, AI-generated BUY/SELL signals delivered directly to your chart.",
    state: { volatility: 15, trend: 0.6, gridJitter: 0, signalPulse: "BUY" },
    variant: 'brand'
  }
];

const CinematicChart = () => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const xauusdSvgRef = useRef<SVGSVGElement>(null);
  const eurusdSvgRef = useRef<SVGSVGElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const contentCardsRef = useRef<HTMLDivElement[]>([]);
  
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(-1);
  const chartStateRef = useRef<ChartState>({ volatility: 10, trend: 0.55, gridJitter: 0 });
  const masterTimelineRef = useRef<anime.AnimeTimelineInstance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate candlestick data
  const generateCandleData = (count: number, lastClose: number, volatility: number, trend: number): CandleData[] => {
    const data: CandleData[] = [];
    let currentClose = lastClose;
    
    for (let i = 0; i < count; i++) {
      const open = currentClose;
      const close = open + (Math.random() - (1 - trend)) * volatility;
      const high = Math.max(open, close) + Math.random() * (volatility / 2);
      const low = Math.min(open, close) - Math.random() * (volatility / 2);
      
      data.push({ 
        o: open, 
        h: high, 
        l: low, 
        c: close, 
        v: Math.random() * 100 
      });
      currentClose = close;
    }
    return data;
  };

  // Create chart SVG structure
  const createChart = (svgElement: SVGSVGElement, pairName: string) => {
    svgElement.innerHTML = '';
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Grid pattern
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gridHPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    gridHPattern.setAttribute('id', `grid-h-${pairName}`);
    gridHPattern.setAttribute('width', '50');
    gridHPattern.setAttribute('height', '50');
    gridHPattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const gridHLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    gridHLine.setAttribute('class', 'grid-line');
    gridHLine.setAttribute('d', 'M 0 25 L 50 25');
    gridHLine.setAttribute('fill', 'none');
    gridHLine.setAttribute('stroke', 'hsl(var(--muted-foreground) / 0.1)');
    gridHLine.setAttribute('stroke-width', '1');
    
    gridHPattern.appendChild(gridHLine);
    defs.appendChild(gridHPattern);
    
    const gridVPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    gridVPattern.setAttribute('id', `grid-v-${pairName}`);
    gridVPattern.setAttribute('width', '50');
    gridVPattern.setAttribute('height', '50');
    gridVPattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const gridVLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    gridVLine.setAttribute('class', 'grid-line');
    gridVLine.setAttribute('d', 'M 25 0 L 25 50');
    gridVLine.setAttribute('fill', 'none');
    gridVLine.setAttribute('stroke', 'hsl(var(--muted-foreground) / 0.1)');
    gridVLine.setAttribute('stroke-width', '1');
    
    gridVPattern.appendChild(gridVLine);
    defs.appendChild(gridVPattern);
    chartGroup.appendChild(defs);
    
    // Grid rectangles
    const gridH = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridH.setAttribute('width', '100%');
    gridH.setAttribute('height', '100%');
    gridH.setAttribute('fill', `url(#grid-h-${pairName})`);
    chartGroup.appendChild(gridH);
    
    const gridV = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridV.setAttribute('width', '100%');
    gridV.setAttribute('height', '100%');
    gridV.setAttribute('fill', `url(#grid-v-${pairName})`);
    chartGroup.appendChild(gridV);
    
    // Chart groups
    const candlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    candlesGroup.setAttribute('class', 'candles');
    chartGroup.appendChild(candlesGroup);
    
    const volumeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    volumeGroup.setAttribute('class', 'volume-bars');
    volumeGroup.setAttribute('transform', 'translate(0, 500)');
    chartGroup.appendChild(volumeGroup);
    
    const signalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    signalGroup.setAttribute('class', 'signal-layer');
    chartGroup.appendChild(signalGroup);
    
    // Pair name label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '20');
    label.setAttribute('y', '40');
    label.setAttribute('font-size', '24');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', 'hsl(var(--foreground))');
    label.textContent = pairName;
    chartGroup.appendChild(label);
    
    svgElement.appendChild(chartGroup);
  };

  // Draw chart content
  const drawChartContent = (svgElement: SVGSVGElement, data: CandleData[]) => {
    const candlesGroup = svgElement.querySelector('.candles');
    const volumeGroup = svgElement.querySelector('.volume-bars');
    if (!candlesGroup || !volumeGroup) return;

    const allPrices = data.flatMap(d => [d.h, d.l]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const y = (price: number) => 480 - ((price - minPrice) / (maxPrice - minPrice) * 400);

    let candleHtml = '';
    let volumeHtml = '';

    data.forEach((d, i) => {
      const x = 20 + i * (960 / data.length);
      const candleWidth = (960 / data.length) * 0.6;
      const isBullish = d.c >= d.o;
      const color = isBullish ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

      // Candlestick wick
      candleHtml += `<line x1="${x}" y1="${y(d.h)}" x2="${x}" y2="${y(d.l)}" stroke="${color}" stroke-width="1.5" />`;
      
      // Candlestick body
      const bodyHeight = Math.abs(y(d.o) - y(d.c)) || 1;
      candleHtml += `<rect x="${x - candleWidth/2}" y="${y(Math.max(d.o, d.c))}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" />`;
      
      // Volume bar
      volumeHtml += `<rect x="${x - candleWidth/2}" y="${80 - d.v * 0.8}" width="${candleWidth}" height="${d.v * 0.8}" fill="${isBullish ? 'hsl(var(--success) / 0.5)' : 'hsl(var(--destructive) / 0.5)'}" />`;
    });

    candlesGroup.innerHTML = candleHtml;
    volumeGroup.innerHTML = volumeHtml;
  };

  // Animate grid jitter
  const animateGrid = (jitter: number) => {
    anime({
      targets: '.grid-line',
      translateX: () => anime.random(-jitter, jitter),
      translateY: () => anime.random(-jitter, jitter),
      duration: 800,
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true
    });
  };

  // Animate trading signal
  const animateSignal = (signalType: string, svgElement: SVGSVGElement, data: CandleData[]) => {
    const signalLayer = svgElement.querySelector('.signal-layer');
    const lastCandleData = data[data.length - 1];
    if (!signalLayer || !lastCandleData) return;

    const allPrices = data.flatMap(d => [d.h, d.l]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const y = (price: number) => 480 - ((price - minPrice) / (maxPrice - minPrice) * 400);
    const lastCandleX = 20 + (data.length - 1) * (960 / data.length);

    const isBuy = signalType === 'BUY';
    const color = isBuy ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

    const signalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Arrow
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arrowY = isBuy ? y(lastCandleData.l) + 15 : y(lastCandleData.h) - 15;
    const arrowPath = isBuy ? 'M-5,5 L0,-5 L5,5 Z' : 'M-5,-5 L0,5 L5,-5 Z';
    arrow.setAttribute('d', arrowPath);
    arrow.setAttribute('fill', color);
    arrow.setAttribute('transform', `translate(${lastCandleX} ${arrowY})`);

    // Signal text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = signalType;
    text.setAttribute('x', lastCandleX.toString());
    text.setAttribute('y', (arrowY + (isBuy ? 15 : -15)).toString());
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');

    // Signal line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const lineY = y(lastCandleData.c);
    line.setAttribute('x1', lastCandleX.toString());
    line.setAttribute('y1', lineY.toString());
    line.setAttribute('x2', lastCandleX.toString());
    line.setAttribute('y2', lineY.toString());
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-dasharray', '5 5');
    line.setAttribute('stroke-width', '1.5');

    signalGroup.appendChild(arrow);
    signalGroup.appendChild(text);
    signalGroup.appendChild(line);
    signalLayer.appendChild(signalGroup);

    // Animation timeline
    anime.timeline({
      complete: () => signalGroup.remove()
    })
    .add({
      targets: [arrow, text],
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 500,
      easing: 'easeOutBack'
    })
    .add({
      targets: line,
      x2: 1000,
      duration: 700,
      easing: 'easeInOutExpo'
    }, '-=300')
    .add({
      targets: signalGroup,
      opacity: 0,
      duration: 500,
      delay: 2000,
      easing: 'easeOutExpo'
    });
  };

  // Initialize chart and animation
  useEffect(() => {
    if (!xauusdSvgRef.current || !chartWrapperRef.current) return;

    // Create initial chart
    createChart(xauusdSvgRef.current, 'XAUUSD');
    const initialData = generateCandleData(40, 2350, chartStateRef.current.volatility, chartStateRef.current.trend);
    setChartData(initialData);
    drawChartContent(xauusdSvgRef.current, initialData);
    animateGrid(chartStateRef.current.gridJitter);

    // Setup master timeline
    masterTimelineRef.current = anime.timeline({
      autoplay: false,
      easing: 'easeInOutSine'
    });

    masterTimelineRef.current
      .add({
        targets: chartWrapperRef.current,
        translateX: ['-50%', '0%'],
        translateY: ['-50%', '-50%'],
        scale: [1.2, 0.5],
        opacity: [0.5, 1],
        filter: ['blur(8px)', 'blur(0px)'],
        duration: 1000
      })
      .add({
        targets: heroSectionRef.current,
        opacity: [1, 0],
        duration: 500
      }, 0)
      .add({ duration: 4000 }) // Pause for features
      .add({
        targets: chartWrapperRef.current,
        translateX: ['0%', '-50%'],
        scale: [0.5, 1.2],
        opacity: [1, 0.5],
        filter: ['blur(0px)', 'blur(8px)'],
        duration: 1000
      });

    // Chart update interval
    intervalRef.current = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev];
        newData.shift();
        newData.push(...generateCandleData(1, newData[newData.length - 1].c, chartStateRef.current.volatility, chartStateRef.current.trend));
        
        if (xauusdSvgRef.current) {
          drawChartContent(xauusdSvgRef.current, newData);
        }
        
        return newData;
      });
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const pageHeight = document.body.scrollHeight - window.innerHeight;
      const progress = scrollY / pageHeight;
      
      if (masterTimelineRef.current) {
        masterTimelineRef.current.seek(masterTimelineRef.current.duration * progress);
      }

      // Handle features section card transitions
      if (featuresSectionRef.current) {
        const featuresTop = featuresSectionRef.current.offsetTop;
        const featuresHeight = featuresSectionRef.current.offsetHeight;
        
        if (scrollY >= featuresTop && scrollY < featuresTop + featuresHeight) {
          const featuresProgress = (scrollY - featuresTop) / featuresHeight;
          const targetCardIndex = Math.floor(featuresProgress * contentCards.length);
          
          if (targetCardIndex !== currentCardIndex && targetCardIndex < contentCards.length) {
            // Hide current card
            if (currentCardIndex !== -1 && contentCardsRef.current[currentCardIndex]) {
              anime({
                targets: contentCardsRef.current[currentCardIndex],
                opacity: 0,
                duration: 300,
                easing: 'easeOutExpo'
              });
            }
            
            // Show new card
            if (contentCardsRef.current[targetCardIndex]) {
              anime({
                targets: contentCardsRef.current[targetCardIndex],
                opacity: 1,
                duration: 300,
                easing: 'easeInExpo'
              });
            }
            
            // Update chart state
            const newState = contentCards[targetCardIndex].state;
            anime({
              targets: chartStateRef.current,
              ...newState,
              duration: 1200,
              easing: 'easeInOutCubic'
            });
            
            // Trigger signal animation
            if (newState.signalPulse && xauusdSvgRef.current) {
              setTimeout(() => animateSignal(newState.signalPulse!, xauusdSvgRef.current!, chartData), 200);
            }
            
            setCurrentCardIndex(targetCardIndex);
          }
        } else if (currentCardIndex !== -1) {
          // Hide all cards when outside features section
          contentCardsRef.current.forEach(card => {
            if (card) {
              anime({
                targets: card,
                opacity: 0,
                duration: 300,
                easing: 'easeOutExpo'
              });
            }
          });
          setCurrentCardIndex(-1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentCardIndex, chartData]);

  const getVariantClasses = (variant: ContentCard['variant']) => {
    switch (variant) {
      case 'success': return 'text-success';
      case 'destructive': return 'text-destructive';
      case 'accent': return 'text-accent';
      case 'brand': return 'text-brand';
      default: return 'text-foreground';
    }
  };

  return (
    <>
      {/* Sticky Chart Container */}
      <div className="sticky top-0 h-screen z-0">
        <div 
          ref={chartWrapperRef}
          className="absolute top-1/2 left-1/2 w-screen h-screen transform -translate-x-1/2 -translate-y-1/2 scale-125 opacity-50 blur-sm"
          style={{ filter: 'blur(8px)' }}
        >
          <svg 
            ref={xauusdSvgRef}
            className="w-full h-full"
            viewBox="0 0 1000 600"
          />
          <svg 
            ref={eurusdSvgRef}
            className="w-full h-full absolute top-0 left-0 opacity-0"
            viewBox="0 0 1000 600"
          />
        </div>
      </div>

      {/* Scrolling Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section ref={heroSectionRef} className="h-[150vh] flex items-center justify-center text-center">
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight">
            Ready to Elevate Your Trading?
          </h1>
        </section>

        {/* Features Section */}
        <section ref={featuresSectionRef} className="h-[400vh]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 h-full">
            <div className="relative h-full px-6">
              {contentCards.map((card, index) => (
                <div
                  key={index}
                  ref={el => {
                    if (el) contentCardsRef.current[index] = el;
                  }}
                  className="absolute inset-0 flex flex-col justify-center opacity-0"
                >
                  <h2 className={`text-3xl font-display font-bold mb-4 ${getVariantClasses(card.variant)}`}>
                    {card.title}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
            {/* Spacer for chart */}
            <div />
          </div>
        </section>
      </main>
    </>
  );
};

export default CinematicChart;