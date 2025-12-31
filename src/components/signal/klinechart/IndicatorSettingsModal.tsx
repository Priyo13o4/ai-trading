/**
 * Indicator Settings Modal
 * 
 * MT5-like indicator customization panel with:
 * - Period inputs (adjustable parameters)
 * - Color pickers
 * - Line style options
 * - Preview of indicator appearance
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Plus,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  Activity,
  Search,
  Layers,
} from 'lucide-react';
import type { IndicatorConfig } from './types';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#D4AF37', // Golden
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EF4444', // Red
  '#A855F7', // Purple
  '#06B6D4', // Cyan
  '#FBBF24', // Yellow
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#FFFFFF', // White
  '#94A3B8', // Slate
];

// Indicator metadata for better UX
const INDICATOR_METADATA: Record<string, {
  description: string;
  paramLabels: string[];
  defaultParams: number[];
  minValues: number[];
  maxValues: number[];
}> = {
  'EMA': {
    description: 'Exponential Moving Average - Gives more weight to recent prices',
    paramLabels: ['Period'],
    defaultParams: [21],
    minValues: [1],
    maxValues: [500],
  },
  'MA': {
    description: 'Simple Moving Average - Equal weight to all prices in period',
    paramLabels: ['Period'],
    defaultParams: [200],
    minValues: [1],
    maxValues: [500],
  },
  'BOLL': {
    description: 'Bollinger Bands - Volatility bands around a moving average',
    paramLabels: ['Period', 'Std Dev'],
    defaultParams: [20, 2],
    minValues: [1, 0.5],
    maxValues: [100, 5],
  },
  'SAR': {
    description: 'Parabolic SAR - Trend reversal indicator',
    paramLabels: ['Step', 'Max'],
    defaultParams: [0.02, 0.2],
    minValues: [0.01, 0.05],
    maxValues: [0.1, 0.5],
  },
  'RSI': {
    description: 'Relative Strength Index - Momentum oscillator (0-100)',
    paramLabels: ['Period'],
    defaultParams: [14],
    minValues: [2],
    maxValues: [100],
  },
  'MACD': {
    description: 'Moving Average Convergence Divergence - Trend momentum',
    paramLabels: ['Fast', 'Slow', 'Signal'],
    defaultParams: [12, 26, 9],
    minValues: [1, 1, 1],
    maxValues: [100, 200, 100],
  },
  'ATR': {
    description: 'Average True Range - Volatility indicator',
    paramLabels: ['Period'],
    defaultParams: [14],
    minValues: [1],
    maxValues: [100],
  },
  'KDJ': {
    description: 'Stochastic Oscillator - Momentum indicator',
    paramLabels: ['Period', 'K', 'D'],
    defaultParams: [9, 3, 3],
    minValues: [1, 1, 1],
    maxValues: [100, 50, 50],
  },
  'WR': {
    description: 'Williams %R - Overbought/oversold indicator',
    paramLabels: ['Period'],
    defaultParams: [14],
    minValues: [1],
    maxValues: [100],
  },
  'CCI': {
    description: 'Commodity Channel Index - Cyclical indicator',
    paramLabels: ['Period'],
    defaultParams: [13],
    minValues: [1],
    maxValues: [100],
  },
  'DMI': {
    description: 'Directional Movement Index - Trend strength',
    paramLabels: ['Period', 'Smooth'],
    defaultParams: [14, 6],
    minValues: [1, 1],
    maxValues: [100, 50],
  },
  'VOL': {
    description: 'Volume - Trading volume with moving averages',
    paramLabels: ['MA1', 'MA2', 'MA3'],
    defaultParams: [5, 10, 20],
    minValues: [1, 1, 1],
    maxValues: [100, 100, 100],
  },
  'OBV': {
    description: 'On-Balance Volume - Volume flow indicator',
    paramLabels: ['MA Period'],
    defaultParams: [30],
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
          className="w-full h-9 justify-start gap-2 bg-slate-800/50 border-slate-600 hover:bg-slate-700"
        >
          <div
            className="w-5 h-5 rounded border border-slate-500"
            style={{ backgroundColor: color }}
          />
          <span className="text-slate-300 text-xs">{label || color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-slate-900 border-slate-700 p-3">
        <div className="space-y-3">
          <Label className="text-slate-300 text-xs">Select Color</Label>
          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={`w-6 h-6 rounded border transition-all ${
                  color === c 
                    ? 'border-white scale-110' 
                    : 'border-slate-600 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-8 p-0 border-0 cursor-pointer"
            />
            <Input
              value={color}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 h-8 bg-slate-800 border-slate-600 text-xs text-slate-200"
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

  // Set initial indicator when modal opens with a specific indicator
  useEffect(() => {
    if (open && initialIndicatorId) {
      setSelectedIndicator(initialIndicatorId);
    }
    if (!open) {
      setSearchQuery('');
    }
  }, [open, initialIndicatorId]);
  const [localParams, setLocalParams] = useState<Record<string, number[]>>({});
  const [localColors, setLocalColors] = useState<Record<string, string[]>>({});

  // Initialize local state when indicator is selected
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

  const handleParamChange = useCallback((indicatorId: string, index: number, value: number) => {
    setLocalParams(prev => {
      const current = prev[indicatorId] || [];
      const updated = [...current];
      updated[index] = value;
      return { ...prev, [indicatorId]: updated };
    });
  }, []);

  const handleColorChange = useCallback((indicatorId: string, index: number, color: string) => {
    setLocalColors(prev => {
      const current = prev[indicatorId] || [];
      const updated = [...current];
      updated[index] = color;
      return { ...prev, [indicatorId]: updated };
    });
  }, []);

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

  const handleReset = useCallback(() => {
    if (selectedIndicator) {
      const indicator = indicators.find(i => i.id === selectedIndicator);
      if (indicator) {
        const meta = INDICATOR_METADATA[indicator.klineIndicator];
        if (meta) {
          setLocalParams({ [selectedIndicator]: [...meta.defaultParams] });
        }
      }
    }
  }, [selectedIndicator, indicators]);

  // Filter indicators based on search query
  const filteredIndicators = indicators.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.klineIndicator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOverlay = filteredIndicators.filter(i => i.category === 'overlay');
  const filteredOscillator = filteredIndicators.filter(i => i.category === 'oscillator');

  const renderIndicatorList = (indicatorList: IndicatorConfig[], categoryLabel: string, CategoryIcon: React.ElementType) => (
    indicatorList.length > 0 && (
      <div className="mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1.5">
          <CategoryIcon className="w-3 h-3" />
          <span>{categoryLabel}</span>
        </div>
        <div className="space-y-0.5">
          {indicatorList.map((indicator) => {
            const isSelected = selectedIndicator === indicator.id;
        
            return (
              <div
                key={indicator.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50' 
                    : 'hover:bg-slate-700/50 border border-transparent'
                }`}
                onClick={() => setSelectedIndicator(indicator.id)}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleIndicator(indicator.id);
                    }}
                    className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                  >
                    {indicator.enabled ? (
                      <Eye className="w-4 h-4 text-green-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: indicator.colors[0] }}
                  />
                  <span className={`text-sm font-medium ${
                    indicator.enabled ? 'text-white' : 'text-slate-400'
                  }`}>
                    {indicator.name}
                  </span>
                </div>
                <Settings2 className={`w-4 h-4 ${isSelected ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              </div>
            );
          })}
        </div>
      </div>
    )
  );

  const renderSettings = () => {
    if (!selectedIndicator) {
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select an indicator to customize</p>
          </div>
        </div>
      );
    }

    const indicator = indicators.find(i => i.id === selectedIndicator);
    if (!indicator) return null;

    const meta = INDICATOR_METADATA[indicator.klineIndicator];
    const params = localParams[selectedIndicator] || indicator.params.calcParams as number[] || [];
    const colors = localColors[selectedIndicator] || indicator.colors;

    return (
      <div className="space-y-6">
        {/* Indicator Header */}
        <div className="border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[0] }}
            />
            <h3 className="text-lg font-semibold text-white">{indicator.name}</h3>
            <Badge className={`${indicator.category === 'overlay' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {indicator.category}
            </Badge>
          </div>
          {meta && (
            <p className="mt-2 text-sm text-slate-400">{meta.description}</p>
          )}
        </div>

        {/* Parameters Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Parameters
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {params.map((value, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-xs text-slate-400">
                  {meta?.paramLabels[index] || `Param ${index + 1}`}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleParamChange(
                      selectedIndicator,
                      index,
                      parseFloat(e.target.value) || 0
                    )}
                    min={meta?.minValues[index] || 1}
                    max={meta?.maxValues[index] || 500}
                    className="bg-slate-800 border-slate-600 text-white h-9"
                  />
                </div>
                {meta && (
                  <Slider
                    value={[value]}
                    min={meta.minValues[index] || 1}
                    max={meta.maxValues[index] || 100}
                    step={meta.maxValues[index] > 10 ? 1 : 0.1}
                    onValueChange={([v]) => handleParamChange(selectedIndicator, index, v)}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {colors.map((color, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-xs text-slate-400">
                  {indicator.klineIndicator === 'MACD' 
                    ? ['DIF Line', 'DEA Line', 'Histogram'][index] || `Line ${index + 1}`
                    : indicator.klineIndicator === 'BOLL'
                    ? ['Upper', 'Middle', 'Lower'][index] || `Band ${index + 1}`
                    : `Line ${index + 1}`}
                </Label>
                <ColorPicker
                  color={color}
                  onChange={(c) => handleColorChange(selectedIndicator, index, c)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-medium"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1419] border-slate-700/50 max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-transparent">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            Indicator Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-[450px]">
          {/* Left Panel - Indicator List with Search */}
          <div className="w-[280px] border-r border-slate-700/50 flex flex-col bg-slate-900/30">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search indicators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-800/50 border-slate-600 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>
            
            {/* Scrollable Indicator List */}
            <ScrollArea className="flex-1 px-2 py-2">
              {renderIndicatorList(filteredOverlay, 'Overlay Indicators', Layers)}
              {renderIndicatorList(filteredOscillator, 'Oscillators', Activity)}
              
              {filteredOverlay.length === 0 && filteredOscillator.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm">
                  No indicators found
                </div>
              )}
            </ScrollArea>

            {/* Reset All Button */}
            <div className="p-3 border-t border-slate-700/50">
              <Button
                variant="outline"
                size="sm"
                onClick={onResetToDefaults}
                className="w-full border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/80 hover:border-slate-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All to Defaults
              </Button>
            </div>
          </div>

          {/* Right Panel - Settings */}
          <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-br from-slate-900/20 to-transparent">
            {renderSettings()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndicatorSettingsModal;
