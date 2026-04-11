/**
 * RegimeBadge
 * ===========
 * Premium "Lumina" Market Regime indicator.
 * Uses a Fixed-Position React Portal with smart viewport detection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  PauseCircle,
  Activity,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useRegime } from './hooks/useRegime';
import { cn } from '@/lib/utils';

function classifyRegime(regimeType: string) {
  const t = regimeType.toLowerCase();

  if (t.includes('bullish') || t.includes('up trend') || t.includes('uptrend')) {
    return {
      Icon: TrendingUp,
      pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      label: 'Bullish Shift',
      accent: '#10B981',
    };
  }
  if (t.includes('bearish') || t.includes('down trend') || t.includes('downtrend')) {
    return {
      Icon: TrendingDown,
      pill: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      label: 'Bearish Pull',
      accent: '#F43F5E',
    };
  }
  if (t.includes('rang') || t.includes('sideways') || t.includes('consolidat')) {
    return {
      Icon: PauseCircle,
      pill: 'bg-[#E2B485]/10 text-[#E2B485] border-[#E2B485]/30',
      glow: 'shadow-[0_0_15px_rgba(226,180,133,0.25)]',
      label: 'Ranging Core',
      accent: '#E2B485',
    };
  }
  if (t.includes('volatil') || t.includes('unstable') || t.includes('choppy')) {
    return {
      Icon: Activity,
      pill: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      label: 'High Variance',
      accent: '#A855F7',
    };
  }

  return {
    Icon: BrainCircuit,
    pill: 'bg-blue-600/10 text-blue-400 border-blue-500/30',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    label: 'Analyzing...',
    accent: '#3B82F6',
  };
}

export const RegimeBadge: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { regime, loading } = useRegime(symbol);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update position on hover/tap
  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = Math.min(320, viewportWidth - 32);
      
      // Smart horizontal alignment: try to align left, but don't overflow right
      let left = rect.left;
      if (left + panelWidth > viewportWidth - 16) {
        left = viewportWidth - panelWidth - 16;
      }
      // Ensure it's never off the left edge
      left = Math.max(16, left);

      setCoords({
        top: rect.bottom + 8,
        left: left,
        width: panelWidth
      });
    }
  }, [isHovered]);

  if (loading) {
    return (
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1 rounded-full border border-white/5 bg-white/[0.02] animate-pulse">
        <Sparkles className="w-3 h-3 text-blue-500/50" />
        <div className="w-12 xs:w-16 h-2 rounded bg-white/10" />
      </div>
    );
  }

  const activeRegime = regime || { regime_type: 'Analyzing' };
  const { Icon, pill, glow, label } = classifyRegime(activeRegime.regime_type);

  return (
    <div 
      className="relative flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)} // Toggle for mobile tap
      ref={triggerRef}
    >
      {/* ── Badge trigger ── */}
      <div
        className={cn(
          'flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border ',
          'transition-all duration-500 cursor-help select-none',
          pill, glow,
        )}
      >
        <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
        <span className="hidden xs:inline text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap max-w-[80px] sm:max-w-[120px] truncate">
          {label}
        </span>
      </div>

      {/* ── Hover panel (Fixed Portal) ── */}
      {isHovered && createPortal(
        <>
          {/* Backdrop for mobile tap-to-close */}
          <div 
             className="fixed inset-0 z-[99998] bg-black/20 block sm:hidden" 
             onClick={() => setIsHovered(false)} 
          />
          <div
            className={cn(
              'fixed z-[99999] pointer-events-auto',
              'bg-[#0b0c0e] border border-[#E2B485]/30 rounded-2xl overflow-hidden',
              'shadow-[0_20px_50px_rgba(0,0,0,1)] ring-1 ring-white/10',
              'animate-in fade-in zoom-in-95 duration-200',
              'sa-scope'
            )}
            style={{ 
              top: coords.top, 
              left: coords.left, 
              width: coords.width,
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-[#E2B485]" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E2B485]/80">
                  AI Cognitive Sweep
                </span>
              </div>
              <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  {activeRegime.regime_type}
                </h4>
                <div className="h-1 w-12 bg-[#E2B485]/40 rounded-full mt-1.5" />
              </div>

              {regime?.text ? (
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {regime.text}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  Analyzing market structure for {symbol}... identifying trends.
                </p>
              )}

              {regime && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                  {regime.regime_strength != null && (
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Strength
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            style={{ width: `${regime.regime_strength * 10}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {regime.regime_strength}/10
                        </span>
                      </div>
                    </div>
                  )}
                  {regime.risk_level && (
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Risk Guard
                      </p>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">
                          {regime.risk_level}
                        </span>
                      </div>
                    </div>
                  )}
                  {regime.strategy && (
                    <div className="col-span-2 p-3 rounded-xl bg-blue-600/5 border border-blue-500/10 mt-1">
                      <p className="text-[9px] text-blue-400/60 font-black uppercase tracking-widest mb-1.5">
                        Optimal Strategy Fit
                      </p>
                      <p className="text-[11px] font-bold text-blue-300 leading-snug">
                        {regime.strategy}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight whitespace-nowrap overflow-hidden">
                Active Inference
              </span>
              <span className="text-[9px] font-mono text-slate-600 shrink-0">v2.1.0-LIVE</span>
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
};
