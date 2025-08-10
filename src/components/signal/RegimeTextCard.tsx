import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export function RegimeTextCard({ text }: { text: string }) {
  return (
    <Card className="bg-card/70 backdrop-blur border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-brand" aria-hidden />Market Regime & Alignment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</div>
      </CardContent>
    </Card>
  );
}
