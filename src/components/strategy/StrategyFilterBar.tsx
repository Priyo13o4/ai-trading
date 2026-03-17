import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StrategyDirection, StrategyFilters, StrategyStatus } from '@/types/strategy';

interface StrategyFilterBarProps {
  filters: StrategyFilters;
  availableSymbols: string[];
  onFiltersChange: (next: StrategyFilters) => void;
  loading?: boolean;
}

const defaultFilters: StrategyFilters = {
  search: '',
  symbol: 'all',
  status: 'all',
  direction: 'all',
};

const statusOptions: Array<{ value: StrategyStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Live' },
  { value: 'pending', label: 'Awaiting trigger' },
  { value: 'executed', label: 'Executed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'invalidated', label: 'Invalidated' },
  { value: 'closed', label: 'Closed' },
];

const directionOptions: Array<{ value: StrategyDirection | 'all'; label: string }> = [
  { value: 'all', label: 'Any direction' },
  { value: 'long', label: 'Long (bullish)' },
  { value: 'short', label: 'Short (bearish)' },
];

const strategySelectContentClass =
  'z-[90] border-[#C8935A]/35 bg-[#111315]/98 text-slate-100 shadow-[0_18px_45px_rgba(2,6,23,0.78)] backdrop-blur-xl';

const strategySelectItemClass =
  'text-slate-100 data-[state=checked]:text-[#E2B485] focus:bg-[#2a2118] focus:text-[#F4D4AF]';

export function StrategyFilterBar({
  filters,
  availableSymbols,
  onFiltersChange,
  loading = false,
}: StrategyFilterBarProps) {
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.symbol !== 'all' ||
    filters.status !== 'all' ||
    filters.direction !== 'all';

  return (
    <section className="lumina-card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#E2B485]">
        <SlidersHorizontal className="h-4 w-4" />
        Filter strategies
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder="Search strategy, symbol, mode"
            className="sa-input h-10 pl-9"
          />
        </div>

        <Select
          value={filters.symbol}
          onValueChange={(value) => onFiltersChange({ ...filters, symbol: value })}
        >
          <SelectTrigger className="sa-input h-10 text-slate-100 data-[placeholder]:text-slate-400">
            <SelectValue placeholder="All symbols" />
          </SelectTrigger>
          <SelectContent className={strategySelectContentClass}>
            <SelectItem className={strategySelectItemClass} value="all">All symbols</SelectItem>
            {availableSymbols.map((symbol) => (
              <SelectItem className={strategySelectItemClass} key={symbol} value={symbol}>
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value as StrategyStatus | 'all' })
            }
          >
            <SelectTrigger className="sa-input h-10 text-slate-100 data-[placeholder]:text-slate-400">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={strategySelectContentClass}>
              {statusOptions.map((option) => (
                <SelectItem className={strategySelectItemClass} key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.direction}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, direction: value as StrategyDirection | 'all' })
            }
          >
            <SelectTrigger className="sa-input h-10 text-slate-100 data-[placeholder]:text-slate-400">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent className={strategySelectContentClass}>
              {directionOptions.map((option) => (
                <SelectItem className={strategySelectItemClass} key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="sa-btn-neutral h-10"
            onClick={() => onFiltersChange(defaultFilters)}
            disabled={!hasActiveFilters || loading}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </section>
  );
}

export default StrategyFilterBar;
