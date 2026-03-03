import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBadgeTone } from '@/features/news/theme';
import type { EventAnalysisItem } from '@/features/news/types';
import { useEventAnalysis } from '@/features/news/hooks/useEventAnalysis';

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

  return (
    <Card className="sa-news-card sa-liquid-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-display font-semibold text-white">
          {item.event_name || 'Unnamed Event'}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {item.impact && (
            <Badge className={getBadgeTone('warning')}>
              {item.impact.toUpperCase()}
            </Badge>
          )}
          {item.currency && <Badge className={getBadgeTone('info')}>{item.currency}</Badge>}
        </div>
      </div>

      {formatDateTime(item.event_time) && (
        <div className="mb-4 inline-flex items-center gap-2 text-xs sa-muted">
          <CalendarClock className="h-4 w-4" />
          {formatDateTime(item.event_time)}
        </div>
      )}

      {item.market_pricing_sentiment && (
        <section className="mb-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Market Pricing Sentiment
          </h4>
          <div className="sa-news-tone sa-news-tone-success p-3 text-sm text-slate-200">
            {item.market_pricing_sentiment}
          </div>
        </section>
      )}

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-300">
          Key Numbers
        </h4>
        {renderKeyNumbers(item.key_numbers)}
      </section>

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
          Primary Affected Pairs
        </h4>
        {affectedPairs.length === 0 ? (
          <p className="text-sm sa-muted">No affected pairs provided.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {affectedPairs.map((pair, index) => (
              <Badge key={`${toText(pair)}-${index}`} className={getBadgeTone('muted')}>
                {toText(pair)}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          Trading Scenarios
        </h4>
        {renderScenarios(item.trading_scenarios)}
      </section>

      <section>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-300">
          Market Dynamics
        </h4>
        {marketDynamics.length === 0 ? (
          <p className="text-sm sa-muted">No market dynamics provided.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-200">
            {marketDynamics.map((entry, index) => (
              <li key={`${toText(entry)}-${index}`} className="sa-news-tone sa-news-tone-danger p-3">
                {toText(entry)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  );
}

export function EventAnalysisPanel() {
  const { items, loading, error, refetch } = useEventAnalysis();

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
        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-500" />
        <p className="mb-1 text-slate-300">No event analysis available</p>
        <p className="text-sm sa-muted">Event analysis will appear once generated by the backend.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <EventAnalysisCard key={`${item.analysis_id || 'event'}-${index}`} item={item} />
      ))}
    </div>
  );
}
