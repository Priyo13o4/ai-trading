import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UIStrategy } from "@/types/signal";
import { ArrowUp, ArrowDown, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCursorGlow } from "@/hooks/useCursorGlow";

interface StrategyCardProps {
  strategy: UIStrategy;
}

const StatItem = ({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) => (
  <div className="flex justify-between items-baseline mesh-gradient-card p-4 rounded-lg border border-slate-700/30">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={cn("font-mono font-bold text-slate-100", valueClassName)}>{value}</span>
  </div>
);

export const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const cardGlowRef = useCursorGlow();
  const isBuy = strategy.direction === "BUY";
  const confidenceLabel = strategy.confidenceText ?? 'N/A';
  const confidenceColor =
    confidenceLabel.toLowerCase().includes('high')
      ? "text-green-400"
      : confidenceLabel.toLowerCase().includes('medium')
      ? "text-yellow-400"
      : "text-red-400";

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
      className="trading-card text-white shadow-2xl shadow-blue-500/10"
      onMouseMove={handleMouseMove}
    >
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-2xl font-display">
          {isBuy ? <ArrowUp className="w-7 h-7 text-green-400" /> : <ArrowDown className="w-7 h-7 text-red-400" />}
          {strategy.symbol}
        </CardTitle>
        <div className={cn("px-3 py-1 text-sm font-semibold rounded-full", isBuy ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
          {strategy.direction}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatItem label="Entry Price" value={formatPrice(strategy.entry)} />
          <StatItem label="Confidence" value={confidenceLabel} valueClassName={confidenceColor} />
          <StatItem label="Take Profit" value={formatPrice(strategy.takeProfit)} valueClassName="text-green-400" />
          <StatItem label="Stop Loss" value={formatPrice(strategy.stopLoss)} valueClassName="text-red-400" />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Timeframe: {strategy.timeframe ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                <span>Strategy: {strategy.strategyName}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
