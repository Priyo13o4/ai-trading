import { AlertTriangle, CalendarDays, RefreshCw, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBadgeTone } from '@/features/news/theme';
import type { WeeklyPlaybookItem } from '@/features/news/types';
import { useWeeklyPlaybook } from '@/features/news/hooks/useWeeklyPlaybook';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function ExpandableBlock({ 
  preview, 
  full, 
  previewClassName = "text-[15px] font-medium leading-relaxed text-slate-200 max-w-[700px]", 
  fullClassName = "text-[14px] leading-relaxed text-slate-300/90 max-w-[700px] mt-3",
  buttonClassName = "text-[11px] font-medium uppercase tracking-wider text-[#C8935A] opacity-60 hover:opacity-100 transition-opacity mt-2"
}: { 
  preview: string; 
  full: string; 
  previewClassName?: string;
  fullClassName?: string;
  buttonClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (!full || full.trim() === '') return <p className={previewClassName}>{preview}</p>;
  
  return (
    <div>
      {!expanded && <p className={previewClassName}>{preview}</p>}
      {expanded && <div className={fullClassName}>{full}</div>}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className={buttonClassName}
      >
        {expanded ? "less" : "more"}
      </button>
    </div>
  );
}

const getFirstSentence = (text: string) => {
  if (!text) return '';
  const match = text.match(/[^.!?]+[.!?]+/);
  if (match) return match[0].trim();
  return text.length > 120 ? text.slice(0, 120) + '...' : text;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toLabel = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.theme_name === 'string') return rec.theme_name;
    if (typeof rec.theme === 'string') return rec.theme;
    if (typeof rec.name === 'string') return rec.name;
    if (typeof rec.label === 'string') return rec.label;
    if (typeof rec.currency === 'string' && typeof rec.bias === 'string') {
      return `${rec.currency}: ${rec.bias}`;
    }
    if (typeof rec.event_name === 'string') return rec.event_name;
    if (typeof rec.event === 'string') return rec.event;
    return JSON.stringify(value);
  }
  return 'Unknown';
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getHighRiskTimeWindow = (rec: Record<string, unknown>): string => {
  const start = toNonEmptyString(rec.window_start) || toNonEmptyString(rec.start_time) || toNonEmptyString(rec.start);
  const end = toNonEmptyString(rec.window_end) || toNonEmptyString(rec.end_time) || toNonEmptyString(rec.end);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return (
    toNonEmptyString(rec.time_window) ||
    toNonEmptyString(rec.date_time) ||
    toNonEmptyString(rec.event_time) ||
    toNonEmptyString(rec.time) ||
    toNonEmptyString(rec.window) ||
    'Time TBD'
  );
};

const renderSimpleList = (value: unknown) => {
  const items = asArray(value);
  if (items.length === 0) {
    return <p className="text-sm sa-muted">No data available.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((entry, index) => {
        const title = toLabel(entry);
        const description =
          typeof entry === 'object' && entry
            ? (entry as Record<string, unknown>).explanation || (entry as Record<string, unknown>).rationale
            : undefined;

        return (
          <li key={`${title}-${index}`} className="sa-news-tone sa-news-tone-muted p-4">
            <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
            {description && <p className="text-xs text-slate-300 leading-relaxed">{String(description)}</p>}
          </li>
        );
      })}
    </ul>
  );
};

const renderCurrencyBias = (value: unknown) => {
  const items = asArray(value);
  if (items.length === 0) {
    return <p className="text-sm sa-muted">No currency bias available.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((entry, index) => {
        const rec = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const currency = typeof rec.currency === 'string' ? rec.currency : 'N/A';
        const bias = typeof rec.bias === 'string' ? rec.bias : 'neutral';
        const rationale = typeof rec.rationale === 'string' ? rec.rationale : undefined;

        return (
          <Card key={`${currency}-${index}`} className="sa-news-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{currency}</span>
              <Badge className={cn(getBadgeTone('info'), 'uppercase sa-news-label')}>{bias}</Badge>
            </div>
            {rationale ? <p className="text-sm text-slate-300">{rationale}</p> : null}
          </Card>
        );
      })}
    </div>
  );
};

