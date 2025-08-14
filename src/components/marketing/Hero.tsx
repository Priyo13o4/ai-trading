import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CandlestickChart from "@/components/marketing/CandlestickChart";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative z-10 min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white">
              Stop Guessing. <br />
              Start Data-Driven Trading.
            </h1>
            
            <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
              Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium"
              onClick={() => navigate('/signal')}
            >
              Get Started
            </Button>
            <button className="text-gray-300 hover:text-white transition-colors text-lg font-medium underline underline-offset-4">
              Explore Our Features
            </button>
          </div>
        </div>

        {/* Right Content - Candlestick Chart */}
        <div className="relative">
          <CandlestickChart />
        </div>
      </div>
    </section>
  );
};
