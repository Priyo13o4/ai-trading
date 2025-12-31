/**
 * Chart Controls Component
 * 
 * Renders the timeframe selector, indicator menu, and other chart controls.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  showNewsMarkers,
  onToggleNews,
  showStrategy,
  onToggleStrategy,
  onResetZoom,
}) => {
  const currentTimeframe = TIMEFRAMES.find(tf => tf.value === timeframe);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      {/* Timeframe Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-orange-600/20 border-orange-500/50 text-orange-400 hover:bg-orange-600/30 min-w-[100px] justify-between"
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
                  ? 'bg-orange-600/20 text-orange-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{tf.label}</span>
                {timeframe === tf.value && <Check className="w-4 h-4 text-orange-400" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tool Buttons */}
      <div className="flex gap-2">
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

        {/* Indicators Menu */}
        <DropdownMenu open={showIndicatorPanel} onOpenChange={onIndicatorPanelChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Indicators
              {(activeOverlayCount + activeOscillatorCount) > 0 && (
                <Badge className="ml-2 bg-orange-500/20 text-orange-400 text-xs">
                  {activeOverlayCount + activeOscillatorCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0f1419] border-slate-700 w-64" align="end">
            {/* Overlay Indicators */}
            <DropdownMenuLabel className="text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Overlay Indicators
            </DropdownMenuLabel>
            {indicators.filter(i => i.category === 'overlay').map(indicator => (
              <DropdownMenuCheckboxItem
                key={indicator.id}
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="text-slate-200"
              >
                <div className="flex items-center gap-2 w-full">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: indicator.colors[0] }}
                  />
                  <span>{indicator.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Oscillator Indicators */}
            <DropdownMenuLabel className="text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Oscillators
            </DropdownMenuLabel>
            {indicators.filter(i => i.category === 'oscillator').map(indicator => (
              <DropdownMenuCheckboxItem
                key={indicator.id}
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="text-slate-200"
              >
                <div className="flex items-center gap-2 w-full">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: indicator.colors[0] }}
                  />
                  <span>{indicator.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChartControls;
