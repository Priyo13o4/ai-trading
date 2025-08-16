import { useEffect, useMemo, useState, useRef } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StrategyCard } from "@/components/signal/StrategyCard";
import { NewsCard } from "@/components/signal/NewsCard";
import { N8N_ENDPOINTS } from "@/config/n8n";
import { parseCurrentNews, parseStrategiesPayload } from "@/lib/n8nParsers";
import type { UIStrategy } from "@/types/signal";
import { Button } from "@/components/ui/button";
import { Newspaper, Target, TrendingUp, Activity, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import anime from "animejs";
import Reveal from "@/components/marketing/Reveal";

const fallbackStrategies: UIStrategy[] = [
  {
    strategyName: "Bullish Breakout Scalp",
    direction: "BUY",
    entry: 3402.02,
    takeProfit: 3408,
    stopLoss: 3398,
    timeframe: "M15",
    confidenceText: "Medium",
    confidencePercent: 65,
    riskReward: 1.5,
    status: "Active",
    timestamp: new Date().toISOString(),
    expiryMinutes: 60,
    symbol: "XAUUSD",
  },
  {
    strategyName: "Bearish Breakdown Scalp",
    direction: "SELL",
    entry: 3380.44,
    takeProfit: 3375,
    stopLoss: 3385,
    timeframe: "M15",
    confidenceText: "Medium",
    confidencePercent: 65,
    riskReward: 1.1,
    status: "Active",
    timestamp: new Date().toISOString(),
    expiryMinutes: 60,
    symbol: "XAUUSD",
  },
  {
    strategyName: "Range Reversal Play",
    direction: "BUY",
    entry: 3365.20,
    takeProfit: 3372,
    stopLoss: 3360,
    timeframe: "M30",
    confidenceText: "High",
    confidencePercent: 85,
    riskReward: 1.3,
    status: "Active",
    timestamp: new Date().toISOString(),
    expiryMinutes: 120,
    symbol: "XAUUSD",
  },
];

const fallbackNews = [
  {
    id: "news-0",
    text: "Geopolitical developments signal potential de-escalation; gold may see mixed sentiment intraday with key support at 3350.",
  },
  {
    id: "news-1", 
    text: "Federal Reserve officials hint at cautious approach to rate cuts, strengthening dollar outlook and pressuring precious metals.",
  },
];

const LivePreview = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<UIStrategy[]>([]);
  const [news, setNews] = useState<{ id: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const tasks: Promise<any>[] = [];
        if (N8N_ENDPOINTS.strategyUrl) tasks.push(fetch(N8N_ENDPOINTS.strategyUrl).then((r) => r.json()).catch(() => null));
        if (N8N_ENDPOINTS.currentNewsUrl) tasks.push(fetch(N8N_ENDPOINTS.currentNewsUrl).then((r) => r.json()).catch(() => null));
        const results = tasks.length ? await Promise.all(tasks) : [];

        const parsedStrategies = results[0] ? parseStrategiesPayload(results[0]) : [];
        const parsedNews = results[1] ? parseCurrentNews(results[1]) : [];

        if (!cancelled) {
          setStrategies(parsedStrategies.length ? parsedStrategies.slice(0, 5) : fallbackStrategies);
          setNews(parsedNews.length ? parsedNews.slice(0, 5) : fallbackNews);
        }
      } catch {
        if (!cancelled) {
          setStrategies(fallbackStrategies);
          setNews(fallbackNews);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => {
    const items: { type: "strategy" | "news"; content: any }[] = [];
    strategies.forEach((s) => items.push({ type: "strategy", content: s }));
    news.forEach((n) => items.push({ type: "news", content: n }));
    return items;
  }, [strategies, news]);

  // Advanced animations using anime.js
  const playAdvancedAnimations = () => {
    // Animate floating particles
    anime({
      targets: '.floating-particle',
      translateY: [
        { value: -20, duration: 2000 },
        { value: 0, duration: 2000 }
      ],
      translateX: [
        { value: -10, duration: 1500 },
        { value: 10, duration: 1500 },
        { value: 0, duration: 1500 }
      ],
      opacity: [
        { value: 0.3, duration: 1000 },
        { value: 0.8, duration: 1000 },
        { value: 0.3, duration: 1000 }
      ],
      scale: [
        { value: 0.8, duration: 1500 },
        { value: 1.2, duration: 1500 },
        { value: 1, duration: 1500 }
      ],
      rotate: [
        { value: -5, duration: 2000 },
        { value: 5, duration: 2000 },
        { value: 0, duration: 2000 }
      ],
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(200)
    });

    // Animate stats counters
    if (statsRef.current) {
      const counters = statsRef.current.querySelectorAll('.stat-number');
      counters.forEach((counter, index) => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
        anime({
          targets: { count: 0 },
          count: target,
          duration: 2000,
          delay: index * 200,
          easing: 'easeOutExpo',
          update: function(anim) {
            counter.textContent = Math.round(anim.animatables[0].target.count).toLocaleString();
          }
        });
      });
    }

    // Animate carousel cards with stagger effect
    if (cardsRef.current) {
      anime({
        targets: cardsRef.current.querySelectorAll('.carousel-card'),
        translateY: [50, 0],
        opacity: [0, 1],
        scale: [0.9, 1],
        rotate: [2, 0],
        duration: 800,
        delay: anime.stagger(150),
        easing: 'easeOutBack'
      });
    }

    // Animate glow effects
    anime({
      targets: '.glow-effect',
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.1, 1],
      duration: 3000,
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(500)
    });
  };

  return (
    <section 
      ref={sectionRef}
      id="live-preview-section" 
      aria-labelledby="live-preview-heading" 
      className="relative z-10 py-16 md:py-20 px-4 bg-slate-800/30 backdrop-blur-sm"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle absolute top-20 left-10 w-2 h-2 bg-brand/30 rounded-full blur-sm"></div>
        <div className="floating-particle absolute top-40 right-20 w-3 h-3 bg-brand-2/40 rounded-full blur-sm"></div>
        <div className="floating-particle absolute bottom-32 left-1/4 w-2 h-2 bg-accent/30 rounded-full blur-sm"></div>
        <div className="floating-particle absolute bottom-20 right-1/3 w-4 h-4 bg-brand/20 rounded-full blur-sm"></div>
        <div className="floating-particle absolute top-1/2 left-1/2 w-2 h-2 bg-brand-2/30 rounded-full blur-sm"></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-800/50"></div>

      <div className="container mx-auto relative z-10">
        <Reveal onVisible={playAdvancedAnimations}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 mb-6">
              <Activity className="w-4 h-4 text-brand animate-pulse" />
              <span className="text-sm font-medium text-brand">Live Market Intelligence</span>
            </div>
            
            <h2 id="live-preview-heading" className="text-center font-display text-3xl md:text-4xl font-semibold text-white mb-4">
              Real-Time Signals Preview
            </h2>
            <p className="mx-auto max-w-2xl text-center text-gray-300 text-lg leading-relaxed">
              Experience the power of AI-driven market analysis with live trading signals and market insights.
            </p>
          </div>
        </Reveal>

        {/* Live Stats */}
        <Reveal delay={200}>
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="glow-effect w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-brand to-brand-2 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="stat-number text-2xl font-bold text-white" data-target="127">0</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Active Signals</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="glow-effect w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-success to-brand flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="stat-number text-2xl font-bold text-white" data-target="89">0</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Win Rate %</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="glow-effect w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-brand-2 to-accent flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div className="stat-number text-2xl font-bold text-white" data-target="1247">0</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">News Analyzed</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="glow-effect w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-accent to-brand flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="stat-number text-2xl font-bold text-white" data-target="24">0</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Updates/Hour</div>
            </div>
          </div>
        </Reveal>

        {/* Enhanced Carousel */}
        <Reveal delay={400}>
          <div className="relative mt-10">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 rounded-2xl blur-3xl"></div>
            
            <div ref={cardsRef}>
              <Carousel 
                className="mx-auto max-w-6xl relative z-10" 
                opts={{ 
                  align: "start",
                  loop: true,
                  skipSnaps: false,
                  dragFree: true
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {slides.map((item, idx) => (
                    <CarouselItem key={idx} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="carousel-card h-full">
                        {item.type === "strategy" ? (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-brand-2/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
                              <StrategyCard strategy={item.content as UIStrategy} />
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-brand/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
                              <NewsCard 
                                title="AI Market Insight" 
                                content={item.content.text} 
                                icon={<Newspaper className="h-5 w-5 text-brand" aria-hidden />} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                <div className="flex items-center justify-center gap-4 mt-8">
                  <CarouselPrevious className="relative static translate-y-0 bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-white" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                    <span className="text-sm text-gray-300">Live Updates</span>
                  </div>
                  <CarouselNext className="relative static translate-y-0 bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-white" />
                </div>
              </Carousel>
            </div>
          </div>
        </Reveal>

        {/* Enhanced CTA */}
        <Reveal delay={600}>
          <div className="mt-12 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-2 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => navigate("/signal")}
                className="relative px-8 py-4 text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Explore Full Signals Dashboard
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-gray-400">
              Join thousands of traders using AI-powered market intelligence
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LivePreview;