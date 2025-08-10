import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, ChevronDown, Gauge, Target } from "lucide-react";
import type { UIStrategy } from "@/types/signal";

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">{icon}<span>{label}</span></div>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const PriceTargetRow = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="font-mono text-base font-semibold text-foreground">{value.toFixed(2)}</span>
  </div>
);

export function StrategyCard({ strategy }: { strategy: UIStrategy }) {
  const [expanded, setExpanded] = useState(false);
  const isBuy = strategy.direction === "BUY";
  const directionColor = isBuy ? "text-success" : "text-destructive";
  const directionBg = isBuy ? "bg-success/10" : "bg-destructive/10";
  const directionIcon = isBuy ? <ArrowUp className="w-6 h-6" aria-hidden /> : <ArrowDown className="w-6 h-6" aria-hidden />;

  const confidenceDisplay = strategy.confidenceText ?? (strategy.confidencePercent ? `${strategy.confidencePercent}%` : "-");

  return (
    <Card className="bg-card/70 backdrop-blur border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-brand" aria-hidden />Strategy Signal</CardTitle>
          <Badge variant={strategy.status === "Active" ? "success" : "secondary"}>{strategy.status}</Badge>
        </div>
        <CardDescription>{strategy.strategyName}{strategy.timeframe ? ` • ${strategy.timeframe}` : ""}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${directionBg}`}>
          <div className={`flex items-center gap-2 font-bold text-2xl ${directionColor}`}>{directionIcon}<span>{strategy.direction}</span></div>
          <div className="text-4xl font-mono font-bold text-foreground mt-1">@{strategy.entry.toFixed(2)}</div>
        </div>

        <div className="space-y-3">
          {typeof strategy.takeProfit === "number" && <PriceTargetRow label="Take Profit" value={strategy.takeProfit} colorClass="bg-success" />}
          {typeof strategy.takeProfit2 === "number" && <PriceTargetRow label="Take Profit 2" value={strategy.takeProfit2} colorClass="bg-success" />}
          {typeof strategy.stopLoss === "number" && <PriceTargetRow label="Stop Loss" value={strategy.stopLoss} colorClass="bg-destructive" />}
        </div>

        <Separator />
        <InfoRow icon={<Gauge className="w-4 h-4" aria-hidden />} label="Confidence" value={confidenceDisplay} />

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="strategy-details"
          >
            {expanded ? "Hide details" : "More details"}
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </Button>
          {expanded && (
            <div id="strategy-details" className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {strategy.riskReward != null && <p>• Risk/Reward Ratio: {strategy.riskReward}</p>}
              {strategy.expiryMinutes != null && <p>• Expiry: {strategy.expiryMinutes} min</p>}
              {strategy.timestamp && <p>• Timestamp: {new Date(strategy.timestamp).toLocaleString()}</p>}
              <p>• Symbol: {strategy.symbol}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
