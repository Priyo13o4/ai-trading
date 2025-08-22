import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Compass, ChevronDown } from "lucide-react";

const mockSignals = [
  {
    takeProfit: 3372.0,
    stopLoss: 3360.8,
    confidence: "High",
    confidenceColor: "text-green-400",
  },
  {
    takeProfit: 1950.5,
    stopLoss: 1920.0,
    confidence: "Medium",
    confidenceColor: "text-yellow-400",
  },
  {
    takeProfit: 0.885,
    stopLoss: 0.892,
    confidence: "High",
    confidenceColor: "text-green-400",
  },
];

const LivePreview = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? mockSignals.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === mockSignals.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentSignal = mockSignals[currentIndex];

  return (
    <section id="live-preview" className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-display text-4xl font-bold sm:text-5xl text-white">
            See It in Action
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Get a glimpse of our powerful signal dashboard. Real-time data, clear insights.
          </p>
        </div>

        <div className="relative max-w-lg mx-auto">
          <Card className="bg-slate-900/50 border-slate-700 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-200">
                  <svg
                    className="h-6 w-6 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v2.35l4.25 2.35-4.25 2.35V12l-4.25-2.35L12 7.3V3Z" />
                    <path d="M12 12v2.35l4.25 2.35-4.25 2.35V21l-4.25-2.35L12 16.3V12Z" />
                    <path d="M21.75 6.65 12 12l-9.75-5.35" />
                    <path d="m2.25 17.35 9.75 5.35 9.75-5.35" />
                  </svg>
                  <span>Signal AI</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-6 rounded-lg border border-slate-700">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                    <span className="text-green-400 text-sm font-medium">Take Profit</span>
                    <span className="font-mono font-bold text-slate-200">{currentSignal.takeProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                    <span className="text-red-400 text-sm font-medium">Stop Loss</span>
                    <span className="font-mono font-bold text-slate-200">{currentSignal.stopLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400 pt-2 px-1">
                    <span>Confidence</span>
                    <span className={`${currentSignal.confidenceColor} font-semibold`}>{currentSignal.confidence}</span>
                  </div>
                  <div className="flex justify-center items-center text-sm text-gray-400 pt-2 cursor-pointer hover:text-white">
                    <span>More details</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-4 text-sm font-medium text-gray-300 mb-6">
                  <button onClick={handlePrev} className="cursor-pointer p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label="Previous Signal">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span>Live Updates</span>
                  <button onClick={handleNext} className="cursor-pointer p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label="Next Signal">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-4 text-center">
                  <Button 
                    size="lg" 
                    variant="hero" 
                    className="w-full sm:w-auto font-semibold"
                    onClick={() => navigate("/signal")}
                  >
                    <Compass className="h-5 w-5" />
                    Explore Full Signals Dashboard
                  </Button>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Join thousands of traders using AI-powered market intelligence.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LivePreview;
