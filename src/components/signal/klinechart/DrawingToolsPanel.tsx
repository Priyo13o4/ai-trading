/**
 * Drawing Tools Panel
 * 
 * Provides drawing tools similar to TradingView/MT5:
 * - Trend lines, rays, segments
 * - Horizontal/vertical lines
 * - Fibonacci retracement
 * - Price channels
 * - Annotations
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Minus,
  TrendingUp,
  ArrowRight,
  MoveHorizontal,
  MoveVertical,
  Grid3X3,
  Type,
  Trash2,
  MousePointer,
  Pencil,
  ChevronDown,
  Layers,
  X,
} from 'lucide-react';
import type { DrawingInfo } from './useDrawingManager';

// Drawing tool categories and their tools
export const DRAWING_TOOLS = {
  lines: {
    label: 'Lines',
    icon: Minus,
    tools: [
      { id: 'segment', name: 'Line Segment', icon: Minus, overlay: 'segment' },
      { id: 'rayLine', name: 'Ray Line', icon: ArrowRight, overlay: 'rayLine' },
      { id: 'straightLine', name: 'Extended Line', icon: TrendingUp, overlay: 'straightLine' },
    ],
  },
  horizontal: {
    label: 'Horizontal',
    icon: MoveHorizontal,
    tools: [
      { id: 'horizontalStraightLine', name: 'Horizontal Line', icon: MoveHorizontal, overlay: 'horizontalStraightLine' },
      { id: 'horizontalRayLine', name: 'Horizontal Ray', icon: ArrowRight, overlay: 'horizontalRayLine' },
      { id: 'horizontalSegment', name: 'Horizontal Segment', icon: Minus, overlay: 'horizontalSegment' },
      { id: 'priceLine', name: 'Price Line', icon: MoveHorizontal, overlay: 'priceLine' },
    ],
  },
  vertical: {
    label: 'Vertical',
    icon: MoveVertical,
    tools: [
      { id: 'verticalStraightLine', name: 'Vertical Line', icon: MoveVertical, overlay: 'verticalStraightLine' },
      { id: 'verticalRayLine', name: 'Vertical Ray', icon: ArrowRight, overlay: 'verticalRayLine' },
      { id: 'verticalSegment', name: 'Vertical Segment', icon: Minus, overlay: 'verticalSegment' },
    ],
  },
  fibonacci: {
    label: 'Fibonacci',
    icon: Grid3X3,
    tools: [
      { id: 'customFibonacci', name: 'Fibonacci Retracement', icon: Grid3X3, overlay: 'customFibonacci' },
    ],
  },
  channels: {
    label: 'Channels',
    icon: TrendingUp,
    tools: [
      { id: 'parallelStraightLine', name: 'Parallel Channel', icon: TrendingUp, overlay: 'parallelStraightLine' },
      { id: 'priceChannelLine', name: 'Price Channel', icon: TrendingUp, overlay: 'priceChannelLine' },
    ],
  },
  annotations: {
    label: 'Annotations',
    icon: Type,
    tools: [
      { id: 'simpleAnnotation', name: 'Text Annotation', icon: Type, overlay: 'simpleAnnotation' },
      { id: 'simpleTag', name: 'Price Tag', icon: Type, overlay: 'simpleTag' },
    ],
  },
};

export type DrawingToolId = string;

interface DrawingToolsPanelProps {
  activeTool: DrawingToolId | null;
  onToolSelect: (toolId: DrawingToolId | null) => void;
  onClearAll: () => void;
  drawingCount: number;
  drawings: DrawingInfo[];
  onRemoveDrawing: (drawingId: string) => void;
}

export const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
  activeTool,
  onToolSelect,
  onClearAll,
  drawingCount,
  drawings,
  onRemoveDrawing,
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showDrawingsList, setShowDrawingsList] = useState(false);

  const handleToolClick = useCallback((toolId: string) => {
    if (activeTool === toolId) {
      onToolSelect(null); // Deselect if clicking active tool
    } else {
      onToolSelect(toolId);
    }
    setOpenCategory(null);
  }, [activeTool, onToolSelect]);

  const getActiveToolName = () => {
    for (const category of Object.values(DRAWING_TOOLS)) {
      const tool = category.tools.find(t => t.id === activeTool);
      if (tool) return tool.name;
    }
    return null;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
        {/* Cursor/Select Mode */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToolSelect(null)}
              className={`h-8 w-8 p-0 ${
                activeTool === null 
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-700 text-xs">
            Select Mode
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-slate-700" />

        {/* Drawing Tool Categories */}
        {Object.entries(DRAWING_TOOLS).map(([categoryKey, category]) => {
          const CategoryIcon = category.icon;
          const isActiveCategory = category.tools.some(t => t.id === activeTool);
          
          return (
            <Popover 
              key={categoryKey} 
              open={openCategory === categoryKey}
              onOpenChange={(open) => setOpenCategory(open ? categoryKey : null)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 gap-1 ${
                        isActiveCategory 
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-800 border-slate-700 text-xs">
                  {category.label}
                </TooltipContent>
              </Tooltip>
              
              <PopoverContent 
                className="w-48 p-1 bg-slate-900 border-slate-700" 
                align="start"
                sideOffset={5}
              >
                <div className="space-y-0.5">
                  {category.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                          activeTool === tool.id
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <ToolIcon className="w-4 h-4" />
                        <span>{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}

        <div className="w-px h-6 bg-slate-700" />

        {/* Active Drawings List */}
        {drawingCount > 0 && (
          <Popover open={showDrawingsList} onOpenChange={setShowDrawingsList}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1 text-[#D4AF37] hover:text-[#E5C158] hover:bg-[#D4AF37]/10"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="text-xs">{drawingCount}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-700 text-xs">
                Active Drawings
              </TooltipContent>
            </Tooltip>
            
            <PopoverContent 
              className="w-56 p-0 bg-slate-900 border-slate-700" 
              align="start"
              sideOffset={5}
            >
              <div className="px-3 py-2 border-b border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Active Drawings ({drawingCount})</span>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="p-1">
                  {drawings.map((drawing) => (
                    <div
                      key={drawing.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded text-sm text-slate-300 hover:bg-slate-800 group"
                    >
                      <span className="truncate">{drawing.name}</span>
                      <button
                        onClick={() => onRemoveDrawing(drawing.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        title="Remove drawing"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-1 border-t border-slate-700">
                <button
                  onClick={() => {
                    onClearAll();
                    setShowDrawingsList(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All Drawings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={drawingCount === 0}
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-700 text-xs">
            Clear All Drawings {drawingCount > 0 && `(${drawingCount})`}
          </TooltipContent>
        </Tooltip>

        {/* Active Tool Indicator */}
        {activeTool && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#D4AF37]/10 rounded text-xs text-[#D4AF37] ml-1">
            <Pencil className="w-3 h-3" />
            <span className="hidden sm:inline">{getActiveToolName()}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DrawingToolsPanel;
