'use client';

import type { PurchaseOrderStatus } from '@verone/orders';
import type { PurchaseAdvancedFilters } from '@verone/orders';
import { DEFAULT_PURCHASE_FILTERS } from '@verone/orders';
import type { Organisation } from '@verone/types';
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
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { Search, RotateCcw } from 'lucide-react';

interface TabCounts {
  all: number;
  draft: number;
  validated: number;
  partially_received: number;
  received: number;
  cancelled: number;
}

interface FournisseursFiltersProps {
  activeTab: PurchaseOrderStatus | 'all';
  setActiveTab: (value: PurchaseOrderStatus | 'all') => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  advancedFilters: PurchaseAdvancedFilters;
  setAdvancedFilters: (
    updater: (prev: PurchaseAdvancedFilters) => PurchaseAdvancedFilters
  ) => void;
  suppliers: Organisation[];
  availableYears: number[];
  currentYear: number;
  isPeriodEnabled: boolean;
  hasActiveFilters: boolean;
  tabCounts: TabCounts;
}

export function FournisseursFilters({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  advancedFilters,
  setAdvancedFilters,
  suppliers,
  availableYears,
  currentYear,
  isPeriodEnabled,
  hasActiveFilters,
  tabCounts,
}: FournisseursFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Onglets Statuts */}
        <Tabs
          value={activeTab}
          onValueChange={value =>
            setActiveTab(value as PurchaseOrderStatus | 'all')
          }
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
            <TabsTrigger value="draft">
              Brouillon ({tabCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="validated">
              Validée ({tabCounts.validated})
            </TabsTrigger>
            <TabsTrigger value="partially_received">
              Part. reçue ({tabCounts.partially_received})
            </TabsTrigger>
            <TabsTrigger value="received">
              Reçue ({tabCounts.received})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Annulée ({tabCounts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro de commande ou fournisseur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres inline */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Fournisseur */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Fournisseur :
            </span>
            <Select
              value={advancedFilters.supplierId ?? 'all'}
              onValueChange={value =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  supplierId: value === 'all' ? null : value,
                }))
              }
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder="Tous les fournisseurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {getOrganisationDisplayName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Année */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Année :
            </span>
            <Select
              value={advancedFilters.filterYear?.toString() ?? 'all'}
              onValueChange={value => {
                const year = value === 'all' ? null : Number(value);
                setAdvancedFilters(prev => ({
                  ...prev,
                  filterYear: year,
                  period:
                    year !== null && year !== currentYear ? 'all' : prev.period,
                }));
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

          {/* Période */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                !isPeriodEnabled ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Période :
            </span>
            <Select
              value={advancedFilters.period}
              onValueChange={value =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  period: value as PurchaseAdvancedFilters['period'],
                }))
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
                <SelectItem value="year">Année</SelectItem>
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
                setAdvancedFilters(prev => ({
                  ...prev,
                  matching: value as PurchaseAdvancedFilters['matching'],
                }))
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
              onClick={() => setAdvancedFilters(() => DEFAULT_PURCHASE_FILTERS)}
            >
              Réinitialiser
            </ButtonUnified>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
