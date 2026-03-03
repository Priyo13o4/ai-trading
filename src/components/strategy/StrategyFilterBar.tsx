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
  onRefresh: () => void;
  loading?: boolean;
}

const statusOptions: Array<{ value: StrategyStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'executed', label: 'Executed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'invalidated', label: 'Invalidated' },
  { value: 'closed', label: 'Closed' },
];

const directionOptions: Array<{ value: StrategyDirection | 'all'; label: string }> = [
  { value: 'all', label: 'All directions' },
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

export function StrategyFilterBar({
  filters,
  availableSymbols,
  onFiltersChange,
  onRefresh,
  loading = false,
}: StrategyFilterBarProps) {
  return (
    <section className="sa-card rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
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
          <SelectTrigger className="sa-input h-10">
            <SelectValue placeholder="All symbols" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All symbols</SelectItem>
            {availableSymbols.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
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
            <SelectTrigger className="sa-input h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
            <SelectTrigger className="sa-input h-10">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              {directionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="sa-btn-neutral h-10"
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}

export default StrategyFilterBar;
