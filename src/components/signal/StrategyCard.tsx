import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UIStrategy } from "@/types/signal";
import { ArrowUp, ArrowDown, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyCardProps {
  strategy: UIStrategy;
}

const StatItem = ({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) => (
  <div className="flex justify-between items-baseline bg-slate-800/50 p-4 rounded-lg border border-slate-700">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={cn("font-mono font-bold text-slate-100", valueClassName)}>{value}</span>
  </div>
);

export const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const isLong = strategy.direction === "Long";
  const confidenceColor =
    strategy.confidence === "High"
      ? "text-green-400"
      : strategy.confidence === "Medium"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <Card className="bg-slate-900/50 border-slate-700 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-2xl font-display">
          {isLong ? <ArrowUp className="w-7 h-7 text-green-400" /> : <ArrowDown className="w-7 h-7 text-red-400" />}
          {strategy.symbol}
        </CardTitle>
        <div className={cn("px-3 py-1 text-sm font-semibold rounded-full", isLong ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
          {strategy.direction}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatItem label="Entry Price" value={strategy.entryPrice.toFixed(4)} />
          <StatItem label="Confidence" value={strategy.confidence} valueClassName={confidenceColor} />
          <StatItem label="Take Profit" value={strategy.takeProfit.toFixed(4)} valueClassName="text-green-400" />
          <StatItem label="Stop Loss" value={strategy.stopLoss.toFixed(4)} valueClassName="text-red-400" />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Timeframe: {strategy.timeframe}</span>
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
