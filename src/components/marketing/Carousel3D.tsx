"use client";

import React, {
  useRef,
  useEffect,
  useState,
  TouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowRight, TrendingUp, Newspaper, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { RequireAuth } from "@/components/RequireAuth";

export interface Carousel3DItem {
  id: number;
  title: string;
  brand: string;
  description: string;
  tags: string[];
  type?: 'signal' | 'news' | 'upcoming';
  data?: any;
  imageUrl?: string;
  link?: string;
}

interface Carousel3DProps {
  items?: Carousel3DItem[];
  autoRotate?: boolean;
  rotateInterval?: number;
  cardHeight?: number;
  title?: string;
  subtitle?: string;
  tagline?: string;
  isMobileSwipe?: boolean;
}

// Mock data for the three cards
const mockSignalData = {
  symbol: "XAUUSD",
  takeProfit: 2365.50,
  stopLoss: 2340.20,
  entryZone: "2350.00 - 2355.00",
  riskReward: "1:2.5",
  confidence: "High",
  confidenceColor: "text-green-400"
};

const mockNewsData = [
  "Fed Chair Powell signals potential rate cuts in upcoming meeting",
  "Inflation data shows continued cooling trend",
  "Gold reaches new monthly highs amid market uncertainty"
];

const mockUpcomingEvents = [
  { time: "14:30 GMT", event: "US CPI Data Release", impact: "High" },
  { time: "16:00 GMT", event: "Fed Monetary Policy Decision", impact: "Very High" },
  { time: "18:30 GMT", event: "ECB Press Conference", impact: "Medium" }
];

const defaultItems: Carousel3DItem[] = [
  {
    id: 1,
    title: "Live Signal",
    brand: "XAUUSD Gold",
    description: "AI-powered trading signal with precise entry, take profit, and stop loss levels.",
    tags: ["High Confidence", "Active", "Gold"],
    type: "signal",
    data: mockSignalData
  },
  {
    id: 2,
    title: "Latest News",
    brand: "Market Updates",
    description: "Unscheduled market-moving news that could impact your trading decisions.",
    tags: ["Breaking", "Market Impact", "Unscheduled"],
    type: "news",
    data: mockNewsData
  },
  {
    id: 3,
    title: "Upcoming Events",
    brand: "Economic Calendar",
    description: "Important economic events and announcements scheduled for today and tomorrow.",
    tags: ["Scheduled", "High Impact", "Economic"],
    type: "upcoming",
    data: mockUpcomingEvents
  }
];

const Carousel3D = ({
  items = defaultItems,
  autoRotate = true,
  rotateInterval = 5000,
  cardHeight, // Remove default, will be calculated dynamically
  title = "See It in Action",
  subtitle = "",
  tagline = "Get a glimpse of our powerful signal dashboard. Real-time data, clear insights.",
  isMobileSwipe = true,
}: Carousel3DProps) => {
  const [active, setActive] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dynamicCardHeight, setDynamicCardHeight] = useState<number>(600); // Default fallback
  const [isHeightCalculated, setIsHeightCalculated] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();
  const minSwipeDistance = 50;

  // Calculate dynamic card height based on content
  useEffect(() => {
    if (cardHeight) {
      // If cardHeight is explicitly provided, use it
      setDynamicCardHeight(cardHeight);
      setIsHeightCalculated(true);
      return;
    }

    // Calculate height dynamically based on content
    const calculateCardHeights = () => {
      // Wait for all card refs to be available
      if (cardRefs.current.filter(ref => ref !== null).length !== items.length) {
        return;
      }

      const heights = cardRefs.current
        .filter(ref => ref !== null)
        .map(ref => {
          if (!ref) return 0;
          
          // Create a temporary clone to measure natural height
          const clone = ref.cloneNode(true) as HTMLElement;
          clone.style.position = 'absolute';
          clone.style.visibility = 'hidden';
          clone.style.height = 'auto';
          clone.style.width = ref.offsetWidth + 'px';
          clone.style.zIndex = '-9999';
          
          document.body.appendChild(clone);
          const height = clone.scrollHeight;
          document.body.removeChild(clone);
          
          return height;
        });
      
      if (heights.length > 0) {
        const maxHeight = Math.max(...heights);
        const finalHeight = Math.max(maxHeight, isMobile ? 450 : 500); // Different minimum for mobile
        setDynamicCardHeight(finalHeight);
        setIsHeightCalculated(true);
      }
    };

    // Only calculate once when component mounts or items/mobile state changes
    const timer = setTimeout(calculateCardHeights, 200);
    
    return () => {
      clearTimeout(timer);
    };
  }, [items, cardHeight, isMobile]); // Removed window resize dependency

  useEffect(() => {
    if (autoRotate && isInView && !isHovering && isHeightCalculated) {
      const interval = setInterval(() => {
        setActive((prev) => (prev + 1) % items.length);
      }, rotateInterval);
      return () => clearInterval(interval);
    }
  }, [isInView, isHovering, autoRotate, rotateInterval, items.length, isHeightCalculated]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const onTouchStart = (e: TouchEvent) => {
    if (!isMobileSwipe) return;
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isMobileSwipe) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobileSwipe || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      setActive((prev) => (prev + 1) % items.length);
    } else if (distance < -minSwipeDistance) {
      setActive((prev) => (prev - 1 + items.length) % items.length);
    }
  };

  const getCardAnimationClass = (index: number) => {
    if (index === active) return "scale-100 opacity-100 z-20";
    
    if (isMobile) {
      // On mobile, hide non-active cards completely for better UX
      return "scale-90 opacity-0";
    }
    
    if (index === (active + 1) % items.length)
      return "translate-x-[40%] scale-95 opacity-60 z-10";
    if (index === (active - 1 + items.length) % items.length)
      return "translate-x-[-40%] scale-95 opacity-60 z-10";
    return "scale-90 opacity-0";
  };

  const renderCardContent = (item: Carousel3DItem) => {
    const getIcon = () => {
      switch (item.type) {
        case 'signal': return <TrendingUp className="h-6 w-6 text-blue-400" />;
        case 'news': return <Newspaper className="h-6 w-6 text-yellow-400" />;
        case 'upcoming': return <Calendar className="h-6 w-6 text-purple-400" />;
        default: return <TrendingUp className="h-6 w-6 text-blue-400" />;
      }
    };

    // If item has imageUrl (generic card), render it differently
    if (item.imageUrl) {
      return (
        <>
          <div
            className="relative bg-black p-6 flex items-center justify-center h-48 overflow-hidden"
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 text-center text-white">
              <h3 className="text-2xl font-bold mb-2">
                {item.brand.toUpperCase()}
              </h3>
              <div className="w-12 h-1 bg-white mx-auto mb-2" />
              <p className="text-sm">{item.title}</p>
            </div>
          </div>

          <CardContent className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-bold mb-1 text-foreground">
              {item.title}
            </h3>
            <p className="text-gray-500 text-sm font-medium mb-2">
              {item.brand}
            </p>
            <p className="text-gray-600 text-sm flex-grow">
              {item.description}
            </p>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {item.link && (
                <a
                  href={item.link}
                  className="text-gray-500 flex items-center hover:underline relative group"
                  onClick={() => {
                    if (item.link?.startsWith("/")) {
                      window.scrollTo(0, 0);
                    }
                  }}
                >
                  <span className="relative z-10">Learn more</span>
                  <ArrowRight className="ml-2 w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gray-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              )}
            </div>
          </CardContent>
        </>
      );
    }

    const renderSignalContent = () => (
      <div className="space-y-4">
        <div className="text-center text-2xl font-bold text-white mb-4">
          {item.data.symbol}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center mesh-gradient-card p-3 rounded-md border border-slate-600/20">
            <span className="text-green-400 text-sm font-medium">Take Profit</span>
            <span className="font-mono font-bold text-slate-200">{item.data.takeProfit}</span>
          </div>
          <div className="flex justify-between items-center mesh-gradient-card p-3 rounded-md border border-slate-600/20">
            <span className="text-red-400 text-sm font-medium">Stop Loss</span>
            <span className="font-mono font-bold text-slate-200">{item.data.stopLoss}</span>
          </div>
          <div className="flex justify-between items-center mesh-gradient-card p-3 rounded-md border border-slate-600/20">
            <span className="text-blue-400 text-sm font-medium">Entry Zone</span>
            <span className="font-mono font-bold text-slate-200">{item.data.entryZone}</span>
          </div>
          <div className="flex justify-between items-center mesh-gradient-card p-3 rounded-md border border-slate-600/20">
            <span className="text-orange-400 text-sm font-medium">Risk:Reward</span>
            <span className="font-mono font-bold text-slate-200">{item.data.riskReward}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400 pt-2 px-1">
            <span>Confidence</span>
            <span className={`${item.data.confidenceColor} font-semibold`}>{item.data.confidence}</span>
          </div>
        </div>
      </div>
    );

    const renderNewsContent = () => (
      <div className="space-y-4">
        <div className="text-center text-lg font-semibold text-white mb-4">
          Latest Market News
        </div>
        <div className="space-y-3">
          {item.data.slice(0, 3).map((news: string, index: number) => (
            <div key={index} className="mesh-gradient-card p-3 rounded-md border border-slate-600/20">
              <p className="text-slate-200 text-sm leading-relaxed">{news}</p>
            </div>
          ))}
        </div>
      </div>
    );

    const renderUpcomingContent = () => (
      <div className="space-y-4">
        <div className="text-center text-lg font-semibold text-white mb-4">
          Today's Economic Events
        </div>
        <div className="space-y-3">
          {item.data.map((event: any, index: number) => (
            <div key={index} className="mesh-gradient-card p-3 rounded-md border border-slate-600/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{event.event}</p>
                  <p className="text-gray-400 text-xs mt-1">{event.time}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  event.impact === 'Very High' ? 'bg-red-500/20 text-red-400' :
                  event.impact === 'High' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {event.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <>
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 flex items-center justify-center h-20 overflow-hidden  border-b border-slate-700/50">
          <div className="relative z-10 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-2">
              {getIcon()}
              <h3 className="text-xl font-bold">{item.brand}</h3>
            </div>
          </div>
          
          {/* Subtle SVG pattern background */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`pattern-${item.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${item.id})`}/>
          </svg>
        </div>

        <CardContent className="p-6 flex flex-col flex-grow mesh-gradient-card">
          <h3 className="text-xl font-bold mb-1 text-foreground text-white">{item.title}</h3>
          <p className="text-gray-400 text-sm mb-4">{item.description}</p>

          <div className="flex-grow">
            {item.type === 'signal' && renderSignalContent()}
            {item.type === 'news' && renderNewsContent()}
            {item.type === 'upcoming' && renderUpcomingContent()}
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 mesh-gradient-secondary text-slate-300 rounded-full text-xs border border-slate-600/30 "
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <RequireAuth to="/signal">
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button w-full group transition-all hover:scale-105"
                >
                  <span>View Details</span>
                  <ArrowDown className="ml-2 w-4 h-4 transition-transform group-hover:translate-y-1" />
                </Button>
              </RequireAuth>
            </div>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <section
      id="live-preview"
      className="py-20 sm:py-32 bg-transparent min-w-full mx-auto flex items-center justify-center"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 min-w-[350px] md:min-w-[1000px] max-w-7xl">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-display text-4xl font-bold sm:text-5xl text-white">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            {tagline}
          </p>
        </div>

        <div
          className="relative overflow-hidden"
          style={{ height: `${Math.max(dynamicCardHeight + 100, 600)}px` }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          ref={carouselRef}
        >
          {/* Loading skeleton while calculating height */}
          {!isHeightCalculated && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="glass-card animate-pulse h-96 rounded-lg bg-slate-800/90  border border-slate-700/50">
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-700 rounded"></div>
                      <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-700 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`absolute top-0 w-full ${
                  isMobile ? 'max-w-sm px-4' : 'max-w-md'
                } transform transition-all duration-500 ${getCardAnimationClass(
                  index
                )}`}
              >
                <Card
                  ref={(el) => (cardRefs.current[index] = el)}
                  className={`glass-card overflow-hidden flex flex-col hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] ${
                    !isHeightCalculated ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ 
                    height: `${dynamicCardHeight}px`,
                    transition: isHeightCalculated ? 'opacity 0.3s ease-in-out' : 'none'
                  }}
                >
                  {renderCardContent(item)}
                </Card>
              </div>
            ))}
          </div>

          {!isMobile && isHeightCalculated && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10  rounded-full flex items-center justify-center text-white hover:bg-white/20 z-30 border border-white/20 transition-all hover:scale-110"
                onClick={() =>
                  setActive((prev) => (prev - 1 + items.length) % items.length)
                }
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10  rounded-full flex items-center justify-center text-white hover:bg-white/20 z-30 border border-white/20 transition-all hover:scale-110"
                onClick={() => setActive((prev) => (prev + 1) % items.length)}
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {isHeightCalculated && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-3 z-30">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    active === idx
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  onClick={() => setActive(idx)}
                  aria-label={`Go to item ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Carousel3D;
