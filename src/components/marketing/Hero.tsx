import { useNavigate } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCursorGlow } from "@/hooks/useCursorGlow";

export const Hero = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useCursorGlow();

  // --- Start of Typewriter Logic ---
  const [typedText, setTypedText] = useState("");
  const [isFading, setIsFading] = useState(false);

  const line1 = "Stop Guessing.";
  const line2 = "Start Data-Driven Trading.";

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

      if (state.lineIndex >= lines.length) {
        // Start the fade-out and loop process
        setIsFading(true);
        state.timeoutId = window.setTimeout(() => {
          // Reset after fade-out completes
          state.currentText = "";
          state.lineIndex = 0;
          state.charIndex = 0;
          setTypedText("");
          setIsFading(false);
          // Restart typing
          state.timeoutId = window.setTimeout(type, 500);
        }, 1000);
        return;
      }

      const currentLine = lines[state.lineIndex];
      if (state.charIndex < currentLine.length) {
        state.currentText += currentLine.charAt(state.charIndex);
        setTypedText(state.currentText);
        state.charIndex++;
        state.timeoutId = window.setTimeout(type, 60);
      } else {
        state.lineIndex++;
        state.charIndex = 0;
        if (state.lineIndex < lines.length) {
          state.currentText += "\n";
          setTypedText(state.currentText);
          state.timeoutId = window.setTimeout(type, 300);
        } else {
          state.timeoutId = window.setTimeout(type, 2000);
        }
      }
    };

    stateRef.current.timeoutId = window.setTimeout(type, 500);

    return () => {
      clearTimeout(stateRef.current.timeoutId);
    };
  }, []);
  // --- End of Typewriter Logic ---

  // Simple fade in animation for content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transform = "translateY(0)";
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      ref={heroGlowRef as React.RefObject<HTMLElement>}
      id="home" 
      className="relative h-screen w-full overflow-hidden mesh-gradient-hero cursor-glow"
    >
      {/* Subtle animated overlay for depth */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 animate-blob"
          style={{
            background: `radial-gradient(circle at 30% 40%, rgba(43, 108, 176, 0.1) 0%, transparent 50%)`,
          }}
        />
        <div 
          className="absolute inset-0 animate-blob animation-delay-2000"
          style={{
            background: `radial-gradient(circle at 70% 60%, rgba(45, 55, 72, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>
      
      {/* Container for the hero text and buttons */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 flex h-full items-start pt-32 md:items-center md:pt-0 opacity-0 transform translate-y-5 transition-all duration-1000 ease-out",
          "container mx-auto px-4"
        )}
      >
        <div className="w-full">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              {/* Typewriter H1 */}
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white h-[150px] md:h-[210px]">
                <span
                  className={cn(
                    "transition-opacity duration-1000 whitespace-pre-line",
                    isFading ? "opacity-0" : "opacity-100"
                  )}
                >
                  {typedText}
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <RequireAuth to="/signal">
                <Button
                  size="lg"
                  variant="hero"
                  className="rounded-full w-full sm:w-auto"
                >
                  Get Started
                </Button>
              </RequireAuth>
              <Button
                variant="link"
                className="text-gray-300 hover:text-white text-lg font-medium"
                onClick={() => {
                  window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' });
                }}
              >
                Explore Our Features
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};