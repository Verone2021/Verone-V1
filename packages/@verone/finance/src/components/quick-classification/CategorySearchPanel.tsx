'use client';

import { useState } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Input } from '@verone/ui/components/ui/input';
import {
  Search,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  ArrowLeft,
} from 'lucide-react';

import type { PcgCategory } from '../../lib/pcg-categories';
import type { CategoryShortcut } from './types';
import { ThematicCategoryGrid } from './ThematicCategoryGrid';

interface CategorySearchPanelProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: PcgCategory[];
  popularCategories: CategoryShortcut[];
  isIncome: boolean;
  transactionSide: 'debit' | 'credit';
  onSelectCategory: (code: string) => void;
}

export function CategorySearchPanel({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  popularCategories,
  isIncome,
  transactionSide,
  onSelectCategory,
}: CategorySearchPanelProps): React.ReactNode {
  const [showAllCategories, setShowAllCategories] = useState(false);

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Rechercher une categorie (ex: hotel, logiciel, assurance, abonnement...)"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          className="h-14 pl-12 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Resultats de recherche */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Resultats de recherche ({searchResults.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {searchResults.map(cat => (
              <button
                key={cat.code}
                type="button"
                onClick={() => onSelectCategory(cat.code)}
                className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-4 text-left hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
              >
                <Badge
                  variant="outline"
                  className="font-mono text-xs shrink-0 bg-white"
                >
                  {cat.code}
                </Badge>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">
                    {cat.label}
                  </div>
                  {cat.description && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cat.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories populaires */}
      {!searchQuery && (
        <>
          <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {isIncome
              ? 'Categories revenus populaires'
              : 'Categories populaires'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {popularCategories.map(cat => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => onSelectCategory(cat.code)}
                  className={cn(
                    'flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer',
                    cat.color
                  )}
                >
                  <IconComponent
                    className={cn('h-7 w-7 mb-2', cat.iconColor)}
                  />
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {cat.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Vue thematique Indy - toutes categories en colonnes */}
          {!showAllCategories && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Toutes les categories par theme
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {showAllCategories && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600">
                  Toutes les categories par theme
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAllCategories(false)}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Reduire
                </button>
              </div>
              <ThematicCategoryGrid
                onSelect={onSelectCategory}
                side={transactionSide}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
