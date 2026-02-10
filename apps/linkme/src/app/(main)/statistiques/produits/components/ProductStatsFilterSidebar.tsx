'use client';

/**
 * ProductStatsFilterSidebar - Sidebar de filtres avancés pour les statistiques produits
 *
 * Sections :
 * 1. Statut Commission (multi-select avec badges colorés)
 * 2. Bouton Reset All
 *
 * Pattern basé sur FilterDrawer.tsx du catalogue
 *
 * @module ProductStatsFilterSidebar
 * @since 2026-02-10
 */

import { X, CircleDollarSign, RotateCcw } from 'lucide-react';

import type {
  CommissionStatus,
  ProductStatsFilters,
} from '@/lib/hooks/use-all-products-stats';
import { cn } from '@/lib/utils';

// ============================================
// CONSTANTS
// ============================================

const COMMISSION_STATUS_OPTIONS: {
  value: CommissionStatus;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'pending',
    label: 'En attente',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  {
    value: 'validated',
    label: 'Validées',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'paid',
    label: 'Payées',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
];

// ============================================
// TYPES
// ============================================

interface ProductStatsFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductStatsFilters;
  onChange: (filters: ProductStatsFilters) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ProductStatsFilterSidebar({
  isOpen,
  onClose,
  filters,
  onChange,
}: ProductStatsFilterSidebarProps): JSX.Element | null {
  const activeCount = filters.commissionStatuses?.length ?? 0;

  const handleStatusToggle = (status: CommissionStatus): void => {
    const current = filters.commissionStatuses ?? [];
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onChange({
      ...filters,
      commissionStatuses: next.length > 0 ? next : undefined,
    });
  };

  const handleResetAll = (): void => {
    onChange({
      productType: 'all',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-linkme-marine">
              Filtres avancés
            </h2>
            {activeCount > 0 && (
              <span className="text-xs bg-linkme-turquoise text-white px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Statut Commission */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4" />
              Statut commission
              {(filters.commissionStatuses?.length ?? 0) > 0 && (
                <span className="text-xs bg-linkme-turquoise text-white px-1.5 py-0.5 rounded-full">
                  {filters.commissionStatuses?.length}
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {COMMISSION_STATUS_OPTIONS.map(option => {
                const isChecked = (filters.commissionStatuses ?? []).includes(
                  option.value
                );
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                      isChecked
                        ? 'bg-linkme-turquoise/10 border border-linkme-turquoise/30'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleStatusToggle(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-linkme-turquoise focus:ring-linkme-turquoise"
                    />
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        option.bgColor,
                        option.color
                      )}
                    >
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
            {(filters.commissionStatuses?.length ?? 0) > 0 && (
              <button
                onClick={() =>
                  onChange({ ...filters, commissionStatuses: undefined })
                }
                className="mt-2 text-xs text-gray-500 hover:text-linkme-turquoise transition-colors"
              >
                Effacer la sélection
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
          {activeCount > 0 && (
            <button
              onClick={handleResetAll}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser tous les filtres
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </>
  );
}
