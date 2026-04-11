/**
 * Chart Settings Modal
 * 
 * "Lumina" Theme Chart Customization Control.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Zap,
  BarChart3,
  MousePointer2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#22C55E', // Green (bullish)
  '#EF4444', // Red (bearish)
  '#E2B485', // Brown accent
  '#3B82F6', // Cobalt
  '#A855F7', // Purple
  '#FF7000', // Warning Orange
  '#06B6D4', // Cyan
  '#FFFFFF', // White
  '#111315', // Dark Onyx
  '#1a1d21', // Secondary Dark
];

interface ChartSettings {
  upColor: string;
  downColor: string;
  showHighLowMarks: boolean;
  showLastPriceLine: boolean;
  showGrid: boolean;
  showHorizontalGrid: boolean;
  showVerticalGrid: boolean;
  gridColor: string;
  showCrosshair: boolean;
  crosshairColor: string;
  showVolume: boolean;
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
  crosshairColor: '#3B82F6', // Cobalt crosshair
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
          className="w-full h-11 justify-start gap-4 bg-white/[0.04] border border-white/10 hover:border-[#E2B485]/50 transition-all rounded-xl shadow-lg hover:bg-white/[0.08]"
        >
          <div
            className="w-6 h-6 rounded-lg border-2 border-white/20 shadow-xl"
            style={{ backgroundColor: color }}
          />
          <span className="text-slate-300 text-xs font-mono font-bold tracking-widest">{label || color.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-68 bg-[#0b0c0e] border-[#E2B485]/20 p-4 rounded-2xl sa-scope shadow-2xl ">
        <div className="space-y-4">
          <Label className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-2">Palette Selection</Label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all group overflow-hidden",
                    color === c ? "border-[#E2B485] shadow-[0_0_15px_rgba(226,180,133,0.3)] scale-110" : "border-white/10 hover:scale-105 hover:border-white/30"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-5 h-5 text-black m-auto" />}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-white/5 flex gap-2">
            <Input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-12 h-10 p-1 bg-transparent border-0 cursor-pointer" />
            <Input value={color} onChange={(e) => onChange(e.target.value)} className="flex-1 h-10 bg-white/15 border-white/10 text-xs font-mono text-[#E2B485] focus:ring-0 focus:border-[#E2B485]/40 rounded-lg" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
        checked 
          ? 'bg-[#E2B485]/10 border-[#E2B485]/30 shadow-lg shadow-[#E2B485]/5 animate-in fade-in duration-500' 
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
            "p-2 rounded-xl transition-colors shrink-0",
            checked ? "bg-[#E2B485]/15 text-[#E2B485]" : "bg-white/15 text-slate-600"
        )}>
            {icon || <Zap className="w-4.5 h-4.5" />}
        </div>
        <div>
          <Label className={cn("text-sm font-black uppercase tracking-wider block cursor-pointer transition-colors", checked ? "text-white" : "text-slate-400")}>
            {label}
          </Label>
          {description && (
            <p className="text-[10px] font-bold text-slate-600 tracking-wide mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className={cn(
        "w-12 h-6 rounded-full transition-all flex items-center p-1",
        checked ? "bg-[#E2B485]" : "bg-white/10"
      )}>
        <div className={cn(
          "w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-300",
          checked ? "translate-x-6" : "translate-x-0"
        )} />
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

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleApply = useCallback(() => {
    onUpdateSettings(localSettings);
    onApplySettings();
    onOpenChange(false);
  }, [localSettings, onUpdateSettings, onApplySettings, onOpenChange]);

  const handleChange = <K extends keyof ChartSettings>(key: K, val: ChartSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: val }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sa-news-dialog sa-scope max-w-2xl max-h-[90vh] p-0 overflow-hidden rounded-[2.5rem] border-[#E2B485]/40 shadow-2xl bg-black">
        <div className="bg-gradient-to-br from-[#0b0c0e] to-[#111315] p-8 h-full flex flex-col">
          <DialogHeader className="mb-8 flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#E2B485]/20 rounded-2xl border border-[#E2B485]/30">
                    <Settings className="w-7 h-7 text-[#E2B485]" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Terminal Customizer</h2>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mt-1">Lumina View Settings</span>
                </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="candle" className="flex-1 flex flex-col gap-8">
            <TabsList className="bg-white/[0.03] border border-white/5 h-16 p-2 rounded-2xl gap-2">
                {[
                    { val: 'candle', lab: 'Canvas', icon: CandlestickChart },
                    { val: 'grid', lab: 'Architecture', icon: Grid3X3 },
                    { val: 'display', lab: 'UX/Interaction', icon: Crosshair },
                ].map((t) => (
                    <TabsTrigger 
                        key={t.val} 
                        value={t.val} 
                        className="flex-1 h-full rounded-xl data-[state=active]:bg-[#E2B485] data-[state=active]:text-[#111315] text-[#E2B485]/50 hover:text-white transition-all font-black uppercase text-[11px] tracking-widest gap-2.5"
                    >
                        <t.icon className="w-4.5 h-4.5 shrink-0" />
                        {t.lab}
                    </TabsTrigger>
                ))}
            </TabsList>

            <ScrollArea className="flex-1 pr-6 -mr-6">
                <TabsContent value="candle" className="mt-0 space-y-8 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#10B981] flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> Bullish Pulse
                            </Label>
                            <ColorPicker color={localSettings.upColor} onChange={(c) => handleChange('upColor', c)} />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#F43F5E] flex items-center gap-2">
                                <TrendingDown className="w-3.5 h-3.5" /> Bearish Void
                            </Label>
                            <ColorPicker color={localSettings.downColor} onChange={(c) => handleChange('downColor', c)} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <ToggleOption label="Thermal Labeling" icon={<BarChart3 className="w-4.5 h-4.5" />} description="Automatic HIGH/LOW extreme labeling" checked={localSettings.showHighLowMarks} onChange={(c) => handleChange('showHighLowMarks', c)} />
                        <ToggleOption label="Real-time Price Engine" icon={<Zap className="w-4.5 h-4.5" />} description="Active ticker line tracing market movement" checked={localSettings.showLastPriceLine} onChange={(c) => handleChange('showLastPriceLine', c)} />
                        <ToggleOption label="Volume Metrics" icon={<BarChart3 className="w-4.5 h-4.5" />} description="Integrated trading volume sub-panel" checked={localSettings.showVolume} onChange={(c) => handleChange('showVolume', c)} />
                    </div>
                </TabsContent>

                <TabsContent value="grid" className="mt-0 space-y-6 pb-4">
                    <ToggleOption label="Global Grid Engine" icon={<Grid3X3 className="w-4.5 h-4.5" />} description="Enable background coordinate mapping" checked={localSettings.showGrid} onChange={(c) => handleChange('showGrid', c)} />
                    {localSettings.showGrid && (
                        <div className="ml-6 pl-8 border-l-3 border-[#E2B485]/20 grid grid-cols-1 gap-4 py-2 animate-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <Grid3X3 className="w-5 h-5 text-slate-700" />
                                <div className="flex-1 flex gap-2">
                                    <Button variant="ghost" onClick={() => handleChange('showHorizontalGrid', !localSettings.showHorizontalGrid)} className={cn("flex-1 text-[10px] font-black uppercase tracking-wider rounded-xl", localSettings.showHorizontalGrid ? "bg-[#E2B485]/15 text-[#E2B485]" : "bg-white/15 text-slate-600")}>Horizontal</Button>
                                    <Button variant="ghost" onClick={() => handleChange('showVerticalGrid', !localSettings.showVerticalGrid)} className={cn("flex-1 text-[10px] font-black uppercase tracking-wider rounded-xl", localSettings.showVerticalGrid ? "bg-[#E2B485]/15 text-[#E2B485]" : "bg-white/15 text-slate-600")}>Vertical</Button>
                                </div>
                            </div>
                            <ColorPicker label="Coordinate Style" color={localSettings.gridColor} onChange={(c) => handleChange('gridColor', c)} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="display" className="mt-0 space-y-6 pb-4">
                    <ToggleOption label="Precision Crosshair" icon={<MousePointer2 className="w-4.5 h-4.5" />} description="Tactile coordinate tracking on hover" checked={localSettings.showCrosshair} onChange={(c) => handleChange('showCrosshair', c)} />
                    {localSettings.showCrosshair && (
                        <div className="ml-6 pl-8 border-l-3 border-[#E2B485]/20 animate-in slide-in-from-left-4 duration-500">
                             <ColorPicker label="Tracking Chroma" color={localSettings.crosshairColor} onChange={(c) => handleChange('crosshairColor', c)} />
                        </div>
                    )}
                    <ToggleOption label="Infinite Telemetry" icon={<BarChart3 className="w-4.5 h-4.5" />} description="Always display detailed candle data" checked={localSettings.showTooltipAlways} onChange={(c) => handleChange('showTooltipAlways', c)} />
                </TabsContent>
            </ScrollArea>

            <div className="flex gap-4 pt-4 border-t border-white/5">
                <Button variant="outline" onClick={() => setLocalSettings(DEFAULT_SETTINGS)} className="h-14 px-8 rounded-2xl bg-white/15 border border-white/10 text-slate-500 font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                    Factory Reset
                </Button>
                <Button variant="ghost" onClick={handleApply} className="flex-1 h-14 rounded-2xl bg-[#E2B485] hover:bg-[#C8935A] text-[#111315] hover:text-[#111315] font-black uppercase tracking-widest hover:scale-[1.02] shadow-2xl shadow-[#E2B485]/20 transition-all">
                    Apply Synthesis
                </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export type { ChartSettings };
export { DEFAULT_SETTINGS };
export default ChartSettingsModal;
