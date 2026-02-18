/**
 * Chart Controls Component
 * 
 * Renders the timeframe selector, indicator menu, and other chart controls.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Newspaper,
  Maximize2,
  ChevronDown,
  Settings2,
  Activity,
  Layers,
  Target,
  Check,
  SlidersHorizontal,
  Settings,
  Search,
  Cog,
} from 'lucide-react';
import type { IndicatorConfig } from './types';
import { TIMEFRAMES } from './constants';

interface ChartControlsProps {
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  
  // Indicator controls
  indicators: IndicatorConfig[];
  onToggleIndicator: (indicatorId: string) => void;
  showIndicatorPanel: boolean;
  onIndicatorPanelChange: (open: boolean) => void;
  activeOverlayCount: number;
  activeOscillatorCount: number;
  onOpenIndicatorSettings: (indicatorId?: string) => void;
  
  // Chart settings
  onOpenChartSettings: () => void;
  
  // News controls
  showNewsMarkers: boolean;
  onToggleNews: () => void;
  
  // Strategy controls
  showStrategy: boolean;
  onToggleStrategy: () => void;
  
  // Actions
  onResetZoom: () => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  timeframe,
  onTimeframeChange,
  indicators,
  onToggleIndicator,
  showIndicatorPanel,
  onIndicatorPanelChange,
  activeOverlayCount,
  activeOscillatorCount,
  onOpenIndicatorSettings,
  onOpenChartSettings,
  showNewsMarkers,
  onToggleNews,
  showStrategy,
  onToggleStrategy,
  onResetZoom,
}) => {
  const currentTimeframe = TIMEFRAMES.find(tf => tf.value === timeframe);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter indicators based on search query
  const filteredOverlay = indicators.filter(
    i => i.category === 'overlay' && 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOscillator = indicators.filter(
    i => i.category === 'oscillator' && 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      {/* Timeframe Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 min-w-[100px] justify-between"
          >
            <span className="font-medium">{currentTimeframe?.label || timeframe}</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#0f1419] border-slate-700 w-36 z-50" 
          align="start" 
          sideOffset={5}
        >
          <DropdownMenuLabel className="text-slate-400 text-xs">Timeframe</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          {TIMEFRAMES.map(tf => (
            <DropdownMenuItem
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={`cursor-pointer ${
                timeframe === tf.value
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{tf.label}</span>
                {timeframe === tf.value && <Check className="w-4 h-4 text-[#D4AF37]" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tool Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* News Toggle */}
        <Button
          onClick={onToggleNews}
          variant="outline"
          size="sm"
          className={`${
            showNewsMarkers
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 hover:bg-blue-600/30'
              : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4 mr-2" />
          News
        </Button>

        {/* Strategy Toggle */}
        <Button
          onClick={onToggleStrategy}
          variant="outline"
          size="sm"
          className={`${
            showStrategy
              ? 'bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600/30'
              : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 mr-2" />
          Strategy
        </Button>

        {/* Reset Zoom */}
        <Button
          onClick={onResetZoom}
          variant="outline"
          size="sm"
          className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
          title="Reset zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {/* Chart Settings */}
        <Button
          onClick={onOpenChartSettings}
          variant="outline"
          size="sm"
          className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
          title="Chart settings"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* Indicators Menu */}
        <DropdownMenu open={showIndicatorPanel} onOpenChange={(open) => {
          onIndicatorPanelChange(open);
          if (!open) setSearchQuery('');
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Indicators
              {(activeOverlayCount + activeOscillatorCount) > 0 && (
                <Badge className="ml-2 bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                  {activeOverlayCount + activeOscillatorCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0f1419] border-slate-700 w-64 p-0" align="end">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search indicators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  autoFocus
                  className="pl-8 h-8 bg-slate-800/50 border-slate-600 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            {/* Scrollable indicator list */}
            <ScrollArea className="h-[280px]">
              <div className="p-1">
                {/* Overlay Indicators */}
                {filteredOverlay.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-slate-400 flex items-center gap-2 text-xs">
                      <Layers className="w-3 h-3" />
                      Overlay Indicators
                    </DropdownMenuLabel>
                    {filteredOverlay.map(indicator => (
                      <div key={indicator.id} className="flex items-center group">
                        <DropdownMenuCheckboxItem
                          checked={indicator.enabled}
                          onCheckedChange={() => onToggleIndicator(indicator.id)}
                          className="text-slate-200 hover:bg-slate-600/50 hover:text-white flex-1 pr-1"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: indicator.colors[0] }}
                            />
                            <span>{indicator.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIndicatorSettings(indicator.id);
                          }}
                          className="p-1.5 mr-1 rounded hover:bg-[#D4AF37]/20 text-slate-400 hover:text-[#D4AF37] transition-colors opacity-0 group-hover:opacity-100"
                          title={`Configure ${indicator.name}`}
                        >
                          <Cog className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <DropdownMenuSeparator className="bg-slate-700" />
                  </>
                )}

                {/* Oscillator Indicators */}
                {filteredOscillator.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-slate-400 flex items-center gap-2 text-xs">
                      <Activity className="w-3 h-3" />
                      Oscillators
                    </DropdownMenuLabel>
                    {filteredOscillator.map(indicator => (
                      <div key={indicator.id} className="flex items-center group">
                        <DropdownMenuCheckboxItem
                          checked={indicator.enabled}
                          onCheckedChange={() => onToggleIndicator(indicator.id)}
                          className="text-slate-200 hover:bg-slate-600/50 hover:text-white flex-1 pr-1"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: indicator.colors[0] }}
                            />
                            <span>{indicator.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIndicatorSettings(indicator.id);
                          }}
                          className="p-1.5 mr-1 rounded hover:bg-[#D4AF37]/20 text-slate-400 hover:text-[#D4AF37] transition-colors opacity-0 group-hover:opacity-100"
                          title={`Configure ${indicator.name}`}
                        >
                          <Cog className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* No results */}
                {filteredOverlay.length === 0 && filteredOscillator.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No indicators found
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Customize Button at bottom */}
            <div className="p-1 border-t border-slate-700 bg-[#0f1419]">
              <DropdownMenuItem
                onClick={() => onOpenIndicatorSettings()}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:text-[#E5C158] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Customize Indicators...
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChartControls;
