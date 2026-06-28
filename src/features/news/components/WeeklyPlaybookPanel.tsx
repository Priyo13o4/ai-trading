import type { ReactNode } from 'react';
import { AlertTriangle, CalendarDays, RefreshCw, TrendingUp, TrendingDown, Minus, Search, DollarSign, Lock } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { WeeklyPlaybookItem, UsdContext, CurrencyBiasEntry, PairBiasEntry, HighRiskWindow } from '@/features/news/types';
import { useWeeklyPlaybook } from '@/features/news/hooks/useWeeklyPlaybook';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ─── Tooltip primitives ───────────────────────────────────────────────────────

function Tip({ text, children, maxWidth = 220 }: { text: string; children: ReactNode; maxWidth?: number }) {
  return (
    <Tooltip delayDuration={350}>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help">{children}</span>
      </TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipContent
          sideOffset={6}
          avoidCollisions
          collisionPadding={12}
          style={{ maxWidth }}
          className="text-center text-[11px] leading-snug bg-[#1a1d20] border border-[#C8935A]/40 text-slate-300 px-2.5 py-1.5 z-[9999] shadow-lg shadow-black/40"
        >
          {text}
        </TooltipContent>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
      <button onClick={() => setExpanded(!expanded)} className={buttonClassName}>
        {expanded ? 'less' : 'more'}
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
    if (typeof rec.currency === 'string' && typeof rec.bias === 'string') return `${rec.currency}: ${rec.bias}`;
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

const toLocalTime = (utcStr?: string): string => {
  if (!utcStr) return 'Time TBD';
  let cleanStr = String(utcStr).trim();
  if (cleanStr.endsWith(' ET')) {
    cleanStr = cleanStr.replace(/\sET$/, ' GMT-0400');
  } else {
    cleanStr = cleanStr.replace(/\sUTC$/, 'Z');
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(cleanStr)) cleanStr = cleanStr.replace(' ', 'T');
  }
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return String(utcStr);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const isEventPast = (utcStr?: string): boolean => {
  let cleanStr = String(utcStr).trim();
  if (cleanStr.endsWith(' ET')) {
    cleanStr = cleanStr.replace(/\sET$/, ' GMT-0400');
  } else {
    cleanStr = cleanStr.replace(/\sUTC$/, 'Z');
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(cleanStr)) cleanStr = cleanStr.replace(' ', 'T');
  }
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return false;
  return date.getTime() < (Date.now() - 7200000);
};

const getHighRiskTimeWindow = (rec: Record<string, unknown>): string => {
  const start = toNonEmptyString(rec.window_start) || toNonEmptyString(rec.start_time) || toNonEmptyString(rec.start);
  const end = toNonEmptyString(rec.window_end) || toNonEmptyString(rec.end_time) || toNonEmptyString(rec.end);
  if (start && end) return `${toLocalTime(start)} – ${toLocalTime(end)}`;
  const single = (
    toNonEmptyString(rec.date_time) || toNonEmptyString(rec.event_time) ||
    toNonEmptyString(rec.time_window) || toNonEmptyString(rec.time) || toNonEmptyString(rec.window)
  );
  return single ? toLocalTime(single) : 'Time TBD';
};

const formatDate = (iso?: string): string | null => {
  if (!iso) return null;
  const cleanStr = String(iso).trim().replace(/\sUTC$/, 'Z');
  const value = new Date(cleanStr);
  if (Number.isNaN(value.getTime())) return null;
  return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Score chip ───────────────────────────────────────────────────────────────

const SCORE_TIP = 'Weekly USD-relative strength score. Ranges roughly –2 (max bearish vs USD) to +2 (max bullish vs USD). Cumulative across all events this week — released outcomes are locked in, upcoming events add expected impulse.';

function ScoreChip({ score, tip = SCORE_TIP }: { score: number; tip?: string }) {
  const positive = score > 0;
  const negative = score < 0;
  const chip = (
    <span className={cn(
      "inline-flex items-center font-mono text-[11px] font-bold px-1.5 py-0.5 rounded",
      positive ? "bg-emerald-500/15 text-emerald-400" :
      negative ? "bg-rose-500/15 text-rose-400" :
                 "bg-slate-500/15 text-slate-400"
    )}>
      {positive ? '+' : ''}{score.toFixed(1)}
    </span>
  );
  if (!tip) return chip;
  return <Tip text={tip}>{chip}</Tip>;
}

// ─── Confidence pill ──────────────────────────────────────────────────────────

function ConfidencePill({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <Tip text="Model confidence in this directional view. Higher % = more data corroborating this signal. Below 60% treat as a lower-conviction lean.">
      <span className="text-[10px] text-slate-500 font-mono cursor-help">{pct}%</span>
    </Tip>
  );
}

// ─── Score drivers list ───────────────────────────────────────────────────────

function ScoreDriversList({ drivers }: { drivers: { factor: string; impact: number }[] }) {
  if (!drivers?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {drivers.map((d, i) => (
        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
          <Tip text={`This factor contributed ${d.impact > 0 ? '+' : ''}${d.impact.toFixed(1)} points to the weekly score`}>
            <span className={cn(
              "shrink-0 font-mono font-bold cursor-help",
              d.impact > 0 ? "text-emerald-500" : d.impact < 0 ? "text-rose-500" : "text-slate-500"
            )}>
              {d.impact > 0 ? `+${d.impact.toFixed(1)}` : d.impact.toFixed(1)}
            </span>
          </Tip>
          <span className="leading-tight">{d.factor}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Bias badge ───────────────────────────────────────────────────────────────

function BiasBadge({ bias, confidence, tipText }: { bias: string; confidence?: number; tipText?: string }) {
  const b = bias?.toLowerCase() ?? '';
  const isBullish = b.includes('bull') || b.includes('long') || b.includes('up');
  const isBearish = b.includes('bear') || b.includes('short') || b.includes('down');

  const badge = (
    <Badge className={cn(
      "font-bold text-[10px] tracking-wide uppercase py-0.5 px-2",
      isBullish ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
      isBearish ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                  "bg-slate-500/20 text-slate-400 border-slate-500/30"
    )}>
      <span className="flex items-center gap-1">
        {bias}
        {isBullish && <TrendingUp className="w-3 h-3" />}
        {isBearish && <TrendingDown className="w-3 h-3" />}
        {!isBullish && !isBearish && <Minus className="w-3 h-3" />}
      </span>
    </Badge>
  );

  return (
    <span className="flex items-center gap-1">
      {tipText ? <Tip text={tipText}>{badge}</Tip> : badge}
      {confidence !== undefined && <ConfidencePill confidence={confidence} />}
    </span>
  );
}

// ─── USD Context banner ───────────────────────────────────────────────────────

function UsdContextBanner({ usd }: { usd: UsdContext }) {
  const [expanded, setExpanded] = useState(false);
  const isBullish = usd.bias?.toLowerCase().includes('bull');
  const isBearish = usd.bias?.toLowerCase().includes('bear');

  return (
    <div className={cn(
      "rounded-xl border p-4 relative overflow-hidden",
      isBullish ? "border-emerald-500/20 bg-emerald-500/5" :
      isBearish ? "border-rose-500/20 bg-rose-500/5" :
                  "border-slate-500/20 bg-slate-500/5"
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8935A]/10 border border-[#C8935A]/20 shrink-0">
            <DollarSign className="h-4 w-4 text-[#C8935A]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
              USD — Benchmark Currency
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-white">US Dollar</span>
              <BiasBadge
                bias={usd.bias}
                confidence={usd.confidence}
                tipText="USD's own weekly directional bias vs a neutral baseline. This is the anchor — all other currency scores are measured against this."
              />
              <ScoreChip
                score={usd.score}
                tip="USD's own weekly impulse score. Positive = USD is broadly strengthening this week and will be a headwind for any currency you'd expect to outperform it."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className={cn(
          "text-[12px] leading-relaxed",
          expanded ? "text-slate-300" : "text-slate-400 line-clamp-2"
        )}>
          {usd.justification}
        </p>
        {usd.score_drivers?.length > 0 && (
          <>
            {expanded && <ScoreDriversList drivers={usd.score_drivers} />}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-medium uppercase tracking-wider text-[#C8935A] opacity-60 hover:opacity-100 transition-opacity mt-2"
            >
              {expanded ? 'less' : 'more'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── USD reference row (pinned in currency grid) ──────────────────────────────

function UsdReferenceCard({ usd }: { usd: UsdContext }) {
  const isBullish = usd.bias?.toLowerCase().includes('bull');
  const isBearish = usd.bias?.toLowerCase().includes('bear');
  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-xl border relative overflow-hidden",
      isBullish ? "border-emerald-500/25 bg-emerald-500/5" :
      isBearish ? "border-rose-500/25 bg-rose-500/5" :
                  "border-slate-500/25 bg-slate-500/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-white">USD</span>
          <ScoreChip
            score={usd.score}
            tip="USD's own weekly impulse. This is the zero-line every other currency is ranked against."
          />
        </div>
        <BiasBadge
          bias={usd.bias}
          confidence={usd.confidence}
          tipText="USD's own directional bias. All other currencies are scored relative to this."
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-[#C8935A]/60 shrink-0" />
        <span className="text-[10px] text-[#C8935A]/70 font-medium tracking-wide">Benchmark — all scores are vs USD</span>
      </div>
    </div>
  );
}

// ─── Currency bias card ───────────────────────────────────────────────────────

function CurrencyBiasCard({ entry }: { entry: CurrencyBiasEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#0d0f11]/40 hover:bg-[#0d0f11]/60 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-white">{entry.currency}</span>
          {entry.score !== undefined && <ScoreChip score={entry.score} />}
        </div>
        <BiasBadge
          bias={entry.bias}
          confidence={entry.confidence}
          tipText={`${entry.currency}'s directional bias this week — expressed relative to the US Dollar. Bullish = ${entry.currency} expected to outperform USD.`}
        />
      </div>
      {/* Explicit "vs USD" anchor */}
      <span className="text-[10px] text-slate-600 font-mono tracking-tight">
        vs <span className="text-[#C8935A]/60">USD</span>
      </span>
      {entry.justification && (
        <div className="mt-0.5">
          <p className={cn(
            "text-[12px] leading-relaxed text-slate-300/70",
            expanded ? "" : "line-clamp-2"
          )}>
            {expanded ? entry.justification : getFirstSentence(entry.justification)}
          </p>
          {entry.score_drivers?.length > 0 && expanded && (
            <ScoreDriversList drivers={entry.score_drivers} />
          )}
          {(entry.justification.length > 80 || entry.score_drivers?.length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-medium uppercase tracking-wider text-[#C8935A] opacity-60 hover:opacity-100 transition-opacity mt-2"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pair bias card ───────────────────────────────────────────────────────────

function directionLabel(entry: PairBiasEntry): string {
  const b = entry.bias?.toLowerCase() ?? '';
  const isBullish = b.includes('bull');
  const isBearish = b.includes('bear');
  if (!entry.base_currency || !entry.quote_currency) return '';
  if (isBullish) return `${entry.base_currency} ↑  vs  ${entry.quote_currency} ↓`;
  if (isBearish) return `${entry.base_currency} ↓  vs  ${entry.quote_currency} ↑`;
  return `${entry.base_currency} ≈  ${entry.quote_currency}`;
}

function GapChip({ gap }: { gap: number }) {
  const abs = Math.abs(gap);
  const strong = abs >= 2;
  const weak = abs < 0.5;
  const chip = (
    <span className={cn(
      "inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border",
      strong ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
      weak   ? "bg-slate-500/10 border-slate-500/20 text-slate-500" :
               "bg-slate-700/30 border-slate-600/20 text-slate-400"
    )}>
      gap {gap > 0 ? '+' : ''}{gap.toFixed(1)}
    </span>
  );
  return (
    <Tip text={`Relative strength gap (base score − quote score = ${gap.toFixed(1)}). ${strong ? 'Strong divergence — clean trade signal.' : weak ? 'Narrow divergence — low-conviction signal.' : 'Moderate divergence.'} Wider = cleaner directional edge.`}>
      {chip}
    </Tip>
  );
}

function LegScores({ entry }: { entry: PairBiasEntry }) {
  if (entry.base_score === undefined || entry.quote_score === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Tip text={`${entry.base_currency} weekly score vs USD`}>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono cursor-help">
          <span className="text-slate-600">{entry.base_currency}:</span>
          <span className={cn(
            "font-bold",
            entry.base_score > 0 ? "text-emerald-500/80" : entry.base_score < 0 ? "text-rose-500/80" : "text-slate-500"
          )}>
            {entry.base_score > 0 ? '+' : ''}{entry.base_score.toFixed(1)}
          </span>
        </span>
      </Tip>
      <span className="text-slate-700 text-[10px]">·</span>
      <Tip text={`${entry.quote_currency} weekly score vs USD`}>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono cursor-help">
          <span className="text-slate-600">{entry.quote_currency}:</span>
          <span className={cn(
            "font-bold",
            entry.quote_score > 0 ? "text-emerald-500/80" : entry.quote_score < 0 ? "text-rose-500/80" : "text-slate-500"
          )}>
            {entry.quote_score > 0 ? '+' : ''}{entry.quote_score.toFixed(1)}
          </span>
        </span>
      </Tip>
    </div>
  );
}

function PairBiasCard({ entry }: { entry: PairBiasEntry }) {
  const [expanded, setExpanded] = useState(false);
  const b = entry.bias?.toLowerCase() ?? '';
  const isBullish = b.includes('bull');
  const isBearish = b.includes('bear');
  const isOverride = entry.driver_type === 'pair_specific_override';

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#0d0f11]/60 shadow-md relative overflow-hidden group hover:border-[#C8935A]/30 transition-all">
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 transition-opacity group-hover:opacity-20",
        isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-slate-500"
      )} />

      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold text-white tracking-wide">{entry.symbol}</span>
            {isOverride && (
              <Tip text="Pair-specific catalysts override what the USD-relative basket scores suggest. Trade the pair signal directly — not purely a basket expression.">
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-bold uppercase px-1 py-0 cursor-help">
                  OVERRIDE
                </Badge>
              </Tip>
            )}
          </div>
          {(entry.base_currency && entry.quote_currency) && (
            <span className="text-[10px] text-slate-500 font-mono tracking-tight">
              {directionLabel(entry)}
            </span>
          )}
          {/* Per-leg USD-relative scores */}
          <LegScores entry={entry} />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <BiasBadge
            bias={entry.bias}
            confidence={entry.confidence}
            tipText={`Overall directional bias for ${entry.symbol}. Derived from the divergence between ${entry.base_currency} and ${entry.quote_currency} USD-relative scores.`}
          />
          {entry.relative_strength_gap !== undefined && (
            <GapChip gap={entry.relative_strength_gap} />
          )}
        </div>
      </div>

      {entry.justification && (
        <div className="mt-1 relative z-10">
          <p className={cn(
            "text-[12px] leading-relaxed text-slate-300/80",
            expanded ? "" : "line-clamp-2"
          )}>
            {expanded ? entry.justification : getFirstSentence(entry.justification)}
          </p>
          {entry.justification.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-medium uppercase tracking-wider text-[#C8935A] opacity-60 hover:opacity-100 transition-opacity mt-2"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── High-risk event card ─────────────────────────────────────────────────────

const EVENT_STATE_TIPS: Record<string, string> = {
  released:         'This event has already occurred. Its actual outcome is permanently factored into every currency score this week.',
  partially_priced: 'The market has partially digested this event but full repricing is still pending.',
  unpriced:         'Market has not yet priced this event. Full surprise risk remains — the move could be sharp.',
  upcoming:         'Upcoming event. Directional impact is estimated from expected outcome probability.',
};

function EventStateBadge({ eventState, past }: { eventState?: string; past?: boolean }) {
  if (past || eventState === 'released') {
    return (
      <Tip text={EVENT_STATE_TIPS.released}>
        <span className="text-slate-500/70 text-[9px] font-black cursor-help">[RELEASED]</span>
      </Tip>
    );
  }
  if (eventState === 'partially_priced') {
    return (
      <Tip text={EVENT_STATE_TIPS.partially_priced}>
        <span className="text-yellow-500/80 text-[9px] font-black cursor-help">[PARTIAL]</span>
      </Tip>
    );
  }
  if (eventState === 'unpriced' || eventState === 'upcoming') {
    return (
      <Tip text={EVENT_STATE_TIPS.unpriced}>
        <span className="flex items-center gap-1 text-amber-400 text-[9px] font-black cursor-help">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          [LIVE]
        </span>
      </Tip>
    );
  }
  if (past) {
    return <span className="text-rose-500/70 text-[9px] font-black">[PASSED]</span>;
  }
  return null;
}

function HighRiskCard({ entry }: { entry: HighRiskWindow }) {
  const rawTime = toNonEmptyString(entry.date_time);
  const past = isEventPast(rawTime ?? undefined) || entry.event_state === 'released';
  const timeWindow = getHighRiskTimeWindow(entry as unknown as Record<string, unknown>);

  return (
    <div className={cn(
      "flex flex-col gap-2 p-4 rounded-xl border relative overflow-hidden group transition-all",
      past
        ? "bg-slate-800/10 border-slate-700/30 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
        : "bg-[#16191c] border-amber-500/20 hover:border-amber-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
    )}>
      {!past && (
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500 blur-[45px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
      )}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all relative",
          past ? "bg-slate-700/20" : "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:scale-105"
        )}>
          <AlertTriangle className={cn("h-4 w-4", past ? "text-slate-500" : "text-amber-500")} />
          {!past && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse border border-[#111315]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[16px] font-bold tracking-tight", past ? "text-slate-400" : "text-white")}>
            {entry.event_name}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 opacity-80 flex items-center gap-2 flex-wrap">
            <EventStateBadge eventState={entry.event_state} past={past} />
            {timeWindow}
            {entry.pricing_confidence !== undefined && (
              <Tip text="How confident the market is in having fully priced this event. Low % = higher residual surprise risk and larger potential move on release.">
                <span className="text-slate-600 font-mono normal-case tracking-normal text-[10px] cursor-help">
                  priced {Math.round(entry.pricing_confidence * 100)}%
                </span>
              </Tip>
            )}
          </p>
        </div>
      </div>
      {entry.trap_or_opportunity && (
        <div className="mt-2 ml-12 relative z-10">
          <ExpandableBlock
            preview=""
            full={entry.trap_or_opportunity}
            previewClassName="hidden"
            fullClassName={cn("text-[13px] leading-relaxed font-medium", past ? "text-slate-500" : "text-slate-300/90")}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main playbook card ───────────────────────────────────────────────────────

function PlaybookCard({ item }: { item: WeeklyPlaybookItem }) {
  const [searchQuery, setSearchQuery] = useState('');

  const pairBias = (item.pair_bias ?? []) as PairBiasEntry[];
  const currencyBias = (item.currency_bias ?? []) as CurrencyBiasEntry[];
  const highRiskWindows = (item.high_risk_windows ?? []) as HighRiskWindow[];

  const filteredPairs = pairBias.filter((entry) =>
    !searchQuery || (entry.symbol ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[#C8935A]/20 bg-[#111315]/90 shadow-xl flex flex-col gap-6 p-6 transition-all hover:border-[#C8935A]/40 group">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C8935A]/50 to-transparent opacity-50" />

      {/* Header */}
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

        {/* Overall Strategy */}
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

        {/* USD Context */}
        {item.usd_context && (
          <section className="space-y-3">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
              USD Context
            </h3>
            <UsdContextBanner usd={item.usd_context} />
          </section>
        )}

        {/* Dominant Themes */}
        <section className="space-y-4">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            Dominant Themes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asArray(item.dominant_themes).map((entry, index) => {
              const title = toLabel(entry);
              const description = typeof entry === 'object' && entry ? (entry as any).explanation || (entry as any).rationale : undefined;
              return (
                <div key={index} className="rounded-xl border border-white/5 bg-gradient-to-br from-[#0d0f11] to-[#16191c] p-4 transition-all hover:border-[#C8935A]/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group/theme">
                  <div className="absolute top-0 left-0 w-[2px] h-full bg-[#C8935A]/40 group-hover/theme:bg-[#C8935A] transition-colors" />
                  <h4 className="text-base md:text-lg font-bold text-white mb-2 truncate pl-2">{title}</h4>
                  {description && (
                    <div className="pl-2">
                      <ExpandableBlock
                        preview={getFirstSentence(String(description))}
                        full={String(description)}
                        previewClassName="text-[13px] font-medium leading-relaxed text-slate-300/80"
                        fullClassName="text-[13px] leading-relaxed text-slate-400/90 mt-2"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* High-Risk Event Windows */}
        <section className="space-y-4 pt-4 border-t border-[#C8935A]/10">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            High-Risk Event Windows
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highRiskWindows.map((entry, index) => (
              <HighRiskCard key={index} entry={entry} />
            ))}
            {highRiskWindows.length === 0 && asArray(item.high_risk_windows).map((entry, index) => {
              const rec = entry && typeof entry === 'object' ? (entry as any) : {};
              return <HighRiskCard key={index} entry={rec} />;
            })}
          </div>
        </section>

        {/* Macro Currency Bias */}
        <section className="space-y-4 pt-4 border-t border-[#C8935A]/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
              Macro Currency Bias
            </h3>
            <div className="flex items-center gap-2">
              <Tip text="All scores are expressed relative to the US Dollar — not against each other.">
                <Badge variant="outline" className="border-[#C8935A]/20 text-[#C8935A]/80 bg-[#C8935A]/5 text-[10px] font-medium py-0 h-5 cursor-help">
                  All vs USD
                </Badge>
              </Tip>
              <Badge variant="outline" className="border-[#C8935A]/20 text-[#C8935A] bg-[#C8935A]/5 text-[10px] font-medium py-0 h-5">
                Top-down
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* USD pinned at top as baseline reference */}
            {item.usd_context && (
              <UsdReferenceCard usd={item.usd_context} />
            )}
            {currencyBias.map((entry, index) => (
              <CurrencyBiasCard key={index} entry={entry} />
            ))}
            {currencyBias.length === 0 && asArray(item.currency_bias).map((entry, index) => {
              const rec = (entry && typeof entry === 'object' ? entry : {}) as CurrencyBiasEntry;
              return <CurrencyBiasCard key={index} entry={rec} />;
            })}
          </div>
        </section>

        {/* Actionable Pairs */}
        {pairBias.length > 0 && (
          <section className="space-y-3 pt-3 border-t border-[#C8935A]/10 mt-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white items-center flex gap-2">
                Actionable Pairs
                <TrendingUp className="w-4 h-4 text-[#C8935A]/80" />
              </h3>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[10px] font-medium py-0 h-5">
                Execution
              </Badge>
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
              {filteredPairs.map((entry, index) => (
                <PairBiasCard key={index} entry={entry} />
              ))}
            </div>
          </section>
        )}

      </div>
    </Card>
  );
}

// ─── Panel export ─────────────────────────────────────────────────────────────

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
        <PlaybookCard key={`${item.playbook_id ?? 'playbook'}-${index}`} item={item} />
      ))}
    </div>
  );
}
