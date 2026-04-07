'use client';

import { ButtonV2 } from '@verone/ui';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';

interface Selection {
  id: string;
  name: string;
  products_count?: number | null;
}

interface QuoteLinkmeSelectionStepProps {
  selections: Selection[] | undefined;
  onSelectionSelect: (selectionId: string) => void;
  onBack: () => void;
}

export function QuoteLinkmeSelectionStep({
  selections,
  onSelectionSelect,
  onBack,
}: QuoteLinkmeSelectionStepProps) {
  return (
    <div className="py-4">
      <div className="mb-4">
        <ButtonV2
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux affiliés
        </ButtonV2>
      </div>

      {!selections || selections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune sélection pour cet affilié</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
          {selections.map(selection => (
            <button
              key={selection.id}
              type="button"
              onClick={() => onSelectionSelect(selection.id)}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {selection.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selection.products_count ?? 0} produit(s)
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
