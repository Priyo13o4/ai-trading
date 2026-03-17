import { AlertTriangle, CalendarDays, RefreshCw, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBadgeTone } from '@/features/news/theme';
import type { WeeklyPlaybookItem } from '@/features/news/types';
import { useWeeklyPlaybook } from '@/features/news/hooks/useWeeklyPlaybook';
import { cn } from '@/lib/utils';

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
            <h5 className="font-semibold text-white text-sm mb-1">{title}</h5>
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
            <h3 className="text-xl font-display font-semibold text-white">Weekly Market Playbook</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {formatDate(item.target_week_start) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{formatDate(item.target_week_start)}</span>
              )}
              {item.date_range && (
                <Badge variant="outline" className="border-[#C8935A]/20 text-[#C8935A] bg-[#C8935A]/5 text-[10px] py-0 px-2 h-5">
                  {item.date_range}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {item.overall_strategy && (
          <section className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400/80 px-1">
              Main Objective & Bias
            </h4>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-200 leading-relaxed font-medium">
              {item.overall_strategy}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C8935A]/70 px-1">
              Dominant Themes
            </h4>
            <div className="space-y-3">
              {asArray(item.dominant_themes).map((entry, index) => {
                const title = toLabel(entry);
                const description = typeof entry === 'object' && entry ? (entry as any).explanation || (entry as any).rationale : undefined;
                return (
                  <div key={index} className="rounded-xl border border-[#C8935A]/10 bg-[#0d0f11]/40 p-4 transition-colors hover:border-[#C8935A]/30">
                    <h5 className="font-bold text-slate-100 text-sm mb-1.5">{title}</h5>
                    {description && <p className="text-xs text-slate-400 leading-relaxed">{String(description)}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet-400/70 px-1">
              Currency Bias
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {asArray(item.currency_bias).map((entry, index) => {
                const rec = entry && typeof entry === 'object' ? (entry as any) : {};
                const currency = rec.currency || 'N/A';
                const bias = rec.bias || 'neutral';
                const isBullish = bias.toLowerCase().includes('bull') || bias.toLowerCase().includes('long');
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-violet-500/10 bg-violet-500/5">
                    <span className="text-sm font-bold text-white font-mono">{currency}</span>
                    <Badge className={cn(
                      "font-bold text-[10px] tracking-widest uppercase py-0.5",
                      isBullish ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {bias}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500/70 px-1">
            High-Risk Event Windows
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {asArray(item.high_risk_windows).map((entry, index) => {
              const rec = entry && typeof entry === 'object' ? (entry as any) : {};
              const label = rec.event_name || rec.window || toLabel(entry);
              const timeWindow = getHighRiskTimeWindow(rec);
              return (
                <div key={index} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-amber-500/10 bg-amber-500/5">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-300/80">{timeWindow}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
