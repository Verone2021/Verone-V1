'use client';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import type { PcgCategory } from '../../lib/pcg-categories';
import { ALL_PCG_CATEGORIES } from '../../lib/pcg-categories';
import { POPULAR_CATEGORIES, MORE_CATEGORIES } from './pcg-category-data';

interface CategorySectionProps {
  selectedCategory: string | null;
  selectedCategoryInfo: PcgCategory | null;
  categorySearchQuery: string;
  showAllCategories: boolean;
  onCategorySearchQueryChange: (value: string) => void;
  onSelectCategory: (code: string) => void;
  onClearCategory: () => void;
  onShowAllCategories: (show: boolean) => void;
}

export function CategorySection({
  selectedCategory,
  selectedCategoryInfo,
  categorySearchQuery,
  showAllCategories,
  onCategorySearchQueryChange,
  onSelectCategory,
  onClearCategory,
  onShowAllCategories,
}: CategorySectionProps) {
  const categorySearchResults =
    categorySearchQuery.length >= 2
      ? ALL_PCG_CATEGORIES.filter(
          cat =>
            cat.label
              .toLowerCase()
              .includes(categorySearchQuery.toLowerCase()) ||
            cat.code.includes(categorySearchQuery) ||
            cat.description
              ?.toLowerCase()
              .includes(categorySearchQuery.toLowerCase())
        ).slice(0, 8)
      : [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-500" />
        Catégorie comptable
        <span className="text-xs font-normal text-slate-400">(optionnel)</span>
      </h3>

      {/* Catégorie sélectionnée */}
      {selectedCategory && selectedCategoryInfo ? (
        <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <Badge variant="outline" className="font-mono bg-white">
              {selectedCategory}
            </Badge>
            <span className="text-sm font-medium text-slate-700">
              {selectedCategoryInfo.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCategory}
            className="text-slate-500 hover:text-red-500"
          >
            <X className="h-4 w-4 mr-1" />
            Changer
          </Button>
        </div>
      ) : (
        <>
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={categorySearchQuery}
              onChange={e => onCategorySearchQueryChange(e.target.value)}
              className="pl-10"
            />
            {categorySearchQuery && (
              <button
                type="button"
                onClick={() => onCategorySearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Résultats de recherche */}
          {categorySearchResults.length > 0 && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto border rounded-lg p-2">
              {categorySearchResults.map(cat => (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => onSelectCategory(cat.code)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <Badge
                    variant="outline"
                    className="font-mono text-xs shrink-0 bg-white"
                  >
                    {cat.code}
                  </Badge>
                  <span className="text-sm truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Grille des catégories populaires */}
          {!categorySearchQuery && (
            <>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-4 mb-2">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Catégories populaires
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_CATEGORIES.map(cat => {
                  const IconComponent = cat.icon;
                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => onSelectCategory(cat.code)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer',
                        cat.color
                      )}
                    >
                      <IconComponent
                        className={cn('h-5 w-5 shrink-0', cat.iconColor)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">
                          {cat.label}
                        </div>
                        <div className="text-[10px] opacity-70 truncate">
                          {cat.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Plus de catégories */}
              {!showAllCategories ? (
                <button
                  type="button"
                  onClick={() => onShowAllCategories(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mt-2"
                >
                  Voir plus de catégories
                  <ChevronRight className="h-3 w-3" />
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <div className="text-xs font-medium text-slate-500">
                      Plus de catégories
                    </div>
                    <button
                      type="button"
                      onClick={() => onShowAllCategories(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Réduire
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MORE_CATEGORIES.map(cat => {
                      const IconComponent = cat.icon;
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          onClick={() => onSelectCategory(cat.code)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer',
                            cat.color
                          )}
                        >
                          <IconComponent
                            className={cn('h-5 w-5 shrink-0', cat.iconColor)}
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-xs truncate">
                              {cat.label}
                            </div>
                            <div className="text-[10px] opacity-70 truncate">
                              {cat.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