const renderHighRiskWindows = (value: unknown) => {
  const items = asArray(value);
  if (items.length === 0) {
    return <p className="text-sm sa-muted">No high-risk windows available.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((entry, index) => {
        const rec = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const label = typeof rec.event_name === 'string' ? rec.event_name : typeof rec.window === 'string' ? rec.window : toLabel(entry);
        const datetime = typeof rec.date_time === 'string' ? rec.date_time : undefined;
        const details = typeof rec.trap_or_opportunity === 'string'
          ? rec.trap_or_opportunity
          : typeof rec.details === 'string' ? rec.details : undefined;

        return (
          <div key={`${label}-${index}`} className="sa-news-tone sa-news-tone-warning p-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
              <div className="text-sm font-semibold text-amber-500">{label}</div>
              {datetime && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[10px] uppercase">{datetime}</Badge>}
            </div>
            {details ? <div className="text-xs text-slate-300 leading-relaxed">{details}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

const formatDate = (iso?: string): string | null => {
  if (!iso) return null;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  return value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function PlaybookCard({ item }: { item: WeeklyPlaybookItem }) {
  const [searchQuery, setSearchQuery] = useState('');

  const actionablePairs = asArray((item as any).pair_bias);
  const filteredPairs = actionablePairs.filter((entry) => {
    if (!searchQuery) return true;
    const rec = entry && typeof entry === 'object' ? (entry as any) : {};
    const symbol = (rec.symbol || rec.currency || 'N/A').toLowerCase();
    return symbol.includes(searchQuery.toLowerCase());
  });

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[#C8935A]/20 bg-[#111315]/90 shadow-xl flex flex-col gap-6 p-6 transition-all hover:border-[#C8935A]/40 group">
      {/* Top Accent Gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C8935A]/50 to-transparent opacity-50" />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C8935A]/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8935A]/10 border border-[#C8935A]/20">
            <CalendarDays className="h-5 w-5 text-[#C8935A]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-[1.2]">Weekly Market Playbook</h2>
            <div className="flex items-center gap-2 mt-1">
              {formatDate(item.target_week_start) && (
                <span className="text-[12px] font-medium text-slate-400 opacity-70">{formatDate(item.target_week_start)}</span>
              )}
              {item.date_range && (
                <Badge variant="outline" className="border-[#C8935A]/20 text-[#C8935A] bg-[#C8935A]/5 text-[11px] font-medium opacity-80 py-0 px-2 h-5">
                  {item.date_range}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {item.overall_strategy && (
          <section className="space-y-3">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
              Overall Strategy
            </h3>
            <div className="text-[14px] leading-relaxed text-slate-300/80 bg-[#C8935A]/5 border border-[#C8935A]/10 rounded-xl p-4 shadow-inner max-w-full">
              {item.overall_strategy}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                Dominant Themes
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asArray(item.dominant_themes).map((entry, index) => {
                const title = toLabel(entry);
                const description = typeof entry === 'object' && entry ? (entry as any).explanation || (entry as any).rationale : undefined;
                return (
                  <div key={index} className="rounded-xl border border-white/5 bg-[#0d0f11]/40 p-4 transition-colors hover:border-[#C8935A]/30">
                    <h4 className="text-base md:text-lg font-medium text-white mb-2 truncate">{title}</h4>
                    {description && (
                      <ExpandableBlock
                        preview={getFirstSentence(String(description))}
                        full={String(description)}
                        previewClassName="text-[13px] font-medium leading-relaxed text-slate-300/80"
                        fullClassName="text-[13px] leading-relaxed text-slate-400/90 mt-2"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-[#C8935A]/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                Macro Currency Bias
              </h3>
              <Badge variant="outline" className="border-[#C8935A]/20 text-[#C8935A] bg-[#C8935A]/5 text-[10px] font-medium py-0 h-5">Top-down</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {asArray(item.currency_bias).map((entry, index) => {
                const rec = entry && typeof entry === 'object' ? (entry as any) : {};
                const currency = rec.currency || 'N/A';
                const bias = rec.bias || 'neutral';
                const isBullish = typeof bias === 'string' && (bias.toLowerCase().includes('bull') || bias.toLowerCase().includes('long') || bias.toLowerCase().includes('up'));
                const isBearish = typeof bias === 'string' && (bias.toLowerCase().includes('bear') || bias.toLowerCase().includes('short') || bias.toLowerCase().includes('down'));
                const rationale = rec.rationale || rec.explanation || rec.reason || rec.justification || rec.bias_reason || rec.details;
                return (
                  <div key={index} className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#0d0f11]/40 hover:bg-[#0d0f11]/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-semibold text-white">{currency}</span>
                      </div>
                      <Badge className={cn(
                        "font-medium text-[10px] tracking-wide uppercase py-0 px-1 opacity-90",
                        isBullish ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : isBearish ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        <span className="flex items-center gap-0.5">
                           {bias}
                           {isBullish && <TrendingUp className="w-3 h-3" />}
                           {isBearish && <TrendingDown className="w-3 h-3" />}
                        </span>
                      </Badge>
                    </div>
                    {rationale && (
                      <div className="mt-1">
                        <ExpandableBlock
                          preview={getFirstSentence(String(rationale))}
                          full={String(rationale)}
                          previewClassName="text-[12px] leading-relaxed text-slate-300/70 line-clamp-2"
                          fullClassName="text-[12px] leading-relaxed text-slate-300/90 mt-2"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

                <section className="space-y-4">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            High-Risk Event Windows
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asArray(item.high_risk_windows).map((entry, index) => {
              const rec = entry && typeof entry === 'object' ? (entry as any) : {};
              const label = rec.event_name || rec.window || toLabel(entry);
              const timeWindow = getHighRiskTimeWindow(rec);
              const trapOrOpp = rec.trap_or_opportunity || rec.details;
              return (
                <div key={index} className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 relative overflow-hidden group shadow-[inset_0_1px_8px_rgba(245,158,11,0.05)]">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500 blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold text-white">{label}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 opacity-80">{timeWindow}</p>
                    </div>
                  </div>
                  {trapOrOpp && (
                    <div className="mt-2 ml-11 relative z-10">
                      <ExpandableBlock
                        preview=""
                        full={String(trapOrOpp)}
                        previewClassName="hidden"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
{asArray((item as any).pair_bias).length > 0 && (
          <section className="space-y-3 pt-3 border-t border-[#C8935A]/10 mt-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white items-center flex gap-2">
                Actionable Pairs <TrendingUp className="w-4 h-4 text-[#C8935A]/80"/>
              </h3>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[10px] font-medium py-0 h-5">Execution</Badge>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pairs..."
                  className="w-full bg-[#111315]/80 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8935A]/50 focus:ring-1 focus:ring-[#C8935A]/20 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPairs.map((entry, index) => {
                const rec = entry && typeof entry === 'object' ? (entry as any) : {};
                const symbol = rec.symbol || rec.currency || 'N/A';
                const bias = rec.bias || 'neutral';
                const isBullish = typeof bias === 'string' && (bias.toLowerCase().includes('bull') || bias.toLowerCase().includes('long') || bias.toLowerCase().includes('up'));
                const isBearish = typeof bias === 'string' && (bias.toLowerCase().includes('bear') || bias.toLowerCase().includes('short') || bias.toLowerCase().includes('down'));
                const rationale = rec.rationale || rec.explanation || rec.reason || rec.justification || rec.bias_reason || rec.details;
                return (
                  <div key={index} className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#0d0f11]/60 shadow-md relative overflow-hidden group hover:border-[#C8935A]/30 transition-all">
                    {/* Decorative gradient */ }
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 transition-opacity group-hover:opacity-20",
                      isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-slate-500"
                    )} />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-white tracking-wide">{symbol}</span>
                      </div>
                      <Badge className={cn(
                        "font-bold text-[10px] tracking-wide uppercase py-0.5 px-2",
                        isBullish ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : isBearish ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      )}>
                        <span className="flex items-center gap-1.5">
                          {bias}
                          {isBullish && <TrendingUp className="w-3.5 h-3.5" />}
                          {isBearish && <TrendingDown className="w-3.5 h-3.5" />}
                          {!isBullish && !isBearish && <Minus className="w-3.5 h-3.5" />}
                        </span>
                      </Badge>
                    </div>
                    {rationale && (
                      <div className="mt-1 relative z-10">
                        <ExpandableBlock
                          preview={getFirstSentence(String(rationale))}
                          full={String(rationale)}
                          previewClassName="text-[12px] leading-relaxed text-slate-300/80 line-clamp-2"
                          fullClassName="text-[12px] leading-relaxed text-slate-300/90 mt-2"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </Card>
  );
}


export function WeeklyPlaybookPanel() {
  const { items, loading, error, refetch } = useWeeklyPlaybook();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
          <p className="sa-muted">Loading weekly playbook...</p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <Card className="sa-news-card sa-liquid-card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-rose-300" />
        <p className="mb-4 text-rose-300">{error}</p>
        <Button variant="outline" className="sa-btn-neutral" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="sa-news-card sa-liquid-card p-8 text-center">
        <TrendingUp className="mx-auto mb-3 h-12 w-12 text-slate-500" />
        <p className="mb-1 text-slate-300">No weekly playbook available</p>
        <p className="text-sm sa-muted">A playbook will appear once the backend publishes one.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <PlaybookCard key={`${item.playbook_id || 'playbook'}-${index}`} item={item} />
      ))}
    </div>
  );
}
