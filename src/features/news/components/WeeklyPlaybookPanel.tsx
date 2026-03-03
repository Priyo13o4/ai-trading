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
    if (typeof rec.theme === 'string') return rec.theme;
    if (typeof rec.name === 'string') return rec.name;
    if (typeof rec.label === 'string') return rec.label;
    if (typeof rec.currency === 'string' && typeof rec.bias === 'string') {
      return `${rec.currency}: ${rec.bias}`;
    }
    if (typeof rec.event === 'string') return rec.event;
    return JSON.stringify(value);
  }
  return 'Unknown';
};

const renderSimpleList = (value: unknown) => {
  const items = asArray(value);
  if (items.length === 0) {
    return <p className="text-sm sa-muted">No data available.</p>;
  }

  return (
    <ul className="space-y-2 text-sm text-slate-200">
      {items.map((entry, index) => (
        <li key={`${toLabel(entry)}-${index}`} className="sa-news-tone sa-news-tone-muted p-3">
          {toLabel(entry)}
        </li>
      ))}
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
    <div className="space-y-2">
      {items.map((entry, index) => {
        const rec = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const label = typeof rec.window === 'string' ? rec.window : toLabel(entry);
        const details = typeof rec.details === 'string' ? rec.details : undefined;

        return (
          <div key={`${label}-${index}`} className="sa-news-tone sa-news-tone-warning p-3">
            <div className="text-sm font-medium text-slate-100">{label}</div>
            {details ? <div className="mt-1 text-xs text-slate-300">{details}</div> : null}
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
    <Card className="sa-news-card sa-liquid-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 sa-accent" />
          <h3 className="text-lg font-display font-semibold text-white">Weekly Playbook</h3>
        </div>
        <div className="flex items-center gap-2">
          {formatDate(item.target_week_start) && (
            <Badge className={getBadgeTone('muted')}>{formatDate(item.target_week_start)}</Badge>
          )}
          {item.date_range && <Badge className={getBadgeTone('info')}>{item.date_range}</Badge>}
        </div>
      </div>

      {item.overall_strategy && (
        <section className="mb-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Overall Strategy
          </h4>
          <div className="sa-news-tone sa-news-tone-success p-4 text-sm text-slate-200">
            {item.overall_strategy}
          </div>
        </section>
      )}

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-300">
          Dominant Themes
        </h4>
        {renderSimpleList(item.dominant_themes)}
      </section>

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
          Currency Bias
        </h4>
        {renderCurrencyBias(item.currency_bias)}
      </section>

      <section>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          High-Risk Windows
        </h4>
        {renderHighRiskWindows(item.high_risk_windows)}
      </section>
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
