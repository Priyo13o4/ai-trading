import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Clock, Newspaper, ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { StrategyCard } from "@/components/signal/StrategyCard";
import { RegimeTextCard } from "@/components/signal/RegimeTextCard";
import { NewsCard } from "@/components/signal/NewsCard";
import { useTradingData } from "@/hooks/useTradingData";
import type { UIStrategy } from "@/types/signal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Signal() {
  const navigate = useNavigate();
  const { session } = useAuth(); // Auth hook for JWT
  const [selectedPair, setSelectedPair] = useState("XAUUSD"); // Default to free pair
  const [activeTab, setActiveTab] = useState<"strategy" | "recent" | "upcoming">("strategy");

  // Use the trading data hook for all API calls
  const {
    strategies,
    regimeText,
    currentNews,
    upcoming,
    loading,
    error,
    lastUpdated,
    refresh
  } = useTradingData({
    selectedPair,
    token: session?.access_token,
    pollInterval: 30000, // Poll every 30 seconds
    enabled: true
  });

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

  // You may want to allow only a fixed symbols list,
  // OR extract from fetched strategies (if API supports it)
  const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'AUDUSD'];
  // const symbols = Array.from(new Set(strategies.map((s) => s.symbol))); // Alternate: dynamic

  const selectedStrategy = strategies.find((s) => s.symbol === selectedPair);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center text-slate-400 h-60">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>Loading latest data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "strategy":
        return selectedPair && selectedStrategy ? (
          <div className="space-y-6 animate-fade-in">
            <StrategyCard strategy={selectedStrategy as UIStrategy} />
            {regimeText && <RegimeTextCard text={regimeText} />}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400 h-60 flex items-center justify-center">
            Please select a pair to view the strategy signal.
          </p>
        );
      case "recent":
        return (
          <div className="space-y-6 animate-fade-in">
            {currentNews.length ? (
              currentNews.map((n) => (
                <NewsCard key={n.id} title="Recent News Emails" content={n.text} icon={<Newspaper className="w-5 h-5 text-primary" aria-hidden />} />
              ))
            ) : (
              <p className="text-center text-sm text-slate-400 h-60 flex items-center justify-center">No recent news available.</p>
            )}
          </div>
        );
      case "upcoming":
        return (
          <div className="space-y-6 animate-fade-in">
            {upcoming ? (
              upcoming.mode === "text" ? (
                <NewsCard title="Upcoming News" content={upcoming.text} icon={<CalendarClock className="w-5 h-5 text-primary" aria-hidden />} />
              ) : (
                upcoming.items.map((it) => (
                  <NewsCard key={it.id} title="Upcoming News" content={it.html} isHtml icon={<CalendarClock className="w-5 h-5 text-primary" aria-hidden />} />
                ))
              )
            ) : (
              <p className="text-center text-sm text-slate-400 h-60 flex items-center justify-center">No upcoming events found.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-900 text-slate-200 overflow-x-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 sm:pt-32 sm:pb-20 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-20 left-4 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Go back">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">
              {activeTab === "strategy"
                ? (selectedPair ? `${selectedPair} Signal` : "Select a Pair")
                : activeTab === "recent"
                ? "Recent News"
                : "Upcoming Events"}
            </h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh}
              disabled={loading}
              className="text-slate-400 hover:text-white"
              aria-label="Refresh data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm mb-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </div>
          )}
          
          {activeTab === 'strategy' && selectedStrategy && lastUpdated && (
            <p className="text-center text-sm text-slate-400 mt-3 flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" aria-hidden />
              <span>
                Last updated: {lastUpdated.toUTCString()}
              </span>
            </p>
          )}
        </header>

        {/* Nav bar (tabs-like) */}
        <nav className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 p-1.5 border border-slate-700 backdrop-blur-sm">
            <Button variant={activeTab === "strategy" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("strategy")} className="rounded-full">Strategy Signal</Button>
            <Button variant={activeTab === "recent" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("recent")} className="rounded-full">Recent News</Button>
            <Button variant={activeTab === "upcoming" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("upcoming")} className="rounded-full">Upcoming News</Button>
          </div>
        </nav>

        {activeTab === "strategy" && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <Select onValueChange={setSelectedPair} value={selectedPair} disabled={!symbols.length}>
              <SelectTrigger className="w-[220px] bg-slate-800/80 border-slate-700 text-slate-200 focus:ring-primary focus:ring-offset-slate-900">
                <SelectValue placeholder="Select a trading pair" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                {symbols.map((sym) => (
                  <SelectItem key={sym} value={sym} className="focus:bg-slate-700 focus:text-white">{sym}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="min-h-[240px]">
          {renderContent()}
        </div>
      </div>
    </main>
  );
}
