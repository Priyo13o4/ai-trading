import { useNavigate } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, Suspense } from "react";
import Spline from "@splinetool/react-spline";
import { useIsMobile } from "@/hooks/use-mobile";
import anime from "animejs";
import { cn } from "@/lib/utils";

export const Hero = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Refs for animation targets
  const splineContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // State for Spline loading and intro sequence
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  // --- Start of Typewriter Logic ---
  const [typedText, setTypedText] = useState("");
  const [isFading, setIsFading] = useState(false); // State to control fade-out animation for looping

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
        }, 1000); // This should match your fade-out animation duration
        return;
      }

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
          // Finished typing, pause before fading out to loop
          state.timeoutId = window.setTimeout(type, 2000);
        }
      }
    };

    // Initial start of the typing effect
    stateRef.current.timeoutId = window.setTimeout(type, 500);

    // Cleanup function to clear timeout on unmount
    return () => {
      clearTimeout(stateRef.current.timeoutId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- End of Typewriter Logic ---

  const onSplineLoad = () => {
    setIsSplineLoaded(true);
  };

  // Timer to control the end of the intro animation sequence
  useEffect(() => {
    const introTimer = setTimeout(() => {
      setIsIntroFinished(true);
    }, 8000);

    return () => clearTimeout(introTimer);
  }, []);

  // Anime.js timeline for the main transition
  useEffect(() => {
    if (isIntroFinished && splineContainerRef.current && contentRef.current) {
      const timeline = anime.timeline({
        easing: 'easeOutExpo',
        duration: 1200
      });

      // Fade in the content
      timeline.add({
        targets: contentRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
      });
      
      const desktopParams = {
        left: '50%',
        width: '50%',
        height: '100%',
        translateX: '0%',
        translateY: '0%',
      };
      
      const mobileParams = {
        top: '45%',
        height: '55%',
        width: '100%',
        translateX: '0%',
        translateY: '0%',
      };

      // Animate the spline container to its final position
      timeline.add({
        targets: splineContainerRef.current,
        ...(isMobile ? mobileParams : desktopParams),
      }, '-=1200'); // Start this animation at the same time as the content fade-in
    }
  }, [isIntroFinished, isMobile]);

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Container for the Spline animation */}
      <div
        ref={splineContainerRef}
        className={cn(
          "absolute z-0 transition-opacity duration-1000",
          isSplineLoaded ? "opacity-100" : "opacity-0",
          !isIntroFinished ? "inset-0" : ""
        )}
      >
        <Suspense fallback={null}>
          <Spline
            scene="https://draft.spline.design/2ppAFIt8Nk8GEKQo/scene.splinecode"
            onLoad={onSplineLoad}
          />
        </Suspense>
      </div>

      {/* Container for the hero text and buttons */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 flex h-full items-start pt-32 md:items-center md:pt-0 opacity-0 pointer-events-none",
          "container mx-auto px-4"
        )}
      >
        <div className={cn("w-full lg:w-1/2")}>
          <div className="max-w-xl space-y-8 pointer-events-auto">
            <div className="space-y-6">
              {/* --- Modified H1 for Typewriter --- */}
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white h-[150px] md:h-[210px]">
                <span
                  className={cn(
                    "transition-opacity duration-1000",
                    isFading ? "opacity-0" : "opacity-100"
                  )}
                  dangerouslySetInnerHTML={{ __html: typedText }}
                />
              </h1>
              <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
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