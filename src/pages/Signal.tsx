import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, Newspaper, TrendingUp } from "lucide-react";
import { useState } from "react";
import { EnhancedTradingChart } from "@/components/signal/klinechart";
import { StrategyList } from "@/components/signal/StrategyList";
import { NewsList } from "@/components/signal/NewsList";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSymbols } from "@/hooks/useSymbols";

export default function Signal() {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("M5");

  // Fetch dynamic symbols from backend
  const { symbols, metadata, loading: symbolsLoading } = useSymbols();

  // Mock data - replace with real API calls
  const mockStrategies = [
    {
      id: '1',
      name: 'Breakout Strategy',
      status: 'active' as const,
      direction: 'long' as const,
      entryPrice: 1996.50,
      currentPrice: 1998.20,
      pnl: 0.85,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Range Trading',
      status: 'active' as const,
      direction: 'short' as const,
      entryPrice: 2000.00,
      currentPrice: 1998.20,
      pnl: 0.90,
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0d1a]/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo/Brand - could add PipFactor logo here */}
            <div className="text-[#D4AF37] font-bold text-lg">
              PipFactor
            </div>

            {/* Center: Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline" 
                className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                onClick={() => navigate('/news')}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                More News
              </Button>
              <Button variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                More Strategies
              </Button>
            </div>

            {/* Right: Profile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#D4AF37]">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#0f1419] border-slate-700 text-white">
                <div className="py-6 space-y-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left"
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left"
                    onClick={() => navigate('/pricing')}
                  >
                    Subscription
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left"
                    onClick={() => navigate('/')}
                  >
                    Home
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart (spans 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <EnhancedTradingChart
              symbol={selectedPair}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              availableSymbols={symbols}
              symbolMetadata={metadata}
              onSymbolChange={setSelectedPair}
            />
          </div>

          {/* Right: Sidebar with Strategies and News */}
          <div className="space-y-6">
            <StrategyList strategies={mockStrategies} />
            <NewsList symbol={selectedPair} />
          </div>
        </div>
      </div>
    </main>
  );
}
