import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UIStrategy } from "@/types/signal";
import { ArrowUp, ArrowDown, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyCardProps {
  strategy: UIStrategy;
}

const StatItem = ({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) => (
  <div className="flex justify-between items-baseline bg-white/15 p-4 rounded-xl border border-white/10 transition-all hover:border-[#C8935A]/30 group/stat">
    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8935A]/60 group-hover/stat:text-[#C8935A]/80 transition-colors">{label}</span>
    <span className={cn("font-mono font-bold text-slate-100 text-lg tracking-tight", valueClassName)}>{value}</span>
  </div>
);

export const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const isBuy = strategy.direction === "BUY";
  const confidenceLabel = strategy.confidenceText ?? 'N/A';
  const confidenceColor =
    confidenceLabel.toLowerCase().includes('high')
      ? "text-emerald-400"
      : confidenceLabel.toLowerCase().includes('medium')
      ? "text-amber-400"
      : "text-rose-400";

  const formatPrice = (value: number | undefined): string =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : '—';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <Card 
      className={cn(
        "relative lumina-card group text-white p-0 shadow-2xl transition-all duration-300 border-t-4",
        isBuy 
          ? "border-emerald-500 hover:border-emerald-400" 
          : "border-rose-500 hover:border-rose-400"
      )}
      onMouseMove={handleMouseMove}
    >
      <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-[100%] z-0" />
      
      <div className="relative z-10 w-full h-full">
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(200,147,90,0.1),transparent_70%)]" />
      
      <CardHeader className="flex-row items-center justify-between border-b border-white/10 pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-display font-semibold tracking-tight">
          {isBuy ? <ArrowUp className="w-7 h-7 text-emerald-400" /> : <ArrowDown className="w-7 h-7 text-rose-400" />}
          {strategy.symbol}
        </CardTitle>
        <Badge className={cn(
          "px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase rounded-lg border",
          isBuy 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
        )}>
          {strategy.direction}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatItem label="Entry Price" value={formatPrice(strategy.entry)} />
          <StatItem label="Confidence" value={confidenceLabel} valueClassName={confidenceColor} />
          <StatItem label="Take Profit" value={formatPrice(strategy.takeProfit)} valueClassName="text-emerald-400" />
          <StatItem label="Stop Loss" value={formatPrice(strategy.stopLoss)} valueClassName="text-rose-400" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/15 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#C8935A]/60" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Timeframe: <span className="text-slate-200 ml-1">{strategy.timeframe ?? '—'}</span>
                </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/15 border border-white/10">
                <TrendingUp className="w-3.5 h-3.5 text-[#C8935A]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8935A]">
                  {strategy.strategyName}
                </span>
            </div>
        </div>
      </CardContent>
      </div>
    </Card>
  );
};
