import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EventAnalysisItem } from '@/features/news/types';
import { useEventAnalysis } from '@/features/news/hooks/useEventAnalysis';
import { cn } from '@/lib/utils';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return 'N/A';
};

const formatDateTime = (iso?: string): string | null => {
  if (!iso) return null;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  return value.toLocaleString();
};

const renderKeyNumbers = (value: unknown) => {
  const objectValue = asObject(value);
  if (!objectValue || Object.keys(objectValue).length === 0) {
    return <p className="text-sm sa-muted">No key numbers provided.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(objectValue).map(([key, itemValue]) => (
        <div key={key} className="sa-news-tone sa-news-tone-muted p-3">
          <div className="text-xs uppercase tracking-wide sa-muted">{key}</div>
          <div className="text-sm text-slate-200">{toText(itemValue)}</div>
        </div>
      ))}
    </div>
  );
};

const renderScenarios = (value: unknown) => {
  const arrayValue = asArray(value);
  if (arrayValue.length === 0) {
    return <p className="text-sm sa-muted">No trading scenarios provided.</p>;
  }

  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-slate-200">
      {arrayValue.map((scenario, index) => (
        <li key={`${toText(scenario)}-${index}`}>{toText(scenario)}</li>
      ))}
    </ul>
  );
};

function EventAnalysisCard({ item }: { item: EventAnalysisItem }) {
  const affectedPairs = asArray(item.primary_affected_pairs);
  const marketDynamics = asArray(item.market_dynamics);
  const keyNumbers = asObject(item.key_numbers);
  const scenarios = asArray(item.trading_scenarios);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#C8935A]/20 bg-[#111315]/90 shadow-xl flex flex-col gap-6 p-6 transition-all hover:border-[#C8935A]/40 group">
      {/* Top Accent Gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C8935A]/50 to-transparent opacity-50" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#C8935A]/10 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
             {item.currency && (
               <Badge className="bg-[#C8935A]/10 text-[#C8935A] border-[#C8935A]/20 font-mono tracking-wider">
                 {item.currency}
               </Badge>
             )}
             {item.impact && (
               <Badge
                 variant="outline"
                 className={cn(
                   "font-bold tracking-widest uppercase text-[10px]",
                   item.impact.toLowerCase() === 'high' ? "border-rose-500/30 text-rose-400 bg-rose-500/10" :
                   item.impact.toLowerCase() === 'medium' ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                   "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                 )}
               >
                 {item.impact} IMPACT
               </Badge>
             )}
          </div>
          <h3 className="text-2xl font-display font-semibold text-white leading-tight">
            {item.event_name || 'Unnamed Event'}
          </h3>
          {formatDateTime(item.event_time) && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarClock className="h-3.5 w-3.5 text-[#C8935A]/70" />
              {formatDateTime(item.event_time)}
            </div>
          )}
        </div>

        {affectedPairs.length > 0 && (
          <div className="flex flex-col md:items-end gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8935A]/60">Affected Pairs</span>
            <div className="flex flex-wrap gap-1.5 md:justify-end">
              {affectedPairs.map((pair, index) => (
                <span
                  key={`${toText(pair)}-${index}`}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#0d0f11] text-[#C8935A] border border-[#C8935A]/20 font-bold"
                >
                  {toText(pair)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (Key Numbers & Sentiment) */}
        <div className="md:col-span-5 space-y-6">
           {item.market_pricing_sentiment && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h4 className="mb-2 text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Pricing Sentiment
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {item.market_pricing_sentiment}
              </p>
            </div>
           )}

           {keyNumbers && Object.keys(keyNumbers).length > 0 && (
             <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-[#C8935A]/70 font-bold">Key Projections</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(keyNumbers).map(([key, itemValue]) => (
                    <div key={key} className="rounded-xl border border-[#C8935A]/10 bg-[#0d0f11] p-3 flex flex-col justify-center transition-colors hover:border-[#C8935A]/30">
                      <span className="text-[10px] uppercase tracking-wider text-[#C8935A]/40 mb-1 leading-none font-bold">{key}</span>
                      <span className="text-lg font-bold text-slate-100 font-mono tracking-tight">{toText(itemValue)}</span>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>

        {/* Right Column (Scenarios & Dynamics) */}
        <div className="md:col-span-7 space-y-6">
          {scenarios.length > 0 && (
            <div className="rounded-xl border border-[#C8935A]/10 bg-[#16191c]/30 p-4 space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-[#C8935A]/80 font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C8935A]" />
                Trading Scenarios
              </h4>
              <ul className="space-y-3">
                {scenarios.map((scenario, index) => (
                  <li key={index} className="flex items-start gap-3 group/scenario">
                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C8935A]/50 group-hover/scenario:bg-[#C8935A] transition-colors" />
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{toText(scenario)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {marketDynamics.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Market Dynamics & Risks</h4>
              <div className="flex flex-wrap gap-2">
                {marketDynamics.map((entry, index) => (
                  <Badge key={index} variant="outline" className="bg-[#0d0f11] border-[#C8935A]/10 text-slate-400 font-medium py-1 px-3 rounded-lg text-[11px] h-auto">
                    {toText(entry)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section - Using Market Pricing Sentiment as the primary takeaway if available */}
      {item.market_pricing_sentiment && (
        <div className="mt-auto pt-5 border-t border-[#C8935A]/10">
          <p className="text-sm text-slate-400 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
            "{item.market_pricing_sentiment}"
          </p>
        </div>
      )}
    </div>
  );
}

export function EventAnalysisPanel() {
  const { items, loading, error, refetch } = useEventAnalysis();

  const asItemArray = (val: unknown): EventAnalysisItem[] => 
    Array.isArray(val) ? val : [];

  const analysisItems = asItemArray(items);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
          <p className="sa-muted">Loading event analysis...</p>
        </div>
      </div>
    );
  }

  if (error && analysisItems.length === 0) {
    return (
      <Card className="sa-news-card sa-liquid-card border-[#C8935A]/20 bg-[#111315] p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-rose-400" />
        <p className="mb-4 text-rose-300 font-medium">{error}</p>
        <Button variant="outline" className="sa-btn-neutral border-[#C8935A]/30" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4 text-[#C8935A]" />
          Try Again
        </Button>
      </Card>
    );
  }

  if (analysisItems.length === 0) {
    return (
      <Card className="sa-news-card sa-liquid-card border-[#C8935A]/10 bg-[#111315]/50 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C8935A]/5 border border-[#C8935A]/10 mb-4">
          <BarChart3 className="h-8 w-8 text-[#C8935A]/40" />
        </div>
        <p className="mb-1 text-slate-200 font-semibold tracking-tight">No event analysis available</p>
        <p className="text-xs sa-muted max-w-[240px] mx-auto leading-relaxed">Intelligence reports for major economic events will appear here once generated.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {analysisItems.map((item, index) => (
        <EventAnalysisCard key={`${item.analysis_id || 'event'}-${index}`} item={item} />
      ))}
    </div>
  );
}
