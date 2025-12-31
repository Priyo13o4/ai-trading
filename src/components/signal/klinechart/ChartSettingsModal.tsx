/**
 * Chart Settings Modal
 * 
 * MT5-like chart settings panel with:
 * - OHLC visibility toggles (High/Low marks, Last price line, Volume)
 * - Candle colors customization
 * - Grid and axis options
 * - Crosshair settings
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Palette,
  RotateCcw,
  Grid3X3,
  Crosshair,
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  Check,
  X,
} from 'lucide-react';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#22C55E', // Green (bullish)
  '#EF4444', // Red (bearish)
  '#D4AF37', // Golden
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#06B6D4', // Cyan
  '#FBBF24', // Yellow
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#FFFFFF', // White
  '#9CA3AF', // Gray
  '#1F2937', // Dark
  '#0F172A', // Darker
  '#000000', // Black
];

interface ChartSettings {
  // Candle colors
  upColor: string;
  downColor: string;
  // Price marks
  showHighLowMarks: boolean;
  showLastPriceLine: boolean;
  // Grid
  showGrid: boolean;
  showHorizontalGrid: boolean;
  showVerticalGrid: boolean;
  gridColor: string;
  // Crosshair
  showCrosshair: boolean;
  crosshairColor: string;
  // Volume
  showVolume: boolean;
  // Tooltip
  showTooltipAlways: boolean;
}

const DEFAULT_SETTINGS: ChartSettings = {
  upColor: '#22C55E',
  downColor: '#EF4444',
  showHighLowMarks: true,
  showLastPriceLine: true,
  showGrid: true,
  showHorizontalGrid: true,
  showVerticalGrid: true,
  gridColor: '#1F2937',
  showCrosshair: true,
  crosshairColor: '#F97316',
  showVolume: false,
  showTooltipAlways: false,
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
          className="w-full h-10 justify-start gap-3 bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-[#D4AF37]/50 transition-all duration-200"
        >
          <div
            className="w-6 h-6 rounded-md border-2 border-slate-500 shadow-inner"
            style={{ backgroundColor: color }}
          />
          <span className="text-slate-200 text-sm font-medium">{label || color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-slate-900 border-slate-700 p-3 z-[100]">
        <div className="space-y-3">
          <Label className="text-slate-300 text-xs font-medium">Select Color</Label>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={`w-7 h-7 rounded-md border-2 transition-all duration-150 ${
                  color === c 
                    ? 'border-[#D4AF37] scale-110 shadow-lg shadow-[#D4AF37]/30' 
                    : 'border-slate-600 hover:scale-105 hover:border-slate-400'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center pt-2 border-t border-slate-700">
            <Input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-9 p-1 border-0 cursor-pointer rounded-md"
            />
            <Input
              value={color}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 h-9 bg-slate-800 border-slate-600 text-sm text-slate-200 font-mono"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Toggle Button Component for better interactivity
interface ToggleOptionProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

const ToggleOption: React.FC<ToggleOptionProps> = ({ 
  label, 
  description, 
  checked, 
  onChange,
  icon 
}) => {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        checked 
          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' 
          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`${checked ? 'text-[#D4AF37]' : 'text-slate-500'}`}>
            {icon}
          </div>
        )}
        <div>
          <Label className={`text-sm font-medium cursor-pointer ${
            checked ? 'text-white' : 'text-slate-300'
          }`}>
            {label}
          </Label>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center px-1 ${
        checked ? 'bg-[#D4AF37]' : 'bg-slate-700'
      }`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </div>
    </div>
  );
};

interface ChartSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChartSettings;
  onUpdateSettings: (settings: ChartSettings) => void;
  onApplySettings: () => void;
}

export const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onApplySettings,
}) => {
  const [localSettings, setLocalSettings] = useState<ChartSettings>(settings);

  // Sync local state when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = useCallback(<K extends keyof ChartSettings>(
    key: K,
    value: ChartSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    onUpdateSettings(localSettings);
    onApplySettings();
    onOpenChange(false); // Close modal on apply
  }, [localSettings, onUpdateSettings, onApplySettings, onOpenChange]);

  const handleReset = useCallback(() => {
    setLocalSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1419] border-slate-700 text-white max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-[#D4AF37] text-lg">
            <Settings className="w-5 h-5" />
            Chart Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="candle" className="flex-1">
          <TabsList className="bg-slate-800/80 border border-slate-700 w-full grid grid-cols-3 gap-1 p-1">
            <TabsTrigger
              value="candle"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-slate-400 hover:text-white transition-all duration-200"
            >
              <CandlestickChart className="w-4 h-4 mr-2" />
              Candles
            </TabsTrigger>
            <TabsTrigger
              value="grid"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-slate-400 hover:text-white transition-all duration-200"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-slate-400 hover:text-white transition-all duration-200"
            >
              <Crosshair className="w-4 h-4 mr-2" />
              Display
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[320px] mt-4 pr-2">
            {/* Candle Tab */}
            <TabsContent value="candle" className="mt-0 space-y-5">
              {/* Candle Colors */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#D4AF37]" />
                  Candle Colors
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                      Bullish (Up)
                    </Label>
                    <ColorPicker
                      color={localSettings.upColor}
                      onChange={(c) => handleChange('upColor', c)}
                      label="Up Color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      Bearish (Down)
                    </Label>
                    <ColorPicker
                      color={localSettings.downColor}
                      onChange={(c) => handleChange('downColor', c)}
                      label="Down Color"
                    />
                  </div>
                </div>
              </div>

              {/* Price Marks */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Price Marks</h4>
                
                <div className="space-y-2">
                  <ToggleOption
                    label="Show High/Low Marks"
                    description="Display price labels at candle extremes"
                    checked={localSettings.showHighLowMarks}
                    onChange={(checked) => handleChange('showHighLowMarks', checked)}
                  />
                  
                  <ToggleOption
                    label="Show Last Price Line"
                    description="Horizontal line at current price"
                    checked={localSettings.showLastPriceLine}
                    onChange={(checked) => handleChange('showLastPriceLine', checked)}
                  />
                  
                  <ToggleOption
                    label="Show Volume"
                    description="Display volume bars below chart"
                    checked={localSettings.showVolume}
                    onChange={(checked) => handleChange('showVolume', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Grid Tab */}
            <TabsContent value="grid" className="mt-0 space-y-5">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-[#D4AF37]" />
                  Grid Options
                </h4>
                
                <div className="space-y-2">
                  <ToggleOption
                    label="Show Grid"
                    description="Enable background grid lines"
                    checked={localSettings.showGrid}
                    onChange={(checked) => handleChange('showGrid', checked)}
                    icon={<Grid3X3 className="w-4 h-4" />}
                  />
                  
                  {localSettings.showGrid && (
                    <div className="ml-4 pl-4 border-l-2 border-[#D4AF37]/30 space-y-2">
                      <ToggleOption
                        label="Horizontal Lines"
                        checked={localSettings.showHorizontalGrid}
                        onChange={(checked) => handleChange('showHorizontalGrid', checked)}
                      />
                      
                      <ToggleOption
                        label="Vertical Lines"
                        checked={localSettings.showVerticalGrid}
                        onChange={(checked) => handleChange('showVerticalGrid', checked)}
                      />
                      
                      <div className="pt-2">
                        <Label className="text-xs text-slate-400 mb-2 block">Grid Color</Label>
                        <ColorPicker
                          color={localSettings.gridColor}
                          onChange={(c) => handleChange('gridColor', c)}
                          label="Grid Color"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display" className="mt-0 space-y-5">
              {/* Crosshair */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#D4AF37]" />
                  Crosshair
                </h4>
                
                <div className="space-y-2">
                  <ToggleOption
                    label="Show Crosshair"
                    description="Display crosshair on mouse hover"
                    checked={localSettings.showCrosshair}
                    onChange={(checked) => handleChange('showCrosshair', checked)}
                    icon={<Crosshair className="w-4 h-4" />}
                  />
                  
                  {localSettings.showCrosshair && (
                    <div className="ml-4 pl-4 border-l-2 border-[#D4AF37]/30 pt-2">
                      <Label className="text-xs text-slate-400 mb-2 block">Crosshair Color</Label>
                      <ColorPicker
                        color={localSettings.crosshairColor}
                        onChange={(c) => handleChange('crosshairColor', c)}
                        label="Crosshair Color"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tooltip */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Tooltip</h4>
                
                <ToggleOption
                  label="Show OHLC Always"
                  description="Display candle values without hovering"
                  checked={localSettings.showTooltipAlways}
                  onChange={(checked) => handleChange('showTooltipAlways', checked)}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex gap-2 pt-4 border-t border-slate-700 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all duration-200"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-200"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export type { ChartSettings };
export { DEFAULT_SETTINGS };
export default ChartSettingsModal;
