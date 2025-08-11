import { useEffect, useMemo, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StrategyCard } from "@/components/signal/StrategyCard";
import { NewsCard } from "@/components/signal/NewsCard";
import { N8N_ENDPOINTS } from "@/config/n8n";
import { parseCurrentNews, parseStrategiesPayload } from "@/lib/n8nParsers";
import type { UIStrategy } from "@/types/signal";
import { Button } from "@/components/ui/button";
import { Newspaper, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
];

const fallbackNews = [
  {
    id: "news-0",
    text: "Geopolitical developments signal potential de-escalation; gold may see mixed sentiment intraday.",
  },
];

const LivePreview = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<UIStrategy[]>([]);
  const [news, setNews] = useState<{ id: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section id="live-preview-section" aria-labelledby="live-preview-heading" className="py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 id="live-preview-heading" className="text-center font-display text-3xl md:text-4xl font-semibold">
          Live Signals preview
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          A quick look at the latest strategies and AI news insights.
        </p>

        <div className="relative mt-10">
          <Carousel className="mx-auto max-w-4xl" opts={{ align: "start" }}>
            <CarouselContent>
              {slides.map((item, idx) => (
                <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                  {item.type === "strategy" ? (
                    <StrategyCard strategy={item.content as UIStrategy} />
                  ) : (
                    <NewsCard title="AI Market Insight" content={item.content.text} icon={<Newspaper className="h-5 w-5 text-brand" aria-hidden />} />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="gradient" onClick={() => navigate("/signal")}>
            Explore full signals
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LivePreview;
