'use client';

import React from 'react';

import type { Enseigne } from '@verone/organisations';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { Search, RotateCcw, FileSpreadsheet } from 'lucide-react';

import type { SalesAdvancedFilters } from '../../types/advanced-filters';
import { DEFAULT_SALES_FILTERS } from '../../types/advanced-filters';
import type { SalesOrderStatus } from '../../hooks/use-sales-orders';

export interface SalesOrderTabCounts {
  all: number;
  pending_approval: number;
  draft: number;
  validated: number;
  shipped: number;
  cancelled: number;
}

export interface SalesOrderFiltersProps {
  /** Current active status tab */
  activeTab: SalesOrderStatus | 'all';
  onActiveTabChange: (tab: SalesOrderStatus | 'all') => void;

  /** Tab counts */
  tabCounts: SalesOrderTabCounts;

  /** Search */
  searchTerm: string;
  onSearchTermChange: (term: string) => void;

  /** Advanced filters */
  advancedFilters: SalesAdvancedFilters;
  onAdvancedFiltersChange: (filters: SalesAdvancedFilters) => void;

  /** Whether any filter is active (for reset button) */
  hasActiveFilters: boolean;

  /** Year-related props */
  currentYear: number;
  availableYears: number[];
  isPeriodEnabled: boolean;

  /** Enseignes for filter dropdown */
  enseignes: Enseigne[];

  /** Export handler */
  onExportExcel: () => void;

  /** Create button config */
  onCreateClick?: () => void;
  renderCreateButton: React.ReactNode;

  /** Header right slot */
  renderHeaderRight?: () => React.ReactNode;
}

export function SalesOrderFilters({
  activeTab,
  onActiveTabChange,
  tabCounts,
  searchTerm,
  onSearchTermChange,
  advancedFilters,
  onAdvancedFiltersChange,
  hasActiveFilters,
  currentYear,
  availableYears,
  isPeriodEnabled,
  enseignes,
  onExportExcel,
  renderCreateButton,
  renderHeaderRight,
}: SalesOrderFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filtres</CardTitle>
          <div className="flex gap-2">
            <ButtonUnified
              onClick={() => {
                void Promise.resolve(onExportExcel()).catch((err: unknown) => {
                  console.error('[SalesOrderFilters] export failed:', err);
                });
              }}
              variant="outline"
              icon={FileSpreadsheet}
            >
              Exporter Excel
            </ButtonUnified>
            {renderCreateButton}
            {renderHeaderRight?.()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Onglets Statuts */}
        <Tabs
          value={activeTab}
          onValueChange={value =>
            onActiveTabChange(value as SalesOrderStatus | 'all')
          }
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
            <TabsTrigger value="pending_approval">
              Approbation ({tabCounts.pending_approval})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Brouillon ({tabCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="validated">
              Validee ({tabCounts.validated})
            </TabsTrigger>
            <TabsTrigger value="shipped">
              Expediee ({tabCounts.shipped})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Annulee ({tabCounts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par numero ou client..."
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres inline (dropdowns compacts) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type client */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Type client :
            </span>
            <Select
              value={advancedFilters.customerType}
              onValueChange={value =>
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  customerType: value,
                  enseigneId:
                    value !== 'enseigne' ? null : advancedFilters.enseigneId,
                })
              }
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="individual">Particulier</SelectItem>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="enseigne">Enseigne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enseigne (visible si customerType === 'enseigne') */}
          {advancedFilters.customerType === 'enseigne' &&
            enseignes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Enseigne :
                </span>
                <Select
                  value={advancedFilters.enseigneId ?? 'all'}
                  onValueChange={value =>
                    onAdvancedFiltersChange({
                      ...advancedFilters,
                      enseigneId: value === 'all' ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {enseignes.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.member_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* Annee */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Annee :
            </span>
            <Select
              value={advancedFilters.filterYear?.toString() ?? 'all'}
              onValueChange={value => {
                const year = value === 'all' ? null : Number(value);
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  filterYear: year,
                  period:
                    year !== null && year !== currentYear
                      ? 'all'
                      : advancedFilters.period,
                });
              }}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Periode */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                !isPeriodEnabled ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Periode :
            </span>
            <Select
              value={advancedFilters.period}
              onValueChange={value =>
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  period: value as SalesAdvancedFilters['period'],
                })
              }
              disabled={!isPeriodEnabled}
            >
              <SelectTrigger
                className={cn(
                  'w-[120px] h-8 text-xs',
                  !isPeriodEnabled && 'opacity-50'
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Annee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rapprochement */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Rapprochement :
            </span>
            <Select
              value={advancedFilters.matching}
              onValueChange={value =>
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  matching: value as SalesAdvancedFilters['matching'],
                })
              }
            >
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="matched">Oui</SelectItem>
                <SelectItem value="unmatched">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <ButtonUnified
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => onAdvancedFiltersChange(DEFAULT_SALES_FILTERS)}
            >
              Reinitialiser
            </ButtonUnified>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
