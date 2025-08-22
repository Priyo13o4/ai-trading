import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CandlestickChart from "@/components/marketing/CandlestickChart";
import { useEffect, useState, useRef } from "react";

export const Hero = () => {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");
  const [isFading, setIsFading] = useState(false); // State to control fade-out animation

  const line1 = "Stop Guessing.";
  const line2 = "Start Data-Driven Trading.";

  // Use useRef to hold variables that persist across renders without causing re-renders
  const stateRef = useRef({
    currentText: "",
    lineIndex: 0,
    charIndex: 0,
    timeoutId: 0,
  });

  useEffect(() => {
    const type = () => {
      const lines = [line1, line2];
      const state = stateRef.current;

      // Check if we are done typing both lines
      if (state.lineIndex >= lines.length) {
        // --- Start the fade-out and loop process ---
        setIsFading(true); // Trigger fade-out animation
        state.timeoutId = window.setTimeout(() => {
          // Reset everything after fade-out completes
          state.currentText = "";
          state.lineIndex = 0;
          state.charIndex = 0;
          setTypedText("");
          setIsFading(false); // Remove fade-out class
          // Restart the typing process after a short delay
          state.timeoutId = window.setTimeout(type, 500);
        }, 1000); // This delay should match the fade-out animation duration
        return;
      }

      // --- Continue typing logic ---
      const currentLine = lines[state.lineIndex];
      if (state.charIndex < currentLine.length) {
        state.currentText += currentLine.charAt(state.charIndex);
        setTypedText(state.currentText);
        state.charIndex++;
        state.timeoutId = window.setTimeout(type, 60); // Typing speed
      } else {
        state.lineIndex++;
        state.charIndex = 0;
        if (state.lineIndex < lines.length) {
          state.currentText += "<br />";
          setTypedText(state.currentText);
          state.timeoutId = window.setTimeout(type, 300); // Pause between lines
        } else {
            // Finished typing, start a pause before fading
            state.timeoutId = window.setTimeout(type, 2000);
        }
      }
    };

    // Initial start
    stateRef.current.timeoutId = window.setTimeout(type, 500);

    // Cleanup function to clear timeout if the component unmounts
    return () => {
      clearTimeout(stateRef.current.timeoutId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <section id="home" className="relative z-10 min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white h-[200px] md:h-[240px]">
              <span
                className={`typewriter-text ${isFading ? "fade-out" : ""}`}
                dangerouslySetInnerHTML={{ __html: typedText }}
              />
            </h1>

            <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
              Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              variant="hero"
              className="rounded-full w-full sm:w-auto"
              onClick={() => navigate("/signal")}
            >
              Get Started
            </Button>
            <Button 
              variant="link" 
              className="text-gray-300 hover:text-white text-lg font-medium"
              onClick={() => navigate("/signal")}
            >
              Explore Our Features
            </Button>
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
