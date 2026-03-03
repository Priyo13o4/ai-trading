import { Activity, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategyFilterBar } from '@/components/strategy/StrategyFilterBar';
import { LiveStrategyCards } from '@/components/strategy/LiveStrategyCards';
import { HistoricalStrategiesTable } from '@/components/strategy/HistoricalStrategiesTable';
import { StrategyDetailSheet } from '@/components/strategy/StrategyDetailSheet';
import { useStrategyPageData } from '@/hooks/useStrategyPageData';

export default function Strategy() {
  const {
    loading,
    error,
    isLive,
    lastUpdatedAt,
    filters,
    setFilters,
    liveStrategies,
    historicalStrategies,
    liveCount,
    availableSymbols,
    historicalTotal,
    historicalLimit,
    historicalOffset,
    historicalPage,
    historicalTotalPages,
    canPreviousHistoricalPage,
    canNextHistoricalPage,
    goToPreviousHistoricalPage,
    goToNextHistoricalPage,
    refresh,
    selected,
    setSelected,
  } = useStrategyPageData({ include_historical: true });

  return (
    <main
      className="relative min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200"
      style={{ paddingTop: 'calc(var(--beta-banner-offset, 0px) + 5rem)' }}
    >
      <div className="container mx-auto space-y-6 px-4 py-6">
        <header className="sa-card flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-300" />
              <span className="text-xs uppercase tracking-wide text-slate-300">Strategy Monitor</span>
            </div>
            <h1 className="text-3xl font-bold sa-heading">Strategies</h1>
            <p className="mt-1 text-sm sa-muted">Live and historical strategy records from the strategies table.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="sa-pill">Live count: {liveCount}</Badge>
            <Badge className="sa-pill">{isLive ? 'Stream: Connected' : 'Stream: Snapshot'}</Badge>
            {lastUpdatedAt && <Badge className="sa-pill">Updated: {new Date(lastUpdatedAt).toLocaleTimeString()}</Badge>}
            <Button
              type="button"
              variant="outline"
              className="sa-btn-neutral"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <StrategyFilterBar
          filters={filters}
          availableSymbols={availableSymbols}
          onFiltersChange={setFilters}
          onRefresh={refresh}
          loading={loading}
        />

        {error ? (
          <Card className="sa-card border-rose-500/35">
            <CardContent className="p-4 text-sm text-rose-200">{error}</CardContent>
          </Card>
        ) : null}

        <LiveStrategyCards items={liveStrategies} isLive={isLive} onSelect={setSelected} />

        <HistoricalStrategiesTable
          items={historicalStrategies}
          total={historicalTotal}
          limit={historicalLimit}
          offset={historicalOffset}
          page={historicalPage}
          totalPages={historicalTotalPages}
          canPreviousPage={canPreviousHistoricalPage}
          canNextPage={canNextHistoricalPage}
          onPreviousPage={goToPreviousHistoricalPage}
          onNextPage={goToNextHistoricalPage}
          onSelect={setSelected}
        />
      </div>

      <StrategyDetailSheet
        open={Boolean(selected)}
        strategy={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </main>
  );
}
