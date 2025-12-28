'use client';

/**
 * Composant Filtres Analytics LinkMe
 *
 * Filtrage avancé:
 * - "Tout" = toutes les données sans filtre
 * - OU sélectionner une année + un ou plusieurs mois
 *
 * @module AnalyticsDateFilter
 * @since 2025-12-17
 */

import { useCallback } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { CalendarDays, RefreshCw, Check } from 'lucide-react';
import { cn } from '@verone/utils';

// ============================================================================
// Types
// ============================================================================

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

// Valeur spéciale pour "Tout" (toutes les années)
export const ALL_YEARS_VALUE = 0;

export interface AnalyticsFilters {
  year: number; // 0 = Tout
  months: number[]; // 1-12, vide = tous les mois
}

// Nouvelle API (avec sélection de mois)
export interface AnalyticsDateFilterPropsNew {
  filters: AnalyticsFilters;
  availableYears: number[];
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// Ancienne API (legacy - pour rétrocompatibilité)
export interface AnalyticsDateFilterPropsLegacy {
  selectedYear: number;
  selectedPeriod: AnalyticsPeriod;
  availableYears: number[];
  onYearChange: (year: number) => void;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  dateRangeLabel?: string;
}

export type AnalyticsDateFilterProps =
  | AnalyticsDateFilterPropsNew
  | AnalyticsDateFilterPropsLegacy;

// Type guard pour distinguer les deux APIs
function isNewApi(
  props: AnalyticsDateFilterProps
): props is AnalyticsDateFilterPropsNew {
  return 'filters' in props;
}

// ============================================================================
// Config
// ============================================================================

const MONTHS = [
  { value: 1, label: 'Janv.', fullLabel: 'Janvier' },
  { value: 2, label: 'Févr.', fullLabel: 'Février' },
  { value: 3, label: 'Mars', fullLabel: 'Mars' },
  { value: 4, label: 'Avr.', fullLabel: 'Avril' },
  { value: 5, label: 'Mai', fullLabel: 'Mai' },
  { value: 6, label: 'Juin', fullLabel: 'Juin' },
  { value: 7, label: 'Juil.', fullLabel: 'Juillet' },
  { value: 8, label: 'Août', fullLabel: 'Août' },
  { value: 9, label: 'Sept.', fullLabel: 'Septembre' },
  { value: 10, label: 'Oct.', fullLabel: 'Octobre' },
  { value: 11, label: 'Nov.', fullLabel: 'Novembre' },
  { value: 12, label: 'Déc.', fullLabel: 'Décembre' },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calcule la plage de dates selon les filtres
 */
export function getDateRangeForFilters(filters: AnalyticsFilters): {
  startDate: Date | null;
  endDate: Date | null;
} {
  // Si "Tout" (year = 0), pas de filtrage de date
  if (filters.year === ALL_YEARS_VALUE) {
    return { startDate: null, endDate: null };
  }

  const year = filters.year;
  const months = filters.months;

  // Si aucun mois sélectionné, toute l'année
  if (months.length === 0) {
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }

  // Trouver le premier et dernier mois sélectionné
  const sortedMonths = [...months].sort((a, b) => a - b);
  const firstMonth = sortedMonths[0];
  const lastMonth = sortedMonths[sortedMonths.length - 1];

  // Dernier jour du dernier mois
  const lastDay = new Date(year, lastMonth, 0).getDate();

  return {
    startDate: new Date(year, firstMonth - 1, 1),
    endDate: new Date(year, lastMonth - 1, lastDay, 23, 59, 59),
  };
}

/**
 * Formate le label de la plage de dates
 */
export function formatFiltersLabel(filters: AnalyticsFilters): string {
  if (filters.year === ALL_YEARS_VALUE) {
    return 'Toutes les données';
  }

  if (filters.months.length === 0) {
    return `Année ${filters.year}`;
  }

  if (filters.months.length === 1) {
    const month = MONTHS.find(m => m.value === filters.months[0]);
    return `${month?.fullLabel} ${filters.year}`;
  }

  if (filters.months.length === 12) {
    return `Année ${filters.year}`;
  }

  // Plusieurs mois
  const sortedMonths = [...filters.months].sort((a, b) => a - b);
  const monthLabels = sortedMonths.map(
    m => MONTHS.find(mo => mo.value === m)?.label
  );
  return `${monthLabels.join(', ')} ${filters.year}`;
}

// Legacy exports for compatibility
export function getDateRangeForYearAndPeriod(
  year: number,
  period: AnalyticsPeriod
): { startDate: Date; endDate: Date } {
  const filters: AnalyticsFilters = { year, months: [] };
  const range = getDateRangeForFilters(filters);
  return {
    startDate: range.startDate || new Date(2024, 0, 1),
    endDate: range.endDate || new Date(),
  };
}

export function formatDateRangeLabel(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return `${startDate.toLocaleDateString('fr-FR', options)} - ${endDate.toLocaleDateString('fr-FR', options)}`;
}

// ============================================================================
// Component
// ============================================================================

export function AnalyticsDateFilter(props: AnalyticsDateFilterProps) {
  // Déterminer quelle API est utilisée
  if (isNewApi(props)) {
    return <AnalyticsDateFilterNew {...props} />;
  }
  return <AnalyticsDateFilterLegacy {...props} />;
}

// ============================================================================
// Nouvelle implémentation (avec sélection de mois)
// ============================================================================

function AnalyticsDateFilterNew({
  filters,
  availableYears,
  onFiltersChange,
  onRefresh,
  isLoading,
}: AnalyticsDateFilterPropsNew) {
  const isAllTime = filters.year === ALL_YEARS_VALUE;

  // Handler pour changer d'année
  const handleYearChange = useCallback(
    (yearStr: string) => {
      const newYear = Number(yearStr);
      // Reset months quand on change d'année
      onFiltersChange({ year: newYear, months: [] });
    },
    [onFiltersChange]
  );

  // Handler pour toggle un mois
  const handleMonthToggle = useCallback(
    (month: number) => {
      const currentMonths = filters.months;
      const newMonths = currentMonths.includes(month)
        ? currentMonths.filter(m => m !== month)
        : [...currentMonths, month];
      onFiltersChange({ year: filters.year, months: newMonths });
    },
    [filters.year, filters.months, onFiltersChange]
  );

  // Handler pour effacer tous les mois
  const handleClearMonths = useCallback(() => {
    onFiltersChange({ year: filters.year, months: [] });
  }, [filters.year, onFiltersChange]);

  const dateLabel = formatFiltersLabel(filters);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Year selector + Refresh button */}
      <div className="flex items-center gap-3">
        {/* Year Selector avec "Tout" en premier */}
        <Tabs value={String(filters.year)} onValueChange={handleYearChange}>
          <TabsList className="bg-gray-100">
            {/* Bouton "Tout" en premier */}
            <TabsTrigger
              value={String(ALL_YEARS_VALUE)}
              className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4"
            >
              Tout
            </TabsTrigger>
            {/* Années disponibles */}
            {availableYears.map(year => (
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

        {/* Date Range Badge */}
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-600 border-gray-200"
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          {dateLabel}
        </Badge>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      {/* Row 2: Month selector (hidden when "Tout" is selected) */}
      {!isAllTime && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Mois:</span>
          {MONTHS.map(month => {
            const isSelected = filters.months.includes(month.value);
            return (
              <button
                key={month.value}
                onClick={() => handleMonthToggle(month.value)}
                className={cn(
                  'text-xs px-2 py-1 rounded border transition-colors',
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                )}
              >
                {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                {month.label}
              </button>
            );
          })}
          {filters.months.length > 0 && (
            <button
              onClick={handleClearMonths}
              className="text-xs text-purple-600 hover:underline ml-2"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Ancienne implémentation (Legacy - pour rétrocompatibilité)
// ============================================================================

const PERIOD_CONFIG: Record<AnalyticsPeriod, { label: string; short: string }> =
  {
    week: { label: 'Semaine', short: '7j' },
    month: { label: 'Mois', short: '30j' },
    quarter: { label: 'Trimestre', short: '90j' },
    year: { label: 'Année', short: '365j' },
  };

function AnalyticsDateFilterLegacy({
  selectedYear,
  selectedPeriod,
  availableYears,
  onYearChange,
  onPeriodChange,
  dateRangeLabel,
}: AnalyticsDateFilterPropsLegacy) {
  return (
    <div className="flex items-center gap-3">
      {/* Year Selector */}
      <Tabs
        value={String(selectedYear)}
        onValueChange={v => onYearChange(Number(v))}
      >
        <TabsList className="bg-gray-100">
          {availableYears.map(year => (
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

      {/* Period Selector */}
      <Tabs
        value={selectedPeriod}
        onValueChange={v => onPeriodChange(v as AnalyticsPeriod)}
      >
        <TabsList className="bg-gray-100">
          {Object.entries(PERIOD_CONFIG).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-xs data-[state=active]:bg-white"
            >
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Date Range Badge */}
      {dateRangeLabel && (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-600 border-gray-200"
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          {dateRangeLabel}
        </Badge>
      )}
    </div>
  );
}
