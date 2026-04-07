'use client';

import { cn } from '@verone/utils';
import { Layers, Check, AlertCircle, Loader2, Eye } from 'lucide-react';
import type { AffiliateSelection } from '../../hooks/use-create-linkme-order-form';

interface SelectionListSectionProps {
  selections: AffiliateSelection[] | undefined;
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
}

export function SelectionListSection({
  selections,
  isLoading,
  selectedId,
  onSelect,
  onPreview,
}: SelectionListSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Layers className="h-4 w-4 inline mr-1" />
        Sélection (mini-boutique) *
      </label>
      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">
            Chargement des sélections...
          </span>
        </div>
      ) : selections && selections.length > 0 ? (
        <div className="grid gap-2 max-h-40 overflow-y-auto">
          {selections.map((selection: AffiliateSelection) => (
            <div key={selection.id} className="flex items-center gap-2">
              <button
                onClick={() => onSelect(selection.id)}
                className={cn(
                  'flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                  selectedId === selection.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Layers
                  className={cn(
                    'h-5 w-5',
                    selectedId === selection.id
                      ? 'text-purple-600'
                      : 'text-gray-400'
                  )}
                />
                <div className="flex-1">
                  <p className="font-medium">{selection.name}</p>
                  <p className="text-xs text-gray-500">
                    {selection.products_count ?? 0} produit
                    {(selection.products_count ?? 0) > 1 ? 's' : ''}
                  </p>
                </div>
                {selectedId === selection.id && (
                  <Check className="h-5 w-5 text-purple-600" />
                )}
              </button>
              <button
                onClick={() => onPreview(selection.id)}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors border border-gray-200"
                title="Aperçu des produits"
              >
                <Eye className="h-4 w-4 text-gray-500 hover:text-purple-600" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-600 py-2">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          Aucune sélection disponible pour cet affilié
        </p>
      )}
    </div>
  );
}
