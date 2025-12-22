import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrueFocusTextProps {
  words: string[];
  className?: string;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TrueFocusText = ({
  words,
  className,
  blurAmount = 5,
  borderColor = "#D4AF37",
  glowColor = "rgba(212, 175, 55, 0.55)",
  animationDuration = 0.6,
  pauseBetweenAnimations = 2,
}: TrueFocusTextProps) => {
  const sanitizedWords = words.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });
  const intervalRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateFocusRect = useCallback(() => {
    if (!sanitizedWords.length) {
      setFocusRect({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    const currentWord = wordRefs.current[currentIndex];
    const container = containerRef.current;

    if (!currentWord || !container) {
      return;
    }

    const parentRect = container.getBoundingClientRect();
    const activeRect = currentWord.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, sanitizedWords.length]);

  useEffect(() => {
    if (!sanitizedWords.length) {
      stopLoop();
      return undefined;
    }

    stopLoop();

    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (!sanitizedWords.length) return 0;
        return (prev + 1) % sanitizedWords.length;
      });
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return stopLoop;
  }, [animationDuration, pauseBetweenAnimations, sanitizedWords.length, stopLoop]);

  useEffect(() => {
    updateFocusRect();
  }, [updateFocusRect]);

  useEffect(() => {
    const handleResize = () => updateFocusRect();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateFocusRect]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [sanitizedWords.length]);

  if (!sanitizedWords.length) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-wrap items-baseline gap-y-4 gap-x-3 text-balance",
        className
      )}
    >
      {sanitizedWords.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={word + index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="relative cursor-default"
            style={{
              filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
              transition: `filter ${animationDuration}s ease`,
            }}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="pointer-events-none absolute top-0 left-0 box-border border-0"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: focusRect.width > 0 && focusRect.height > 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={{
          borderColor,
          filter: `drop-shadow(0 0 6px ${glowColor})`,
        }}
      >
        <span
          className="absolute -top-2 -left-2 h-3 w-3 rounded-[3px] border-[3px] border-r-0 border-b-0"
          style={{ borderColor }}
        />
        <span
          className="absolute -top-2 -right-2 h-3 w-3 rounded-[3px] border-[3px] border-l-0 border-b-0"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-2 -left-2 h-3 w-3 rounded-[3px] border-[3px] border-r-0 border-t-0"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-2 -right-2 h-3 w-3 rounded-[3px] border-[3px] border-l-0 border-t-0"
          style={{ borderColor }}
        />
      </motion.div>
    </div>
  );
};
