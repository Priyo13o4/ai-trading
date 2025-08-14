import { useState, useEffect, useRef } from "react";
import { Bot, BarChart3, ShieldCheck } from "lucide-react";

export const AnimatedFeatures = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartDataRef = useRef<any[]>([]);

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" aria-hidden />,
      title: "AI-Powered Signals",
      description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
      chartState: { volatility: 8, trend: 0.75, color: "#10b981" }
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-400" aria-hidden />,
      title: "Multi-Factor Analysis", 
      description: "Trends, volatility, momentum, and news sentiment combined for a holistic market view.",
      chartState: { volatility: 12, trend: 0.35, color: "#3b82f6" }
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden />,
      title: "Clear & Actionable",
      description: "Precise entry, take-profit, and stop-loss levels. No guesswork.",
      chartState: { volatility: 15, trend: 0.6, color: "#10b981" }
    },
  ];

  // Initialize chart
  useEffect(() => {
    if (chartRef.current) {
      initializeChart();
    }
  }, []);

  // Auto-rotate after first scroll
  useEffect(() => {
    if (autoRotate) {
      const interval = setInterval(() => {
        setCurrentCard(prev => (prev + 1) % features.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [autoRotate, features.length]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || hasScrolled) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible && !hasScrolled) {
        setHasScrolled(true);
        animateCardsSequentially();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  // Update chart when card changes
  useEffect(() => {
    if (chartRef.current && chartDataRef.current.length > 0) {
      updateChart(features[currentCard].chartState);
    }
  }, [currentCard]);

  const animateCardsSequentially = () => {
    let cardIndex = 0;
    const showNextCard = () => {
      if (cardIndex < features.length) {
        setCurrentCard(cardIndex);
        cardIndex++;
        setTimeout(showNextCard, 1500);
      } else {
        setTimeout(() => setAutoRotate(true), 2000);
      }
    };
    showNextCard();
  };

  const initializeChart = () => {
    if (!chartRef.current) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 300');
    svg.innerHTML = `
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
        </linearGradient>
      </defs>
      <g class="chart-content"></g>
    `;
    
    chartRef.current.innerHTML = '';
    chartRef.current.appendChild(svg);

    // Generate initial data
    chartDataRef.current = generateChartData(30, 100, 8, 0.75);
    drawChart();

    // Start real-time updates
    setInterval(() => {
      chartDataRef.current.shift();
      chartDataRef.current.push(generateDataPoint(
        chartDataRef.current[chartDataRef.current.length - 1].value,
        8, 0.75
      ));
      drawChart();
    }, 500);
  };

  const generateChartData = (count: number, startValue: number, volatility: number, trend: number) => {
    const data = [];
    let value = startValue;
    
    for (let i = 0; i < count; i++) {
      data.push({ x: i, value, time: Date.now() + i * 1000 });
      value += (Math.random() - (1 - trend)) * volatility;
    }
    
    return data;
  };

  const generateDataPoint = (lastValue: number, volatility: number, trend: number) => {
    return {
      x: chartDataRef.current.length,
      value: lastValue + (Math.random() - (1 - trend)) * volatility,
      time: Date.now()
    };
  };

  const drawChart = () => {
    const svg = chartRef.current?.querySelector('svg');
    const chartContent = svg?.querySelector('.chart-content');
    if (!chartContent || chartDataRef.current.length === 0) return;

    const data = chartDataRef.current;
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 380 + 10;
      const y = 280 - ((d.value - minValue) / valueRange) * 260;
      return `${x},${y}`;
    }).join(' ');

    const currentColor = features[currentCard]?.chartState.color || '#10b981';

    chartContent.innerHTML = `
      <polyline points="${points}" 
                fill="none" 
                stroke="${currentColor}" 
                stroke-width="2" 
                opacity="0.8"/>
      <polygon points="10,280 ${points} 390,280" 
               fill="url(#chartGradient)" 
               opacity="0.3"/>
      ${data.map((d, i) => {
        const x = (i / (data.length - 1)) * 380 + 10;
        const y = 280 - ((d.value - minValue) / valueRange) * 260;
        return `<circle cx="${x}" cy="${y}" r="2" fill="${currentColor}" opacity="0.6"/>`;
      }).join('')}
    `;

    // Update gradient color
    const gradient = svg?.querySelector('#chartGradient stop');
    if (gradient) {
      gradient.setAttribute('style', `stop-color:${currentColor};stop-opacity:0.3`);
    }
  };

  const updateChart = (newState: { volatility: number; trend: number; color: string }) => {
    // Animate chart transition
    const svg = chartRef.current?.querySelector('svg');
    const gradient = svg?.querySelector('#chartGradient stop');
    if (gradient) {
      gradient.setAttribute('style', `stop-color:${newState.color};stop-opacity:0.3`);
    }
  };

  return (
    <section ref={sectionRef} id="features" className="relative z-10 py-16 md:py-20 px-4 min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-display font-semibold text-center mb-12 text-foreground">
          Why Choose Signal AI?
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Column - Dynamic Chart */}
          <div className="relative h-[500px] bg-card/50 backdrop-blur border border-border rounded-xl p-6">
            <div className="absolute top-4 left-6 text-sm font-medium text-muted-foreground">
              Live Market Data
            </div>
            <div ref={chartRef} className="w-full h-full mt-8"></div>
          </div>

          {/* Right Column - Animated Cards */}
          <div className="relative h-[500px]">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  hasScrolled && index <= currentCard
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                } ${
                  currentCard === index
                    ? 'z-10 scale-100'
                    : 'z-0 scale-95'
                }`}
                style={{
                  transitionDelay: hasScrolled && !autoRotate ? `${index * 500}ms` : '0ms'
                }}
              >
                <article className="h-full rounded-xl border border-border bg-card/80 backdrop-blur p-8 text-center flex flex-col justify-center transition-all duration-300 hover:bg-card/90">
                  <div className="flex justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentCard ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};