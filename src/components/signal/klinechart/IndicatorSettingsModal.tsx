/**
 * Indicator Settings Modal
 * 
 * MT5-like indicator customization panel with Lumina styling.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Settings2,
  Palette,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  TrendingUp,
  Activity,
  Search,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { IndicatorConfig } from './types';
import { cn } from '@/lib/utils';

// Premium preset colors matching the app's brand
const PRESET_COLORS = [
  '#E2B485', // Brown accent
  '#3B82F6', // Cobalt
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#A855F7', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#FFFFFF', // White
  '#64748B', // Slate
];

const INDICATOR_METADATA: Record<string, {
  description: string;
  paramLabels: string[];
  defaultParams: number[];
  minValues: number[];
  maxValues: number[];
}> = {
  'EMA': {
    description: 'Exponential Moving Average - Gives more weight to recent prices.',
    paramLabels: ['Period'],
    defaultParams: [21],
    minValues: [1],
    maxValues: [500],
  },
  'MA': {
    description: 'Simple Moving Average - Equal weight for all prices in period.',
    paramLabels: ['Period'],
    defaultParams: [200],
    minValues: [1],
    maxValues: [500],
  },
  'BOLL': {
    description: 'Bollinger Bands - Measures volatility via price standard deviations.',
    paramLabels: ['Period', 'Std Dev'],
    defaultParams: [20, 2],
    minValues: [1, 0.5],
    maxValues: [100, 5],
  },
  'SAR': {
    description: 'Parabolic SAR - Identifies potential trend reversals.',
    paramLabels: ['Step', 'Max'],
    defaultParams: [0.02, 0.2],
    minValues: [0.01, 0.05],
    maxValues: [0.1, 0.5],
  },
  'RSI': {
    description: 'Relative Strength Index - Momentum oscillator (0-100).',
    paramLabels: ['Period'],
    defaultParams: [14],
    minValues: [2],
    maxValues: [100],
  },
  'MACD': {
    description: 'Trend-following momentum indicator showing averages relationship.',
    paramLabels: ['Fast', 'Slow', 'Signal'],
    defaultParams: [12, 26, 9],
    minValues: [1, 1, 1],
    maxValues: [100, 200, 100],
  },
  'ATR': {
    description: 'Average True Range - Measures market volatility.',
    paramLabels: ['Period'],
    defaultParams: [14],
    minValues: [1],
    maxValues: [100],
  },
};

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-10 justify-start gap-3 bg-white/[0.04] border border-white/10 hover:border-[#E2B485]/50 transition-all rounded-xl"
        >
          <div
            className="w-5 h-5 rounded-md border border-white/20 shadow-md shadow-black/40"
            style={{ backgroundColor: color }}
          />
          <span className="text-slate-400 text-xs font-mono font-bold tracking-wider">{label || color.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-68 bg-[#0b0c0e] border-[#E2B485]/20 p-4 rounded-2xl sa-scope shadow-2xl ">
        <div className="space-y-4">
          <Label className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-2">Signature Palette</Label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={cn(
                    "w-10 h-10 rounded-lg borer-2 transition-all group relative overflow-hidden",
                    color === c ? "border-[#E2B485] shadow-[0_0_15px_rgba(226,180,133,0.3)] scale-110" : "border-white/10 hover:scale-105 hover:border-white/30"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Check className="w-5 h-5 text-black" />
                    </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center pt-3 border-t border-white/5">
            <Input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 p-1 border-0 cursor-pointer rounded-lg bg-transparent"
            />
            <Input
              value={color}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 h-10 bg-white/15 border-white/10 text-xs font-mono text-[#E2B485] focus:ring-0 focus:border-[#E2B485]/40 rounded-lg"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface IndicatorSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicators: IndicatorConfig[];
  onUpdateIndicator: (indicatorId: string, updates: Partial<IndicatorConfig>) => void;
  onToggleIndicator: (indicatorId: string) => void;
  onResetToDefaults: () => void;
  initialIndicatorId?: string | null;
}

export const IndicatorSettingsModal: React.FC<IndicatorSettingsModalProps> = ({
  open,
  onOpenChange,
  indicators,
  onUpdateIndicator,
  onToggleIndicator,
  onResetToDefaults,
  initialIndicatorId = null,
}) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && initialIndicatorId) {
        setSelectedIndicator(initialIndicatorId);
    } else if (open && !selectedIndicator) {
        setSelectedIndicator(indicators[0]?.id || null);
    }
  }, [open, initialIndicatorId, indicators]);

  const [localParams, setLocalParams] = useState<Record<string, number[]>>({});
  const [localColors, setLocalColors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (selectedIndicator) {
      const indicator = indicators.find(i => i.id === selectedIndicator);
      if (indicator) {
        const params = indicator.params.calcParams as number[] || [];
        setLocalParams({ [selectedIndicator]: [...params] });
        setLocalColors({ [selectedIndicator]: [...indicator.colors] });
      }
    }
  }, [selectedIndicator, indicators]);

  const handleApply = useCallback(() => {
    if (selectedIndicator) {
      const params = localParams[selectedIndicator];
      const colors = localColors[selectedIndicator];
      if (params) {
        onUpdateIndicator(selectedIndicator, {
          params: { calcParams: params },
          colors: colors,
        });
      }
    }
  }, [selectedIndicator, localParams, localColors, onUpdateIndicator]);

  const handleParamChange = (indicatorId: string, index: number, value: number) => {
    setLocalParams(prev => ({
        ...prev,
        [indicatorId]: (prev[indicatorId] || []).map((v, i) => i === index ? value : v)
    }));
  };

  const filteredIndicators = indicators.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIndicatorList = () => (
    <div className="space-y-4 p-4">
        {['overlay', 'oscillator'].map((cat) => (
            <div key={cat} className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block px-2 mb-2">
                    {cat === 'overlay' ? 'Overlays' : 'Oscillators'}
                </span>
                {filteredIndicators.filter(i => i.category === cat).map(indicator => {
                    const isSelected = selectedIndicator === indicator.id;
                    return (
                        <div
                            key={indicator.id}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer",
                                isSelected ? "bg-[#E2B485]/10 border-[#E2B485]/30 shadow-lg shadow-black/20" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                            onClick={() => setSelectedIndicator(indicator.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: indicator.colors[0] }} />
                                <span className={cn("text-xs font-bold leading-none", isSelected ? "text-[#E2B485]" : "text-slate-400 group-hover:text-slate-200")}>{indicator.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleIndicator(indicator.id); }}
                                    className={cn("p-1.5 rounded-lg transition-all", indicator.enabled ? "text-[#10B981] bg-emerald-500/10" : "text-slate-700 bg-white/15 hover:text-slate-400")}
                                >
                                    {indicator.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", isSelected ? "rotate-90 text-[#E2B485]" : "text-slate-800 opacity-0 group-hover:opacity-100")} />
                            </div>
                        </div>
                    );
                })}
            </div>
        ))}
    </div>
  );

  const renderSettings = () => {
    if (!selectedIndicator) return null;
    const indicator = indicators.find(i => i.id === selectedIndicator);
    if (!indicator) return null;
    const meta = INDICATOR_METADATA[indicator.klineIndicator];
    const params = localParams[selectedIndicator] || [];
    const colors = localColors[selectedIndicator] || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Content */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#E2B485]/15 rounded-2xl border border-[#E2B485]/20">
                        <Settings2 className="w-6 h-6 text-[#E2B485]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{indicator.name}</h3>
                        <div className="flex gap-2 mt-1">
                            <Badge className="bg-white/15 text-slate-500 border-0 uppercase text-[9px] font-black tracking-widest rounded-md px-1.5 h-5">{indicator.category}</Badge>
                            <Badge className="bg-blue-600/10 text-blue-400 border-0 uppercase text-[9px] font-black tracking-widest rounded-md px-1.5 h-5">{indicator.klineIndicator}</Badge>
                        </div>
                    </div>
                </div>
                {meta && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex gap-3 items-start">
                        <Info className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                        <p className="text-slate-400 text-sm leading-relaxed">{meta.description}</p>
                    </div>
                )}
            </div>

            {/* Params Section */}
            <div className="space-y-5">
                <div className="flex items-center gap-2 px-1">
                    <TrendingUp className="w-4 h-4 text-[#E2B485]/60" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E2B485]/80">Computation Parameters</span>
                </div>
                <div className="grid gap-6">
                    {params.map((val, idx) => (
                        <div key={idx} className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-slate-200">{meta?.paramLabels[idx] || `Property ${idx+1}`}</Label>
                                <Input 
                                    type="number"
                                    value={val}
                                    onChange={(e) => handleParamChange(selectedIndicator, idx, parseFloat(e.target.value))}
                                    className="w-20 h-8 bg-black/40 border-white/10 text-[#E2B485] font-mono font-bold rounded-lg text-center p-0"
                                />
                            </div>
                            <Slider 
                                value={[val]}
                                min={meta?.minValues[idx] || 1}
                                max={meta?.maxValues[idx] || 200}
                                step={(meta?.maxValues[idx] ?? 0) < 5 ? 0.01 : 1}
                                onValueChange={([v]) => handleParamChange(selectedIndicator, idx, v)}
                                className="indicator-slider py-2"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-5">
                <div className="flex items-center gap-2 px-1">
                    <Palette className="w-4 h-4 text-[#E2B485]/60" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E2B485]/80">Visual Styles</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colors.map((c, idx) => (
                        <div key={idx} className="space-y-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                {indicator.klineIndicator === 'MACD' 
                                    ? ['Fast Line', 'Signal Line', 'Histogram'][idx]
                                    : indicator.klineIndicator === 'BOLL'
                                    ? ['Upper Band', 'Mid Line', 'Lower Band'][idx]
                                    : `Style Slot ${idx+1}`}
                            </Label>
                            <ColorPicker color={c} onChange={(newC) => {
                                const newCols = [...colors];
                                newCols[idx] = newC;
                                setLocalColors(prev => ({ ...prev, [selectedIndicator]: newCols }));
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions Inline */}
            <div className="flex gap-4 pt-6 mt-8 border-t border-white/5">
                <Button variant="ghost" onClick={handleApply} className="flex-1 h-12 rounded-2xl bg-[#E2B485] text-[#111315] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#E2B485]/20">
                    <Check className="w-5 h-5 mr-2 stroke-[3]" />
                    Apply Configuration
                </Button>
                <Button variant="ghost" onClick={() => setSelectedIndicator(selectedIndicator)} className="h-12 w-12 rounded-2xl bg-white/15 hover:bg-white/10 text-slate-500 border border-white/10 transition-all">
                    <RotateCcw className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sa-news-dialog sa-scope max-w-5xl h-[85vh] p-0 overflow-hidden rounded-[2rem] border-[#E2B485]/30">
        <div className="flex h-full bg-black overflow-hidden">
          {/* Left Panel */}
          <div className="w-[340px] h-full border-r border-white/10 bg-[#0b0c0e]/80 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/10 shrink-0">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Settings2 className="w-6 h-6 text-[#E2B485]" />
                    Signals
                </h2>
                <div className="mt-6 relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-[#E2B485] transition-colors" />
                    <Input 
                        placeholder="Search indicators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-11 bg-white/[0.02] border-white/10 rounded-xl focus:border-[#E2B485]/50 focus:ring-0 text-slate-300 font-medium"
                    />
                </div>
            </div>
            <ScrollArea className="flex-1 bg-gradient-to-b from-[#111315] to-[#0b0c0e]">
                {renderIndicatorList()}
            </ScrollArea>
          </div>

          {/* Right Panel */}
          <div className="flex-1 h-full overflow-hidden flex flex-col bg-gradient-to-br from-[#0b0c0e] via-[#111315] to-black">
            <ScrollArea className="flex-1">
              <div className="p-8">
                {renderSettings()}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndicatorSettingsModal;
