'use client';

import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Input } from '@verone/ui';
import { Search, Filter, X, AlertTriangle, CheckCircle } from 'lucide-react';

import type {
  InventoryFilters,
  QuickDateFilter,
  StockLevelFilter,
} from './inventaire.types';

interface InventaireFiltersProps {
  filters: InventoryFilters;
  setFilters: React.Dispatch<React.SetStateAction<InventoryFilters>>;
  showOnlyWithStock: boolean;
  setShowOnlyWithStock: (val: boolean) => void;
  quickDateFilter: QuickDateFilter;
  stockLevelFilter: StockLevelFilter;
  setStockLevelFilter: (val: StockLevelFilter) => void;
  activeFiltersCount: number;
  onSearch: (value: string) => void;
  onApplyFilters: () => void;
  onQuickDateFilter: (filter: QuickDateFilter) => void;
  onResetFilters: () => void;
}

const QUICK_DATE_OPTIONS: { key: QuickDateFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: '7days', label: '7 jours' },
  { key: '30days', label: '30 jours' },
];

const STOCK_LEVEL_OPTIONS: {
  key: StockLevelFilter;
  label: string;
  icon: React.ReactNode | null;
  color: string | null;
}[] = [
  { key: 'all', label: 'Tous', icon: null, color: null },
  {
    key: 'critical',
    label: 'Rupture',
    icon: <X className="h-3 w-3" />,
    color: 'red',
  },
  {
    key: 'low',
    label: 'Faible',
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'orange',
  },
  {
    key: 'sufficient',
    label: 'OK',
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'green',
  },
];

function getStockLevelActiveClass(color: string | null): string {
  if (color === 'red') return 'bg-red-600 text-white';
  if (color === 'orange') return 'bg-orange-500 text-white';
  if (color === 'green') return 'bg-green-600 text-white';
  return 'bg-black text-white';
}

export function InventaireFilters({
  filters,
  setFilters,
  showOnlyWithStock,
  setShowOnlyWithStock,
  quickDateFilter,
  stockLevelFilter,
  setStockLevelFilter,
  activeFiltersCount,
  onSearch,
  onApplyFilters,
  onQuickDateFilter,
  onResetFilters,
}: InventaireFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Ligne 1 : Recherche + Filtres rapides période */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher produit, SKU..."
              value={filters.search}
              onChange={e => onSearch(e.target.value)}
              className="pl-10 border-gray-300 h-10 text-sm rounded-lg"
            />
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Période:</span>
            {QUICK_DATE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => onQuickDateFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  quickDateFilter === opt.key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Du</span>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={e => {
                setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                onQuickDateFilter('all');
              }}
              className="border-gray-300 w-36 h-9 text-xs rounded-md"
            />
            <span className="text-xs text-gray-500">au</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={e => {
                setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                onQuickDateFilter('all');
              }}
              className="border-gray-300 w-36 h-9 text-xs rounded-md"
            />
          </div>

          <ButtonV2
            onClick={onApplyFilters}
            size="sm"
            className="bg-black hover:bg-gray-800 text-white h-9 px-4 text-xs"
          >
            <Filter className="h-3 w-3 mr-1.5" />
            Appliquer
          </ButtonV2>
        </div>
      </div>

      {/* Ligne 2 : Filtres avancés + Reset */}
      <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Stock:</span>
            {STOCK_LEVEL_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setStockLevelFilter(opt.key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  stockLevelFilter === opt.key
                    ? getStockLevelActiveClass(opt.color)
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyWithStock}
              onChange={e => setShowOnlyWithStock(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
            />
            <span className="text-xs text-gray-700">
              Uniquement stock &gt; 0
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}{' '}
                actif
                {activeFiltersCount > 1 ? 's' : ''}
              </Badge>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="text-xs text-gray-500 hover:text-red-600 h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser
              </ButtonV2>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
