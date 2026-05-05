import { useWeeklyPlaybook } from '@/features/news/hooks/useWeeklyPlaybook';
import { useSymbols } from '@/hooks/useSymbols';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toLabel = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.theme_name === 'string') return rec.theme_name;
    if (typeof rec.theme === 'string') return rec.theme;
    if (typeof rec.name === 'string') return rec.name;
    if (typeof rec.label === 'string') return rec.label;
    return JSON.stringify(value);
  }
  return 'Unknown';
};

const getBiasIcon = (bias: string) => {
  const lower = bias.toLowerCase();
  if (lower.includes('bull') || lower.includes('long') || lower.includes('up')) {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (lower.includes('bear') || lower.includes('short') || lower.includes('down')) {
    return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
  }
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
};

function TickerContainer({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const scrollNode = scrollRef.current;
    
    const scroll = () => {
      if (scrollNode && !isHovered && !isDragging) {
        // Only scroll if content is wider than container
        if (scrollNode.scrollWidth > scrollNode.clientWidth) {
          scrollNode.scrollLeft += 0.5;
          // Soft wrap
          if (scrollNode.scrollLeft >= scrollNode.scrollWidth - scrollNode.clientWidth - 1) {
            scrollNode.scrollLeft = 0;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, isDragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "flex items-center gap-6 overflow-x-auto scrollbar-none py-1.5",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}

const getCurrencyBiasScore = (cName: string, currencies: any[]) => {
  const found = currencies.find((c: any) => {
    if (!c) return false;
    const name = typeof c === 'string' ? c : c.currency;
    if (typeof name !== 'string') return false;
    const upName = name.toUpperCase();
    const upTarget = cName.toUpperCase();
    return upName === upTarget || 
          (upName === 'GOLD' && upTarget === 'XAU') ||
          (upName === 'SILVER' && upTarget === 'XAG');
  });

  if (found) {
    const biasStr = typeof found === 'string' ? found : found.bias || 'Neutral';
    const lower = biasStr.toLowerCase();
    if (lower.includes('bull') || lower.includes('long') || lower.includes('up')) return 1;
    if (lower.includes('bear') || lower.includes('short') || lower.includes('down')) return -1;
  }
  return 0;
};

export function MarketSnapshotStrip() {
  const { items, loading, error } = useWeeklyPlaybook();
  const { symbols } = useSymbols();

  if (loading || error || !items || items.length === 0) return null;

  const playbook = items[0];
  const pairBiases = asArray(playbook.pair_bias);
  const currencies = asArray(playbook.currency_bias);
  const themes = asArray(playbook.dominant_themes).map(toLabel);

  let displayBiases: { currency: string, bias: string }[] = [];

  if (pairBiases.length > 0) {
    displayBiases = pairBiases.map((pb: any) => ({
      currency: typeof pb === 'string' ? pb : pb.symbol || pb.currency,
      bias: typeof pb === 'string' ? 'Neutral' : (pb.bias || 'Neutral')
    })).filter(b => b.currency);
  } else {
    // Fallback to math-based calculation for legacy data
    displayBiases = symbols.map(sym => {
      let base = sym.substring(0, 3);
      let quote = sym.substring(3, 6);
      
      if (sym === 'XAUUSD') { base = 'XAU'; quote = 'USD'; }
      else if (sym === 'XAGUSD') { base = 'XAG'; quote = 'USD'; }
      else if (sym === 'BTCUSD') { base = 'BTC'; quote = 'USD'; }
      else if (sym === 'ETHUSD') { base = 'ETH'; quote = 'USD'; }
      else if (sym.length === 6 && !sym.includes('/')) {
        base = sym.substring(0, 3);
        quote = sym.substring(3, 6);
      }

      const baseScore = getCurrencyBiasScore(base, currencies);
      const quoteScore = getCurrencyBiasScore(quote, currencies);
      const pairScore = baseScore - quoteScore;
      
      let bias = 'Neutral';
      if (pairScore > 0) bias = 'BULLISH';
      if (pairScore < 0) bias = 'BEARISH';

      if (pairScore === 0) {
        const exactMatch = getCurrencyBiasScore(sym, currencies);
        if (exactMatch > 0) bias = 'BULLISH';
        if (exactMatch < 0) bias = 'BEARISH';
      }

      return { currency: sym, bias };
    });
  }

  return (
    <div className="w-full bg-[#111315]/90 border-b border-[#C8935A]/10 hidden md:block">
      
      {/* Row 1: Currencies Marquee */}
      <div className="border-b border-[#C8935A]/5">
        <div className="sa-container">
          <TickerContainer>
            {/* Duplicate list to make it look fuller if needed, or just map once */}
            <div className="flex items-center gap-8 text-[11px] font-mono tracking-wider font-bold min-w-max pr-8">
              {displayBiases.map((cb, idx) => (
                <div key={`${cb.currency}-${idx}`} className="flex items-center gap-1.5 select-none">
                  <span className="text-slate-400">{cb.currency}</span>
                  {getBiasIcon(cb.bias)}
                </div>
              ))}
            </div>
            {displayBiases.length < 8 && (
              <div className="flex items-center gap-8 text-[11px] font-mono tracking-wider font-bold min-w-max pr-8" aria-hidden="true">
                {displayBiases.map((cb, idx) => (
                  <div key={`dup-${cb.currency}-${idx}`} className="flex items-center gap-1.5 select-none">
                    <span className="text-slate-400">{cb.currency}</span>
                    {getBiasIcon(cb.bias)}
                  </div>
                ))}
              </div>
            )}
          </TickerContainer>
        </div>
      </div>

      {/* Row 2: Themes */}
      <div className="sa-container py-2 flex flex-wrap items-center gap-6 text-[11px] font-mono tracking-wider font-bold">
        {/* All Themes */}
        <div className="flex items-center gap-2 text-[#C8935A]/80 overflow-x-auto scrollbar-none min-w-0">
          <span className="text-slate-500 uppercase tracking-widest text-[9px] shrink-0">Dominant Themes:</span>
          <div className="flex items-center gap-3">
            {themes.length > 0 ? themes.map((theme, idx) => (
              <span key={idx} className="whitespace-nowrap shrink-0">
                {theme}
                {idx < themes.length - 1 && <span className="text-slate-700 mx-3">•</span>}
              </span>
            )) : (
              <span className="text-slate-600">No major themes</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
