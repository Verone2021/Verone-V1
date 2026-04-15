'use client';

/**
 * SelectionPickerSection - Liste des sélections + formulaire de création
 *
 * @module SelectionPickerSection
 * @since 2026-04-14
 */

import { Check, Loader2, Plus, Star } from 'lucide-react';

import type { UserSelection } from '../../../lib/hooks/use-user-selection';

interface SelectionPickerSectionProps {
  selections: UserSelection[] | undefined;
  selectedSelectionId: string | null;
  isCreatingNew: boolean;
  newSelectionName: string;
  isCreatingPending: boolean;
  onSelectSelection: (id: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onNewSelectionNameChange: (name: string) => void;
  onCreateSelection: () => void;
}

export function SelectionPickerSection({
  selections,
  selectedSelectionId,
  isCreatingNew,
  newSelectionName,
  isCreatingPending,
  onSelectSelection,
  onStartCreate,
  onCancelCreate,
  onNewSelectionNameChange,
  onCreateSelection,
}: SelectionPickerSectionProps) {
  const hasNoSelections = !selections || selections.length === 0;

  if (isCreatingNew) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la sélection
          </label>
          <input
            type="text"
            value={newSelectionName}
            onChange={e => onNewSelectionNameChange(e.target.value)}
            placeholder="Ma sélection printemps 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancelCreate}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onCreateSelection}
            disabled={!newSelectionName.trim() || isCreatingPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Créer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasNoSelections ? (
        <div className="text-center py-6">
          <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600">
            Vous n&apos;avez pas encore de sélection
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Créez votre première sélection
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Choisir une sélection :
          </p>
          {selections?.map(selection => (
            <button
              key={selection.id}
              onClick={() => onSelectSelection(selection.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedSelectionId === selection.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star
                  className={`h-5 w-5 ${
                    selectedSelectionId === selection.id
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selection.name}</p>
                  <p className="text-xs text-gray-500">
                    {selection.products_count} produit
                    {selection.products_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {selectedSelectionId === selection.id && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onStartCreate}
        className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="h-5 w-5" />
        Créer une nouvelle sélection
      </button>
    </>
  );
}
