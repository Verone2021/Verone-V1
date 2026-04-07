'use client';

import { cn } from '@verone/utils';
import { X } from 'lucide-react';

import type { Filters } from './types';
import { MISSING_FIELD_OPTIONS } from './types';

interface CatalogueResultsInfoProps {
  activeTab: 'active' | 'incomplete' | 'archived';
  total: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  incompleteTotal: number;
  incompletePage: number;
  incompleteTotalPages: number;
  archivedCount: number;
  filters: Filters;
  onApplyFilters: (filters: Filters) => void;
}

export function CatalogueResultsInfo({
  activeTab,
  total,
  currentPage,
  totalPages,
  itemsPerPage,
  incompleteTotal,
  incompletePage,
  incompleteTotalPages,
  archivedCount,
  filters,
  onApplyFilters,
}: CatalogueResultsInfoProps) {
  return (
    <>
      {activeTab === 'incomplete' && (
        <>
          <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 mb-3">
            Produits sans fournisseur, sous-catégorie, prix d&apos;achat, photo,
            dimensions ou poids. Complétez-les pour améliorer la qualité du
            catalogue.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-600">
              Filtrer par :
            </span>
            {MISSING_FIELD_OPTIONS.map(({ key, label, icon: Icon }) => {
              const isActive = filters.missingFields.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const newMissing = isActive
                      ? filters.missingFields.filter(f => f !== key)
                      : [...filters.missingFields, key];
                    onApplyFilters({
                      ...filters,
                      missingFields: newMissing,
                    });
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                    isActive
                      ? 'bg-orange-100 border-orange-400 text-orange-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
            {filters.missingFields.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onApplyFilters({ ...filters, missingFields: [] })
                }
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-3 w-3" />
                Effacer
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-sm text-black opacity-70">
        <span>
          {activeTab === 'active' &&
            `${total} produit${total > 1 ? 's' : ''} actif${total > 1 ? 's' : ''} - Page ${currentPage} sur ${totalPages}`}
          {activeTab === 'incomplete' &&
            `${incompleteTotal} produit${incompleteTotal > 1 ? 's' : ''} à compléter${incompleteTotalPages > 1 ? ` - Page ${incompletePage} sur ${incompleteTotalPages}` : ''}`}
          {activeTab === 'archived' &&
            `${archivedCount} produit${archivedCount > 1 ? 's' : ''} archivé${archivedCount > 1 ? 's' : ''}`}
        </span>
        <span className="flex items-center gap-4">
          {filters.search && (
            <span>Recherche: &quot;{filters.search}&quot;</span>
          )}
          {activeTab === 'active' && totalPages > 1 && (
            <span className="text-xs">
              Affichage {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, total)} sur {total}
            </span>
          )}
          {activeTab === 'incomplete' && incompleteTotalPages > 1 && (
            <span className="text-xs">
              Affichage {(incompletePage - 1) * itemsPerPage + 1}-
              {Math.min(incompletePage * itemsPerPage, incompleteTotal)} sur{' '}
              {incompleteTotal}
            </span>
          )}
        </span>
      </div>
    </>
  );
}
