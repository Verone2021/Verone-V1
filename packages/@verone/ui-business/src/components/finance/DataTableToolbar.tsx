'use client';

import * as React from 'react';

import { Button } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Download,
  RefreshCw,
  X,
  Calendar,
} from 'lucide-react';

/**
 * Option de filtre pour la toolbar (renommé pour éviter conflit avec FilterCombobox)
 */
export interface ToolbarFilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Configuration d'un filtre pour la toolbar
 */
export interface ToolbarFilterConfig {
  id: string;
  label: string;
  options: ToolbarFilterOption[];
  multiple?: boolean;
}

/**
 * Props pour le composant DataTableToolbar
 */
export interface DataTableToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Valeur de recherche */
  searchValue?: string;
  /** Callback changement recherche */
  onSearchChange?: (value: string) => void;
  /** Placeholder de recherche */
  searchPlaceholder?: string;
  /** Filtres disponibles */
  filters?: ToolbarFilterConfig[];
  /** Valeurs des filtres actifs */
  activeFilters?: Record<string, string | string[]>;
  /** Callback changement filtre */
  onFilterChange?: (filterId: string, value: string | string[]) => void;
  /** Callback reset filtres */
  onResetFilters?: () => void;
  /** Callback refresh */
  onRefresh?: () => void;
  /** Callback export */
  onExport?: () => void;
  /** Actions personnalisées à droite */
  actions?: React.ReactNode;
  /** Afficher le compteur de résultats */
  resultCount?: number;
  /** En cours de chargement */
  loading?: boolean;
  /** Mode compact */
  compact?: boolean;
}

/**
 * Compte le nombre de filtres actifs
 */
function countActiveFilters(
  activeFilters?: Record<string, string | string[]>
): number {
  if (!activeFilters) return 0;
  return Object.values(activeFilters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v && v !== 'all'
  ).length;
}

/**
 * Composant DataTableToolbar - Barre d'outils pour tables de données
 *
 * @example
 * <DataTableToolbar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={[
 *     { id: 'status', label: 'Statut', options: [...] },
 *     { id: 'type', label: 'Type', options: [...] }
 *   ]}
 *   activeFilters={filters}
 *   onFilterChange={handleFilter}
 *   onRefresh={refetch}
 * />
 */
export function DataTableToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filters = [],
  activeFilters = {},
  onFilterChange,
  onResetFilters,
  onRefresh,
  onExport,
  actions,
  resultCount,
  loading = false,
  compact = false,
  className,
  ...props
}: DataTableToolbarProps) {
  const activeFilterCount = countActiveFilters(activeFilters);
  const hasActiveFilters = activeFilterCount > 0 || searchValue.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        compact && 'gap-2',
        className
      )}
      {...props}
    >
      {/* Gauche: Recherche + Filtres */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Barre de recherche */}
        {onSearchChange && (
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className={cn('pl-8', compact ? 'h-8' : 'h-9')}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Filtres rapides (Select) */}
        {filters.slice(0, 3).map(filter => (
          <Select
            key={filter.id}
            value={
              (activeFilters[filter.id] as string) ||
              (filter.multiple ? undefined : 'all')
            }
            onValueChange={value => onFilterChange?.(filter.id, value)}
          >
            <SelectTrigger
              className={cn(
                'w-[130px]',
                compact ? 'h-8' : 'h-9',
                activeFilters[filter.id] &&
                  activeFilters[filter.id] !== 'all' &&
                  'border-primary'
              )}
            >
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {filter.options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.count !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({option.count})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Dropdown pour filtres supplémentaires */}
        {filters.length > 3 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size={compact ? 'sm' : 'default'}
                className="gap-1"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Plus
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {filters.slice(3).map(filter => (
                <React.Fragment key={filter.id}>
                  <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
                  {filter.options.map(option => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={
                        filter.multiple
                          ? (activeFilters[filter.id] as string[])?.includes(
                              option.value
                            )
                          : activeFilters[filter.id] === option.value
                      }
                      onCheckedChange={checked => {
                        if (filter.multiple) {
                          const current =
                            (activeFilters[filter.id] as string[]) || [];
                          const newValue = checked
                            ? [...current, option.value]
                            : current.filter(v => v !== option.value);
                          onFilterChange?.(filter.id, newValue);
                        } else {
                          onFilterChange?.(
                            filter.id,
                            checked ? option.value : 'all'
                          );
                        }
                      }}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {option.count}
                        </span>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset filtres */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            onClick={onResetFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Droite: Actions + Compteur */}
      <div className="flex items-center gap-2">
        {/* Compteur de résultats */}
        {resultCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {resultCount} résultat{resultCount > 1 ? 's' : ''}
          </span>
        )}

        {/* Refresh */}
        {onRefresh && (
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        )}

        {/* Export */}
        {onExport && (
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={onExport}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            {!compact && 'Exporter'}
          </Button>
        )}

        {/* Actions personnalisées */}
        {actions}
      </div>
    </div>
  );
}

/**
 * Composant DateRangeFilter - Filtre par plage de dates
 */
export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Input
        type="date"
        value={startDate || ''}
        onChange={e => onStartDateChange?.(e.target.value)}
        className="h-8 w-[130px]"
        placeholder="Début"
      />
      <span className="text-muted-foreground">→</span>
      <Input
        type="date"
        value={endDate || ''}
        onChange={e => onEndDateChange?.(e.target.value)}
        className="h-8 w-[130px]"
        placeholder="Fin"
      />
    </div>
  );
}
