import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, CalendarClock, Clock, Flame, Gauge, Info, LineChart, Newspaper, Target, TrendingUp, Zap, ChevronLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

// --- MOCK DATA ---
const signalData = {
  pair: "XAUUSD",
  timestamp: "2024-08-07 14:30 UTC",
  regime: {
    timeframe: "M15",
    marketRegime: "Ranging",
    strength: 65,
    volatility: "High",
    trend: "Bullish",
    momentum: "Strong Buy",
  },
  strategy: {
    name: "Breakout",
    direction: "BUY",
    entry: 2320.5,
    tp1: 2322.5,
    tp2: 2325.5,
    sl: 2318.5,
    confidence: 75,
    status: "Active",
  },
  news: {
    current:
      "US CPI data came in hotter than expected, leading to initial USD strength. However, the market has since priced in the Fed's likely response, causing a retrace.",
    upcoming:
      "FOMC Meeting Minutes at 2 PM EST. High impact expected. Traders should be cautious of increased volatility around this time.",
  },
} as const;

// --- HELPER COMPONENTS ---
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">{icon}<span>{label}</span></div>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const PriceTargetRow = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="font-mono text-base font-semibold text-foreground">{value.toFixed(2)}</span>
  </div>
);

// --- CARD COMPONENTS ---
const RegimeCard = ({ regime }: { regime: typeof signalData.regime }) => {
  const getBadgeVariant = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("high")) return "destructive" as const;
    if (t.includes("bullish") || t.includes("buy")) return "success" as const;
    if (t.includes("bearish") || t.includes("sell")) return "destructive" as const;
    return "secondary" as const;
  };
  return (
    <Card className="bg-card/70 backdrop-blur border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-brand" aria-hidden />Market Regime ({regime.timeframe})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow icon={<Info className="w-4 h-4" aria-hidden />} label="Regime" value={<Badge variant={getBadgeVariant(regime.marketRegime)}>{regime.marketRegime}</Badge>} />
        <InfoRow icon={<Gauge className="w-4 h-4" aria-hidden />} label="Regime Strength" value={`${regime.strength}%`} />
        <InfoRow icon={<Flame className="w-4 h-4" aria-hidden />} label="Volatility" value={<Badge variant={getBadgeVariant(regime.volatility)}>{regime.volatility}</Badge>} />
        <InfoRow icon={<TrendingUp className="w-4 h-4" aria-hidden />} label="Trend" value={<Badge variant={getBadgeVariant(regime.trend)}>{regime.trend}</Badge>} />
        <InfoRow icon={<Zap className="w-4 h-4" aria-hidden />} label="Momentum" value={<Badge variant={getBadgeVariant(regime.momentum)}>{regime.momentum}</Badge>} />
      </CardContent>
    </Card>
  );
};

const StrategyCard = ({ strategy }: { strategy: typeof signalData.strategy }) => {
  const [expanded, setExpanded] = useState(false);
  const isBuy = strategy.direction.toUpperCase() === "BUY";
  const directionColor = isBuy ? "text-success" : "text-destructive";
  const directionBg = isBuy ? "bg-success/10" : "bg-destructive/10";
  const directionIcon = isBuy ? <ArrowUp className="w-6 h-6" aria-hidden /> : <ArrowDown className="w-6 h-6" aria-hidden />;
  return (
    <Card className="bg-card/70 backdrop-blur border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-brand" aria-hidden />Strategy Signal</CardTitle>
          <Badge variant={strategy.status === "Active" ? "success" : "secondary"}>{strategy.status}</Badge>
        </div>
        <CardDescription>{strategy.name} Strategy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${directionBg}`}>
          <div className={`flex items-center gap-2 font-bold text-2xl ${directionColor}`}>{directionIcon}<span>{strategy.direction}</span></div>
          <div className="text-4xl font-mono font-bold text-foreground mt-1">@{strategy.entry.toFixed(2)}</div>
        </div>
        <div className="space-y-3">
          <PriceTargetRow label="Take Profit 1" value={strategy.tp1} colorClass="bg-success" />
          <PriceTargetRow label="Take Profit 2" value={strategy.tp2} colorClass="bg-success" />
          <PriceTargetRow label="Stop Loss" value={strategy.sl} colorClass="bg-destructive" />
        </div>
        <Separator />
        <InfoRow icon={<Gauge className="w-4 h-4" aria-hidden />} label="Confidence" value={`${strategy.confidence}%`} />

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="strategy-details"
          >
            {expanded ? "Hide details" : "Why this trade?"}
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </Button>
          {expanded && (
            <div id="strategy-details" className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>• Entry confirmation: bullish engulfing on M15 at support zone 3350–3354.</p>
              <p>• TP rationale: aligns with weekly pivot resistance and prior supply zone.</p>
              <p>• SL rationale: below recent swing low to avoid minor liquidity sweeps.</p>
              <p>• Risk: elevated volatility around upcoming ISM Services PMI.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NewsCard = ({ title, content, icon }: { title: string; content: string; icon: React.ReactNode }) => (
  <Card className="bg-card/70 backdrop-blur border">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </CardContent>
  </Card>
);

export default function Signal() {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("");
  const [activeTab, setActiveTab] = useState<"strategy" | "recent" | "upcoming">("strategy");
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
            <span>Last updated: {signalData.timestamp}</span>
          </p>
        </header>

        {/* Pair selector */}
        <div className="mb-6 flex justify-center">
          <label htmlFor="pair" className="sr-only">Pair</label>
          <select
            id="pair"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>Select pair</option>
            <option value="XAUUSD">XAUUSD</option>
          </select>
        </div>

        {activeTab === "strategy" && (
          selectedPair ? (
            <div className="space-y-6">
              <StrategyCard strategy={signalData.strategy} />
              <RegimeCard regime={signalData.regime} />
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Please select a pair to view the strategy signal.</p>
          )
        )}

        {activeTab === "recent" && (
          <div className="space-y-6">
            <NewsCard title="Recent News Emails" content={signalData.news.current} icon={<Newspaper className="w-5 h-5 text-brand" aria-hidden />} />
          </div>
        )}

        {activeTab === "upcoming" && (
          <div className="space-y-6">
            <NewsCard title="Upcoming News" content={signalData.news.upcoming} icon={<CalendarClock className="w-5 h-5 text-brand" aria-hidden />} />
          </div>
        )}


      </div>
    </main>
  );
}
