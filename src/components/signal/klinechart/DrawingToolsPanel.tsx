/**
 * Drawing Tools Panel
 * 
 * Provides drawing tools with "Lumina" premium styling.
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
  Check,
} from 'lucide-react';
import type { DrawingInfo } from './useDrawingManager';
import { cn } from '@/lib/utils';

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
      <div className="flex w-full overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 bg-white/[0.04] border border-white/10 rounded-2xl p-1.5 sm:p-2 mb-3 sm:mb-4 backdrop-blur-md sa-scope no-scrollbar shadow-2xl shadow-black/40">
        {/* Cursor/Select Mode */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToolSelect(null)}
              className={cn(
                "h-9 w-9 rounded-xl transition-all duration-300",
                activeTool === null 
                  ? 'bg-[#E2B485]/15 text-[#E2B485] border border-[#E2B485]/40 shadow-lg shadow-[#E2B485]/10' 
                  : 'text-slate-500 hover:text-white hover:bg-white/10'
              )}
            >
              <MousePointer className="w-4.5 h-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0b0c0e] border-[#E2B485]/20 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1">
            Select Mode
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-white/5 mx-1" />

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
                      className={cn(
                        "h-9 px-3 gap-1.5 rounded-xl transition-all duration-300 transition-all",
                        isActiveCategory 
                          ? 'bg-[#E2B485]/15 text-[#E2B485] border border-[#E2B485]/40 shadow-lg shadow-[#E2B485]/10' 
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <CategoryIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-[#0b0c0e] border-[#E2B485]/20 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1">
                  {category.label}
                </TooltipContent>
              </Tooltip>
              
              <PopoverContent 
                className="w-56 p-1.5 bg-[#0b0c0e] border-[#E2B485]/20 sa-scope rounded-xl shadow-2xl backdrop-blur-xl" 
                align="start"
                sideOffset={8}
              >
                <div className="space-y-1">
                  {category.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 font-medium",
                          isActive
                            ? 'bg-[#E2B485]/20 text-[#E2B485] shadow-inner font-bold'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <ToolIcon className="w-4 h-4 opacity-70" />
                        <span>{tool.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}

        <div className="w-px h-6 bg-white/5 mx-1" />

        <div className="ml-auto flex items-center gap-2">
            {/* Active Drawings List */}
            {drawingCount > 0 && (
            <Popover open={showDrawingsList} onOpenChange={setShowDrawingsList}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 gap-2 rounded-xl bg-[#E2B485]/10 text-[#E2B485] border border-[#E2B485]/20 hover:bg-[#E2B485]/20"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="text-xs font-black">{drawingCount}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-[#0b0c0e] border-[#E2B485]/20 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1">
                    Layer Manager
                </TooltipContent>
                </Tooltip>
                
                <PopoverContent 
                className="w-64 p-0 bg-[#0b0c0e] border-[#E2B485]/20 sa-scope rounded-xl shadow-2xl" 
                align="end"
                sideOffset={8}
                >
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active layers ({drawingCount})</span>
                </div>
                <ScrollArea className="max-h-[300px]">
                    <div className="p-2 space-y-1">
                    {drawings.map((drawing) => (
                        <div
                        key={drawing.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-white/[0.01] hover:bg-white/5 border border-transparent hover:border-white/5 group transition-all"
                        >
                        <div className="flex items-center gap-3 truncate">
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            <span className="truncate">{drawing.name}</span>
                        </div>
                        <button
                            onClick={() => onRemoveDrawing(drawing.id)}
                            className="p-1 px-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-all text-[10px] font-bold uppercase"
                            title="Remove layer"
                        >
                            Delete
                        </button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t border-white/5 bg-black/40">
                    <button
                    onClick={() => {
                        onClearAll();
                        setShowDrawingsList(false);
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 px-3 rounded-lg text-xs font-black uppercase tracking-widest text-rose-500/70 hover:bg-rose-500/15 hover:text-rose-400 transition-all border border-rose-500/10"
                    >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Workspace</span>
                    </button>
                </div>
                </PopoverContent>
            </Popover>
            )}

            {/* Clear All Drawings (Quick Action) */}
            <Tooltip>
            <TooltipTrigger asChild>
                <Button
                variant="ghost"
                size="icon"
                onClick={onClearAll}
                disabled={drawingCount === 0}
                className="h-9 w-9 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 transition-all shadow-inner"
                >
                <Trash2 className="w-4 h-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#0b0c0e] border-[#E2B485]/20 text-rose-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1">
                Clear All
            </TooltipContent>
            </Tooltip>
        </div>

        {/* Active Tool Label */}
        {activeTool && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#E2B485]/15 border border-[#E2B485]/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#E2B485] ml-2 animate-in fade-in slide-in-from-left-2 shadow-lg shadow-[#E2B485]/10 group">
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{getActiveToolName()}</span>
            <X 
              className="w-3.5 h-3.5 ml-1.5 opacity-50 hover:opacity-100 cursor-pointer" 
              onClick={() => onToolSelect(null)}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DrawingToolsPanel;
