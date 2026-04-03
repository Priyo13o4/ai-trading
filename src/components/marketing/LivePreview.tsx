import { useEffect, useRef, useState } from "react";
import {
  ArrowUp, ArrowDown, Clock, TrendingUp,
  Newspaper, ExternalLink, SignalHigh
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PreviewStrategy {
  strategy_id?: number;
  strategy_name?: string;
  pair?: string;
  direction?: "BUY" | "SELL";
  confidence?: string;
  take_profit?: number;
  stop_loss?: number;
  risk_reward_ratio?: number;
  entry_signal?: number;
  status?: string;
}

interface PreviewNews {
  id?: number;
  title?: string;
  text?: string;
  importance_score?: number;
  market_impact_prediction?: string;
  volatility_expectation?: string;
  forex_instruments?: string[];
  confidence_label?: string;
  breaking_news?: boolean;
  forexfactory_url?: string;
  timestamp?: string;
}

// ─── Strategy Preview Card ────────────────────────────────────────────────────

const StrategyPreviewCard = ({ data }: { data: PreviewStrategy | null }) => {
  const isBuy = data?.direction === "BUY";
  const color = isBuy ? "#4ADE80" : "#F87171";

  const fmt = (v?: number) => (typeof v === "number" && isFinite(v) ? v.toFixed(4) : "—");

  return (
    <div className="relative rounded-2xl border border-slate-700/40 bg-[#0D0F11]/90 p-6 overflow-hidden h-full flex flex-col gap-5">
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: color + "18" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: color + "20" }}
          >
            {isBuy ? (
              <ArrowUp className="w-5 h-5" style={{ color }} />
            ) : (
              <ArrowDown className="w-5 h-5" style={{ color }} />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">XAUUSD · Gold</p>
            <p className="text-xl font-display font-bold text-white">
              {data?.pair ?? "XAUUSD"}
            </p>
          </div>
        </div>

        <div
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: color + "20", color }}
        >
          {data?.direction ?? "—"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Entry", value: fmt(data?.entry_signal) },
          { label: "Confidence", value: data?.confidence ?? "—", highlight: true },
          { label: "Take Profit", value: fmt(data?.take_profit), green: true },
          { label: "Stop Loss", value: fmt(data?.stop_loss), red: true },
        ].map(({ label, value, highlight, green, red }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-700/30 bg-slate-800/30 px-4 py-3"
          >
            <p className="text-[11px] text-slate-500 mb-1">{label}</p>
            <p
              className={cn(
                "text-sm font-mono font-bold",
                green && "text-green-400",
                red && "text-red-400",
                highlight && "text-[#C8935A]",
                !green && !red && !highlight && "text-slate-100"
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/30">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          <span>Strategy: {data?.strategy_name?.split(" ")[0] ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Status: {data?.status ?? "—"}</span>
        </div>
      </div>

      {/* Sample notice */}
      <p className="text-center text-[10px] text-slate-600 -mt-2">
        Real signal · Sample data · Sign up to see live
      </p>
    </div>
  );
};

// ─── News Preview Card ────────────────────────────────────────────────────────

const impactColor: Record<string, string> = {
  bullish: "#4ADE80",
  bearish: "#F87171",
  mixed: "#FBBF24",
  neutral: "#94A3B8",
};

const volColor: Record<string, string> = {
  high: "#F87171",
  medium: "#FBBF24",
  low: "#4ADE80",
};

function fmtTimestamp(ts?: string): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

const NewsPreviewCard = ({ data }: { data: PreviewNews | null }) => {
  const isBreaking = data?.breaking_news;
  const impact = (data?.market_impact_prediction ?? "").toLowerCase();
  const vol = (data?.volatility_expectation ?? "").toLowerCase();
  const instruments = Array.isArray(data?.forex_instruments) ? data.forex_instruments : [];
  const score = data?.importance_score ?? 0;

  return (
    <div className="relative rounded-2xl border border-slate-700/40 bg-[#0D0F11]/90 p-5 overflow-hidden flex flex-col gap-4 h-full">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8935A]/50 to-transparent" />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#C8935A]" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Market Intel</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Importance dots */}
          <div className="flex items-center gap-0.5" title={`Importance: ${score}/5`}>
            {[1,2,3,4,5].map((n) => (
              <span
                key={n}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: n <= score ? "#C8935A" : "#374151" }}
              />
            ))}
          </div>
          {isBreaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">Breaking</span>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      {data?.timestamp && (
        <p className="text-[10px] text-slate-600 -mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {fmtTimestamp(data.timestamp)}
        </p>
      )}

      {/* Headline */}
      <h4 className="text-sm font-bold text-white leading-snug">
        {data?.title ?? "Loading latest high-impact news…"}
      </h4>

      {/* AI Takeaway box — styled like "Why This Matters" */}
      {data?.text && (
        <div className="rounded-xl border border-[#C8935A]/20 bg-[#C8935A]/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[#C8935A]/70 font-semibold mb-1.5">Why This Matters</p>
          <p className="text-xs text-slate-300 leading-relaxed">{data.text}</p>
        </div>
      )}

      {/* Market context badges */}
      {(impact || vol) && (
        <div className="flex flex-wrap gap-2">
          {impact && (
            <div
              className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border"
              style={{
                color: impactColor[impact] ?? "#94A3B8",
                background: (impactColor[impact] ?? "#94A3B8") + "18",
                borderColor: (impactColor[impact] ?? "#94A3B8") + "30",
              }}
            >
              Direction: {impact}
            </div>
          )}
          {vol && (
            <div
              className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border"
              style={{
                color: volColor[vol] ?? "#94A3B8",
                background: (volColor[vol] ?? "#94A3B8") + "18",
                borderColor: (volColor[vol] ?? "#94A3B8") + "30",
              }}
            >
              Volatility: {vol}
            </div>
          )}
          {data?.confidence_label && (
            <div className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-slate-600/30 bg-slate-700/30 text-slate-400">
              {data.confidence_label} confidence
            </div>
          )}
        </div>
      )}

      {/* Currency pairs */}
      {instruments.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1.5">Currency Pairs</p>
          <div className="flex flex-wrap gap-1.5">
            {instruments.map((i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/40"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer row */}
      <div className="mt-auto pt-3 border-t border-slate-700/30 flex items-center justify-between">
        {data?.forexfactory_url ? (
          <a
            href={data.forexfactory_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#C8935A] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Original Source
          </a>
        ) : <span />}

        <a
          href="/news"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C8935A] hover:text-[#C8935A]/80 transition-colors group"
        >
          View Full Analysis
          <ArrowUp className="w-3 h-3 rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("rounded-2xl border border-slate-700/30 bg-[#0D0F11]/70 animate-pulse", className)}>
    <div className="p-6 space-y-4">
      <div className="h-4 w-1/3 rounded bg-slate-700/50" />
      <div className="h-6 w-2/3 rounded bg-slate-700/50" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((k) => <div key={k} className="h-14 rounded-xl bg-slate-700/30" />)}
      </div>
    </div>
  </div>
);

// ─── Resolve the correct API base URL (mirrors api.ts resolveApiBaseUrl) ─────
function getApiBase(): string {
  const envName = ((import.meta.env.VITE_ENV_NAME as string | undefined) || "").trim().toLowerCase();
  const isLocalEnv = envName === "" || envName === "local" || envName === "development";

  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");
  if (envUrl) {
    return envUrl;
  }

  if (isLocalEnv) {
    return "http://localhost:8080";
  }

  throw new Error(
    "[LivePreview] VITE_API_BASE_URL is required when VITE_ENV_NAME is not local/development."
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const LivePreview = () => {
  const [strategy, setStrategy] = useState<PreviewStrategy | null>(null);
  const [news, setNews] = useState<PreviewNews | null>(null);
  const [loading, setLoading] = useState(true);

  // Runs ONCE on component mount — never refires on scroll or re-render.
  // Both endpoints are public (no auth / no session cookie needed).
  useEffect(() => {
    const base = getApiBase();

    const fetchData = async () => {
      try {
        const [strRes, newsRes] = await Promise.allSettled([
          fetch(`${base}/api/preview/XAUUSD`),
          fetch(`${base}/api/news/preview`),
        ]);

        if (strRes.status === "fulfilled" && strRes.value.ok) {
          setStrategy(await strRes.value.json());
        }
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          setNews(await newsRes.value.json());
        }
      } catch {
        // silently fail — cards remain in skeleton/empty state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // empty dep array = mounts once, never reruns


  return (
    <section className="py-24 px-4" id="live-preview">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-semibold uppercase tracking-widest">Live Data</span>
              <SignalHigh className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Real signals. Real market news. This is what PipFactor delivers to subscribers{" "}
              <em>every single day.</em>
            </p>
          </div>
        </Reveal>

        {/* Cards grid — equal halves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Strategy card */}
          <Reveal delay={0}>
            {loading ? (
              <SkeletonCard className="h-full" />
            ) : (
              <StrategyPreviewCard data={strategy} />
            )}
          </Reveal>

          {/* News card */}
          <Reveal delay={100}>
            {loading ? (
              <SkeletonCard className="h-full" />
            ) : (
              <NewsPreviewCard data={news} />
            )}
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal delay={200}>
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm mb-5">
              This is a sample from our live feed.{" "}
              <span className="text-white font-medium">Sign up to get your first real signal free.</span>
            </p>
            <a
              href="/?signup=true"
              className="lumina-button inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl"
            >
              Start Free Trial → Get My First Signal
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LivePreview;

