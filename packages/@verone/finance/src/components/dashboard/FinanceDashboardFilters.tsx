'use client';

import { Badge, Button, Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { CalendarDays, Check, RefreshCw } from 'lucide-react';

import {
  ALL_YEARS_VALUE,
  AVAILABLE_YEARS,
  MONTHS,
  type FinanceFilters,
  formatFiltersLabel,
} from './finance-dashboard-utils';

interface IFinanceDashboardFiltersProps {
  filters: FinanceFilters;
  onYearChange: (year: string) => void;
  onMonthToggle: (month: number) => void;
  onClearMonths: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function FinanceDashboardFilters({
  filters,
  onYearChange,
  onMonthToggle,
  onClearMonths,
  onRefresh,
  loading,
}: IFinanceDashboardFiltersProps): React.ReactNode {
  const isAllTime = filters.year === ALL_YEARS_VALUE;
  const dateLabel = formatFiltersLabel(filters);

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pilotage</h1>
            <p className="text-sm text-gray-500">
              Vue d&apos;ensemble de votre activite financiere
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={String(filters.year)} onValueChange={onYearChange}>
              <TabsList className="bg-gray-100">
                <TabsTrigger
                  value={String(ALL_YEARS_VALUE)}
                  className="text-xs data-[state=active]:bg-rose-500 data-[state=active]:text-white px-4"
                >
                  Tout
                </TabsTrigger>
                {AVAILABLE_YEARS.map(year => (
                  <TabsTrigger
                    key={year}
                    value={String(year)}
                    className="text-xs data-[state=active]:bg-white px-3"
                  >
                    {year}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-600 border-gray-200"
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              {dateLabel}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Actualiser
            </Button>
          </div>

          {!isAllTime && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 mr-1">Mois:</span>
              {MONTHS.map(month => {
                const isSelected = filters.months.includes(month.value);
                return (
                  <button
                    key={month.value}
                    onClick={() => onMonthToggle(month.value)}
                    className={cn(
                      'text-xs px-2 py-1 rounded border transition-colors',
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                    {month.label}
                  </button>
                );
              })}
              {filters.months.length > 0 && (
                <button
                  onClick={onClearMonths}
                  className="text-xs text-rose-600 hover:underline ml-2"
                >
                  Tout effacer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
