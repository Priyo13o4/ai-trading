import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export const RegimeTextCard = ({ text }: { text: string }) => (
  <Card className="trading-card text-white shadow-2xl shadow-blue-500/10">
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-xl font-display">
        <BrainCircuit className="w-6 h-6 text-primary" />
        Market Regime Analysis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-slate-300 leading-relaxed">{text}</p>
    </CardContent>
  </Card>
);
