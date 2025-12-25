import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronDown, Newspaper, TrendingUp } from "lucide-react";
import { useState } from "react";
import { TradingChart } from "@/components/signal/TradingChart";
import { StrategyList } from "@/components/signal/StrategyList";
import { NewsList } from "@/components/signal/NewsList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Signal() {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("M5");

  const PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];

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

  const mockNews = [
    {
      id: '1',
      title: 'Fed Minutes Show Concerns About Inflation Persistence',
      summary: 'Federal Reserve officials expressed concerns about persistent inflation pressures...',
      content: '<p>Federal Reserve officials expressed concerns about persistent inflation pressures in the minutes from their latest meeting. The discussion centered around the need to maintain restrictive policy until clear signs of inflation returning to the 2% target emerge.</p>',
      timestamp: new Date().toISOString(),
      source: 'Reuters',
      impact: 'high' as const,
    },
    {
      id: '2',
      title: 'Gold Holds Near Record High on Safe-Haven Demand',
      summary: 'Gold prices remained elevated as investors sought safety amid global uncertainty...',
      content: '<p>Gold prices remained elevated as investors sought safety amid global economic uncertainty and geopolitical tensions. The precious metal continues to attract flows as a hedge against potential market volatility.</p>',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source: 'Bloomberg',
      impact: 'medium' as const,
    },
  ];

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0d1a]/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Pair Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                  <span className="font-semibold">{selectedPair}</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                {PAIRS.map((pair) => (
                  <DropdownMenuItem
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer"
                  >
                    {pair}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Center: Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <Newspaper className="w-4 h-4 mr-2" />
                More News
              </Button>
              <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                More Strategies
              </Button>
            </div>

            {/* Right: Profile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-orange-400">
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
          <div className="lg:col-span-2 h-[500px] lg:h-[600px]">
            <TradingChart 
              symbol={selectedPair}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>

          {/* Right: Sidebar with Strategies and News */}
          <div className="space-y-6">
            <StrategyList strategies={mockStrategies} />
            <NewsList news={mockNews} symbol={selectedPair} />
          </div>
        </div>
      </div>
    </main>
  );
}
