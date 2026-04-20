import { useState } from "react";
import { EnhancedTradingChart } from "@/components/signal/klinechart";
import { StrategyList } from "@/components/signal/StrategyList";
import { NewsList } from "@/components/signal/NewsList";
import { useSignalStrategies } from "@/components/signal/hooks/useSignalStrategies";
import { useSymbols } from "@/hooks/useSymbols";
import { useAuth } from "@/hooks/useAuth";
import { StrategyDetailSheet } from "@/components/strategy/StrategyDetailSheet";
import { SignalsAccessGate } from "@/components/subscription/SignalsAccessGate";
import type { StrategyRecord } from "@/types/strategy";

export default function Signal() {
  const { canAccessSignals } = useAuth();
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("M5");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecord | null>(null);

  // Fetch dynamic symbols from backend
  const { symbols, metadata } = useSymbols();
  const {
    strategies,
    loading: strategiesLoading,
    isLive: strategiesLive,
    isCachedFallback: strategiesCachedFallback,
    lastUpdatedAt: strategiesUpdatedAt,
    error: strategiesError,
    refresh: refreshStrategies,
  } = useSignalStrategies(selectedPair);

  if (!canAccessSignals) {
    return <SignalsAccessGate pageName="signals" />;
  }

  return (
    <main
      className="circuit-bg relative min-h-screen w-full text-slate-200"
      style={{ paddingTop: 'calc(var(--beta-banner-offset, 0px) + 5rem)' }}
    >
      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Chart (spans 2 columns on large screens) */}
          <div className="xl:col-span-2 min-w-0 overflow-hidden">
            <EnhancedTradingChart
              symbol={selectedPair}
              timeframe={timeframe}
              activeStrategies={strategies}
              onTimeframeChange={setTimeframe}
              availableSymbols={symbols}
              symbolMetadata={metadata}
              onSymbolChange={setSelectedPair}
            />
          </div>

          {/* Right: Sidebar with Strategies and News */}
          <div className="space-y-6">
            <StrategyList
              strategies={strategies}
              loading={strategiesLoading}
              isLive={strategiesLive}
              isCachedFallback={strategiesCachedFallback}
              lastUpdatedAt={strategiesUpdatedAt}
              error={strategiesError}
              onRefresh={refreshStrategies}
              onSelect={setSelectedStrategy}
            />
            <NewsList symbol={selectedPair} />
          </div>
        </div>
      </div>

      <StrategyDetailSheet
        open={Boolean(selectedStrategy)}
        strategy={selectedStrategy}
        onOpenChange={(open) => {
          if (!open) setSelectedStrategy(null);
        }}
      />
    </main>
  );
}
