/**
 * Chart Controls Component
 * 
 * Renders the timeframe selector, indicator menu, and other chart controls.
 * Refactored to follow "Lumina" Cobalt & Brown aesthetic.
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
import { cn } from '@/lib/utils';

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
  strategyOptions: Array<{
    key: string;
    name: string;
    direction: 'long' | 'short';
    added_at: string;
  }>;
  selectedStrategyKey: string | null;
  onSelectStrategy: (strategyKey: string) => void;
  
  // Actions
  onResetZoom: () => void;
}

const formatAddedAtTime = (value: string): string => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown';
  return new Date(parsed).toLocaleTimeString();
};

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
  strategyOptions,
  selectedStrategyKey,
  onSelectStrategy,
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
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-5 p-2 sm:p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]  sa-scope">
      {/* Timeframe Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 sm:h-10 px-2.5 sm:px-4 bg-white/[0.03] border border-white/10 text-slate-200 hover:bg-white/[0.08] hover:text-white rounded-xl transition-all duration-300 min-w-[90px] sm:min-w-[110px] justify-between shadow-lg shadow-black/20"
          >
            <span className="font-semibold text-xs sm:text-sm tracking-wide">{currentTimeframe?.label || timeframe}</span>
            <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 ml-1.5 sm:ml-2 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#0b0c0e] border-[#E2B485]/20 w-44 z-50 sa-scope p-1.5 rounded-xl  shadow-2xl" 
          align="start" 
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase tracking-widest px-2 py-1.5 font-bold">Timeline</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#E2B485]/10 my-1" />
          {TIMEFRAMES.map(tf => (
            <DropdownMenuItem
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-2 m-0.5 transition-all text-sm font-medium",
                timeframe === tf.value
                  ? "bg-[#E2B485]/15 text-[#E2B485]"
                  : "text-slate-400 hover:bg-white/15 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span>{tf.label}</span>
                {timeframe === tf.value && <Check className="w-4 h-4 text-[#E2B485]" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tool Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* News Toggle (Cobalt Blue theme) */}
        <Button
          onClick={onToggleNews}
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-white/10 transition-all duration-300 flex items-center gap-2",
            showNewsMarkers
              ? "bg-blue-600/15 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10"
              : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-blue-300 hover:border-blue-500/20"
          )}
        >
          <Newspaper className={cn("w-4 h-4", showNewsMarkers && "animate-pulse")} />
          <span className="font-semibold text-[11px] sm:text-xs tracking-wider uppercase hidden xs:inline">News</span>
        </Button>

        {/* Strategy Toggle + Selector (Emerald theme) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-white/10 transition-all duration-300 flex items-center gap-2",
                showStrategy
                  ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-lg shadow-emerald-500/10"
                  : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-[#10B981] hover:border-emerald-500/20"
              )}
            >
              <Target className="w-4 h-4" />
              <span className="font-semibold text-[11px] sm:text-xs tracking-wider uppercase hidden xs:inline">Strategy</span>
              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0b0c0e] border-[#10B981]/25 w-72 p-1.5 rounded-xl shadow-2xl" align="start" sideOffset={8}>
            <DropdownMenuItem
              onClick={onToggleStrategy}
              className="cursor-pointer rounded-lg px-2 py-2 m-0.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold tracking-wide uppercase">Show Overlay</span>
                {showStrategy ? <Check className="w-4 h-4 text-[#10B981]" /> : null}
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase tracking-widest px-2 py-1.5 font-bold">Select Strategy</DropdownMenuLabel>

            {strategyOptions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-slate-500">No active strategies</div>
            ) : (
              strategyOptions.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => {
                    onSelectStrategy(option.key);
                  }}
                  className="cursor-pointer rounded-lg px-2 py-2 m-0.5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-100">{option.name}</p>
                      <p className="text-[10px] text-slate-500">{formatAddedAtTime(option.added_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded font-semibold uppercase',
                        option.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {option.direction}
                      </span>
                      {selectedStrategyKey === option.key ? <Check className="w-4 h-4 text-[#10B981]" /> : null}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-white/15 mx-1.5 hidden sm:block" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
            {/* Reset Zoom */}
            <Button
            onClick={onResetZoom}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-inner"
            title="Reset zoom"
            >
            <Maximize2 className="w-4.5 h-4.5" />
            </Button>

            {/* Chart Settings */}
            <Button
            onClick={onOpenChartSettings}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-inner"
            title="Chart settings"
            >
            <Settings className="w-4.5 h-4.5" />
            </Button>
        </div>

        {/* Indicators Menu (Brown theme) */}
        <DropdownMenu open={showIndicatorPanel} onOpenChange={(open) => {
          onIndicatorPanelChange(open);
          if (!open) setSearchQuery('');
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-[#E2B485] hover:border-[#E2B485]/30 transition-all duration-300",
                (activeOverlayCount + activeOscillatorCount) > 0 && "text-[#E2B485] border-[#E2B485]/40"
              )}
            >
              <Settings2 className="w-4 sm:w-4.5 h-4 sm:h-4.5 mr-1.5 sm:mr-2" />
              <span className="font-semibold text-[11px] sm:text-xs tracking-wider uppercase hidden xs:inline">Indicators</span>
              {(activeOverlayCount + activeOscillatorCount) > 0 && (
                <Badge className="ml-1 sm:ml-2.5 bg-[#E2B485] text-black text-[9px] sm:text-[10px] font-black h-4 sm:h-4.5 min-w-4 sm:min-w-4.5 px-0.5 sm:px-1 rounded-md shadow-lg shadow-[#E2B485]/20 border-0">
                  {activeOverlayCount + activeOscillatorCount}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-1.5 sm:ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0b0c0e] border-[#E2B485]/20 w-72 p-0 sa-scope rounded-xl shadow-2xl overflow-hidden" align="end" sideOffset={8}>
            {/* Search Input */}
            <div className="p-3 bg-white/[0.02] border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Indicator search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  autoFocus
                  className="pl-9 h-9 bg-black/40 border-white/5 text-sm text-[#E2B485] placeholder:text-slate-600 focus:border-[#E2B485]/40 focus:ring-0 rounded-lg"
                />
              </div>
            </div>

            {/* Scrollable indicator list */}
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-4">
                {/* Overlay Indicators */}
                {filteredOverlay.length > 0 && (
                  <div className="space-y-1">
                    <DropdownMenuLabel className="px-2 text-slate-500 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">
                      <Layers className="w-3 h-3" />
                      Overlays
                    </DropdownMenuLabel>
                    {filteredOverlay.map(indicator => (
                      <div key={indicator.id} className="flex items-center group px-1">
                        <DropdownMenuCheckboxItem
                          checked={indicator.enabled}
                          onCheckedChange={() => onToggleIndicator(indicator.id)}
                          className="text-slate-300 hover:bg-white/15 hover:text-[#E2B485] flex-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                              style={{ backgroundColor: indicator.colors[0] }}
                            />
                            <span className="font-medium text-xs">{indicator.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIndicatorSettings(indicator.id);
                          }}
                          className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#E2B485] transition-all"
                        >
                          <Cog className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Oscillator Indicators */}
                {filteredOscillator.length > 0 && (
                  <div className="space-y-1">
                    <DropdownMenuLabel className="px-2 text-slate-500 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">
                      <Activity className="w-3 h-3" />
                      Oscillators
                    </DropdownMenuLabel>
                    {filteredOscillator.map(indicator => (
                      <div key={indicator.id} className="flex items-center group px-1">
                        <DropdownMenuCheckboxItem
                          checked={indicator.enabled}
                          onCheckedChange={() => onToggleIndicator(indicator.id)}
                          className="text-slate-300 hover:bg-white/15 hover:text-[#E2B485] flex-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                              style={{ backgroundColor: indicator.colors[0] }}
                            />
                            <span className="font-medium text-xs">{indicator.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIndicatorSettings(indicator.id);
                          }}
                          className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#E2B485] transition-all"
                        >
                          <Cog className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {filteredOverlay.length === 0 && filteredOscillator.length === 0 && (
                  <div className="p-8 text-center text-slate-600 text-sm italic font-medium">
                    No results found
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Customize Button at bottom */}
            <div className="p-2 bg-white/[0.02] border-t border-white/5">
              <DropdownMenuItem
                onClick={() => onOpenIndicatorSettings()}
                className="text-[#E2B485] bg-[#E2B485]/10 hover:bg-[#E2B485]/20 hover:text-white rounded-lg h-10 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 mr-3" />
                Customize Indicators
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChartControls;
