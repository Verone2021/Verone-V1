'use client';

import { Badge, Button } from '@verone/ui';
import { ArrowRight, Check, Receipt, X } from 'lucide-react';

import type { PcgCategory } from '../../lib/pcg-categories';

interface SelectedCategoryDisplayProps {
  selectedCategory: string | null;
  selectedCategoryInfo: PcgCategory | null;
  currentCategory?: string;
  currentCategoryInfo: PcgCategory | null;
  onClear: () => void;
}

export function SelectedCategoryDisplay({
  selectedCategory,
  selectedCategoryInfo,
  currentCategory,
  currentCategoryInfo,
  onClear,
}: SelectedCategoryDisplayProps): React.ReactNode {
  // Categorie actuelle (si modification) - shown when no new selection
  if (currentCategory && currentCategoryInfo && !selectedCategory) {
    return (
      <div className="mb-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 shadow-sm">
            <Receipt className="h-6 w-6 text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Categorie actuelle
            </div>
            <div className="font-semibold text-slate-700 text-lg">
              {currentCategoryInfo.label}
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Badge variant="outline" className="font-mono bg-white">
                {currentCategory}
              </Badge>
              {currentCategoryInfo.description && (
                <span>{currentCategoryInfo.description}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Comparaison ancien -> nouveau (si modification)
  if (
    selectedCategory &&
    selectedCategoryInfo &&
    currentCategory &&
    currentCategoryInfo &&
    selectedCategory !== currentCategory
  ) {
    return (
      <div className="mb-6 rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-4">
          Changement de categorie
        </div>
        <div className="flex items-center gap-4">
          {/* Ancienne categorie */}
          <div className="flex-1 rounded-xl bg-white/70 border border-slate-200 p-4">
            <div className="text-xs text-slate-400 mb-1">Ancienne</div>
            <div className="font-semibold text-slate-500 line-through">
              {currentCategoryInfo.label}
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs mt-1 text-slate-400"
            >
              {currentCategory}
            </Badge>
          </div>

          {/* Fleche */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
            <ArrowRight className="h-5 w-5 text-blue-600" />
          </div>

          {/* Nouvelle categorie */}
          <div className="flex-1 rounded-xl bg-green-50 border-2 border-green-300 p-4">
            <div className="text-xs text-green-600 mb-1">Nouvelle</div>
            <div className="font-semibold text-green-800">
              {selectedCategoryInfo.label}
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs mt-1 bg-green-100 text-green-700 border-green-300"
            >
              {selectedCategory}
            </Badge>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-slate-600 border-slate-300 hover:bg-white"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler le changement
          </Button>
        </div>
      </div>
    );
  }

  // Nouvelle categorie selectionnee (sans ancienne)
  if (
    selectedCategory &&
    selectedCategoryInfo &&
    (!currentCategory || selectedCategory === currentCategory)
  ) {
    return (
      <div className="mb-6 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shadow-sm">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-green-900 text-lg">
                {selectedCategoryInfo.label}
              </div>
              <div className="text-sm text-green-700 flex items-center gap-2">
                <Badge variant="outline" className="font-mono bg-white/50">
                  {selectedCategory}
                </Badge>
                {selectedCategoryInfo.description && (
                  <span>{selectedCategoryInfo.description}</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            <X className="h-4 w-4 mr-1" />
            Changer
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
