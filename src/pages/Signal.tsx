import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Clock, Newspaper, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { StrategyCard } from "@/components/signal/StrategyCard";
import { RegimeTextCard } from "@/components/signal/RegimeTextCard";
import { NewsCard } from "@/components/signal/NewsCard";
import { N8N_ENDPOINTS } from "@/config/n8n";
import { parseStrategiesPayload, parseRegimeText, parseCurrentNews, parseUpcoming } from "@/lib/n8nParsers";
import type { UIStrategy } from "@/types/signal";

// n8n-driven data is fetched at runtime. Configure endpoints in src/config/n8n.ts

export default function Signal() {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("");
  const [activeTab, setActiveTab] = useState<"strategy" | "recent" | "upcoming">("strategy");

  const [strategies, setStrategies] = useState<UIStrategy[]>([]);
  const [regimeText, setRegimeText] = useState<string | null>(null);
  const [currentNews, setCurrentNews] = useState<{ id: string; text: string }[]>([]);
  const [upcoming, setUpcoming] = useState<ReturnType<typeof parseUpcoming>>(null);
  const [loading, setLoading] = useState(false);

  // SEO: dynamic title per tab
  useEffect(() => {
    const title =
      activeTab === "strategy"
        ? (selectedPair ? `${selectedPair} Signal` : "Select a Pair")
        : activeTab === "recent"
        ? "Recent News Emails"
        : "Upcoming News";
    document.title = `${title} | Signals`;
  }, [activeTab, selectedPair]);

  // Fetch n8n data (configure endpoints in src/config/n8n.ts)
  useEffect(() => {
    const ac = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const tasks: Promise<void>[] = [];
        if (N8N_ENDPOINTS.strategyUrl) {
          tasks.push(
            fetch(N8N_ENDPOINTS.strategyUrl, { signal: ac.signal })
              .then((r) => r.json())
              .then((json) => setStrategies(parseStrategiesPayload(json)))
              .catch(() => setStrategies([]))
          );
        }
        if (N8N_ENDPOINTS.regimeUrl) {
          tasks.push(
            fetch(N8N_ENDPOINTS.regimeUrl, { signal: ac.signal })
              .then((r) => r.json())
              .then((json) => setRegimeText(parseRegimeText(json)))
              .catch(() => setRegimeText(null))
          );
        }
        if (N8N_ENDPOINTS.currentNewsUrl) {
          tasks.push(
            fetch(N8N_ENDPOINTS.currentNewsUrl, { signal: ac.signal })
              .then((r) => r.json())
              .then((json) => setCurrentNews(parseCurrentNews(json)))
              .catch(() => setCurrentNews([]))
          );
        }
        if (N8N_ENDPOINTS.upcomingNewsUrl) {
          tasks.push(
            fetch(N8N_ENDPOINTS.upcomingNewsUrl, { signal: ac.signal })
              .then((r) => r.json())
              .then((json) => setUpcoming(parseUpcoming(json)))
              .catch(() => setUpcoming(null))
          );
        }
        if (tasks.length) await Promise.all(tasks);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!N8N_ENDPOINTS.strategyUrl && strategies.length === 0) {
      const demo: UIStrategy[] = [
        {
          strategyName: "Breakout Momentum",
          direction: "BUY",
          entry: 2350,
          takeProfit: 2385,
          stopLoss: 2325,
          timeframe: "H1",
          confidenceText: "High",
          confidencePercent: 78,
          riskReward: 1.6,
          status: "Active",
          timestamp: new Date().toISOString(),
          symbol: "XAUUSD",
        },
        {
          strategyName: "Mean Reversion",
          direction: "SELL",
          entry: 1.094,
          takeProfit: 1.087,
          stopLoss: 1.099,
          timeframe: "M30",
          confidenceText: "Medium",
          confidencePercent: 66,
          riskReward: 1.3,
          status: "Active",
          timestamp: new Date().toISOString(),
          symbol: "EURUSD",
        },
        {
          strategyName: "Trend Follow",
          direction: "BUY",
          entry: 64000,
          takeProfit: 66500,
          stopLoss: 62100,
          timeframe: "H4",
          confidenceText: "High",
          confidencePercent: 72,
          riskReward: 1.8,
          status: "Active",
          timestamp: new Date().toISOString(),
          symbol: "BTCUSD",
        },
      ];
      setStrategies(demo);
      setRegimeText("Market regime: Risk-on with improving momentum and lower volatility in major FX pairs.");
      setCurrentNews([{ id: "n1", text: "ECB signals cautious stance; EUR dips as markets weigh growth outlook." }]);
      setUpcoming({ mode: "text", text: "FOMC minutes today 18:00 UTC; Watch USD pairs for increased volatility." } as ReturnType<typeof parseUpcoming>);
    }
  }, [strategies.length]);

  const symbols = Array.from(new Set(strategies.map((s) => s.symbol)));
  const selectedStrategy = strategies.find((s) => s.symbol === selectedPair);
  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      {/* Elegant background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_80%_70%,hsl(var(--accent)/0.08),transparent_60%)]" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 left-4" aria-label="Go back">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Nav bar (tabs-like) */}
        <nav className="mt-12 mb-2 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1">
            <Button variant={activeTab === "strategy" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("strategy")}>Strategy Signal</Button>
            <Button variant={activeTab === "recent" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("recent")}>Recent News Emails</Button>
            <Button variant={activeTab === "upcoming" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("upcoming")}>Upcoming News</Button>
          </div>
        </nav>

        <header className="py-4 mb-2 pt-2 text-center">
          <h1 className="text-3xl font-display font-semibold">
            {activeTab === "strategy"
              ? (selectedPair ? `${selectedPair} Signal` : "Select a Pair")
              : activeTab === "recent"
              ? "Recent News Emails"
              : "Upcoming News"}
          </h1>
          <p className="text-center text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
            <Clock className="w-3 h-3" aria-hidden />
            <span>
              {selectedStrategy?.timestamp ? `Last updated: ${new Date(selectedStrategy.timestamp).toUTCString()}` : ""}
            </span>
          </p>
        </header>

        {activeTab === "strategy" && (
          <div className="mb-6 flex justify-center">
            <label htmlFor="pair" className="sr-only">Pair</label>
            <select
              id="pair"
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={!symbols.length}
            >
              <option value="" disabled>Select pair</option>
              {symbols.map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "strategy" && (
          selectedPair && selectedStrategy ? (
            <div className="space-y-6">
              <StrategyCard strategy={selectedStrategy as UIStrategy} />
              {regimeText && <RegimeTextCard text={regimeText} />}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Please select a pair to view the strategy signal.</p>
          )
        )}

        {activeTab === "recent" && (
          <div className="space-y-6">
            {currentNews.length ? (
              currentNews.map((n) => (
                <NewsCard key={n.id} title="Recent News Emails" content={n.text} icon={<Newspaper className="w-5 h-5 text-brand" aria-hidden />} />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">{loading ? "Loading news..." : "No news available."}</p>
            )}
          </div>
        )}

        {activeTab === "upcoming" && (
          <div className="space-y-6">
            {upcoming ? (
              upcoming.mode === "text" ? (
                <NewsCard title="Upcoming News" content={upcoming.text} icon={<CalendarClock className="w-5 h-5 text-brand" aria-hidden />} />
              ) : (
                upcoming.items.map((it) => (
                  <NewsCard key={it.id} title="Upcoming News" content={it.html} isHtml icon={<CalendarClock className="w-5 h-5 text-brand" aria-hidden />} />
                ))
              )
            ) : (
              <p className="text-center text-sm text-muted-foreground">{loading ? "Loading upcoming events..." : "No upcoming events."}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
