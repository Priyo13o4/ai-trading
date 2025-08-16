import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export function RegimeTextCard({ text }: { text: string }) {
  return (
    <Card className="bg-slate-800/80 backdrop-blur border border-slate-700/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white"><LineChart className="w-5 h-5 text-brand" aria-hidden />Market Regime & Alignment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</div>
      </CardContent>
    </Card>
  );
}
