'use client';

/**
 * HierarchicalCategorySelector - Sélecteur de catégories PCG hiérarchique
 *
 * Conforme au Plan Comptable Général français (PCG 2025)
 * Workflow en 3 étapes comme Abie/Indy:
 * 1. Sélectionner une CLASSE (niveau 1) - ex: "62 - Autres services extérieurs"
 * 2. Sélectionner un COMPTE (niveau 2) - ex: "627 - Services bancaires"
 * 3. Optionnel: Sélectionner un SOUS-COMPTE (niveau 3) - ex: "6278 - Frais bancaires"
 *
 * Données chargées depuis la base de données Supabase (table pcg_categories)
 */

import { useState, useEffect, useMemo } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Loader2,
} from 'lucide-react';

import { usePcgCategories } from '../hooks/use-pcg-categories';

interface HierarchicalCategorySelectorProps {
  /** Code PCG sélectionné (peut être niveau 1, 2 ou 3) */
  value: string | null;
  /** Callback quand une catégorie est sélectionnée */
  onChange: (code: string) => void;
  /** Code suggéré automatiquement */
  suggestedCode?: string | null;
  /** Filtrer uniquement les charges (classe 6) ou produits (classe 7) */
  filterType?: 'charges' | 'produits' | 'all';
  /** Classes CSS additionnelles */
  className?: string;
}

export function HierarchicalCategorySelector({
  value,
  onChange,
  suggestedCode,
  filterType = 'charges', // Par défaut: dépenses (classe 6)
  className,
}: HierarchicalCategorySelectorProps) {
  // Hook pour récupérer les catégories depuis Supabase
  const {
    classes: allClasses,
    isLoading,
    error,
    getAccounts,
    getSubaccounts,
    getCategory,
    getFullPath,
    search: searchCategories,
  } = usePcgCategories();

  // État de navigation
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les classes selon le type
  const availableClasses = useMemo(() => {
    return allClasses.filter(c => {
      const code = parseInt(c.code, 10);
      if (filterType === 'charges') {
        return code >= 60 && code <= 69; // Classe 6 uniquement
      }
      if (filterType === 'produits') {
        return code >= 70 && code <= 79; // Classe 7 uniquement
      }
      return true; // Toutes les classes
    });
  }, [allClasses, filterType]);

  // Comptes de la classe sélectionnée
  const availableAccounts = useMemo(() => {
    if (!selectedClass) return [];
    return getAccounts(selectedClass);
  }, [selectedClass, getAccounts]);

  // Sous-comptes du compte sélectionné
  const availableSubaccounts = useMemo(() => {
    if (!selectedAccount) return [];
    return getSubaccounts(selectedAccount);
  }, [selectedAccount, getSubaccounts]);

  // Initialiser la navigation depuis la valeur actuelle
  useEffect(() => {
    if (value && !isLoading) {
      const category = getCategory(value);
      if (category) {
        if (category.level === 1) {
          setSelectedClass(value);
          setSelectedAccount(null);
        } else if (category.level === 2) {
          setSelectedClass(category.parent_code);
          setSelectedAccount(value);
        } else if (category.level === 3 && category.parent_code) {
          const parent = getCategory(category.parent_code);
          if (parent) {
            setSelectedClass(parent.parent_code);
            setSelectedAccount(category.parent_code);
          }
        }
      }
    }
  }, [value, isLoading, getCategory]);

  // Sélectionner une classe
  const handleSelectClass = (code: string) => {
    setSelectedClass(code);
    setSelectedAccount(null);
    // Ne pas appeler onChange ici - l'utilisateur doit sélectionner un compte
  };

  // Sélectionner un compte
  const handleSelectAccount = (code: string) => {
    setSelectedAccount(code);
    // Vérifier s'il y a des sous-comptes
    const subaccounts = getSubaccounts(code);
    if (subaccounts.length === 0) {
      // Pas de sous-comptes, sélection finale
      onChange(code);
    }
    // S'il y a des sous-comptes, attendre la sélection
  };

  // Sélectionner un sous-compte (ou confirmer le compte)
  const handleSelectSubaccount = (code: string) => {
    onChange(code);
  };

  // Confirmer le compte sans sous-compte
  const handleConfirmAccount = () => {
    if (selectedAccount) {
      onChange(selectedAccount);
    }
  };

  // Retour à l'étape précédente
  const handleBack = () => {
    if (selectedAccount) {
      setSelectedAccount(null);
    } else if (selectedClass) {
      setSelectedClass(null);
    }
  };

  // Catégorie suggérée
  const suggestedCategory = suggestedCode ? getCategory(suggestedCode) : null;

  // Recherche dans toutes les catégories
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return searchCategories(searchQuery);
  }, [searchQuery, searchCategories]);

  // Affichage de la valeur actuelle
  const currentValueLabel = value ? getFullPath(value) : null;

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">
          Chargement des catégories PCG...
        </span>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700',
          className
        )}
      >
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Valeur actuelle */}
      {currentValueLabel && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          <Check className="h-4 w-4" />
          <span className="font-medium">{currentValueLabel}</span>
          <Badge variant="outline" className="ml-auto">
            {value}
          </Badge>
        </div>
      )}

      {/* Suggestion automatique */}
      {suggestedCategory && !value && (
        <button
          type="button"
          onClick={() => onChange(suggestedCode!)}
          className="flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <span className="text-lg">&#128161;</span>
          <div className="flex-1 text-left">
            <div className="font-medium">
              Suggestion : {suggestedCategory.label}
            </div>
            <div className="text-xs text-blue-600">
              {getFullPath(suggestedCode!)} ({suggestedCode})
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un compte PCG..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="p-2 text-xs font-medium text-slate-500 border-b">
            Résultats de recherche
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {searchResults.map(cat => (
              <button
                key={cat.code}
                type="button"
                onClick={() => {
                  onChange(cat.code);
                  setSearchQuery('');
                }}
                className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50 transition-colors"
              >
                <Badge variant="outline" className="font-mono text-xs">
                  {cat.code}
                </Badge>
                <span className="flex-1 text-left">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation hiérarchique */}
      {searchResults.length === 0 && (
        <>
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => {
                setSelectedClass(null);
                setSelectedAccount(null);
              }}
              className={cn(
                'hover:text-blue-600',
                !selectedClass && 'font-medium text-slate-900'
              )}
            >
              Classes
            </button>
            {selectedClass && (
              <>
                <ChevronRight className="h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className={cn(
                    'hover:text-blue-600',
                    selectedClass &&
                      !selectedAccount &&
                      'font-medium text-slate-900'
                  )}
                >
                  {getCategory(selectedClass)?.label}
                </button>
              </>
            )}
            {selectedAccount && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-slate-900">
                  {getCategory(selectedAccount)?.label}
                </span>
              </>
            )}
          </div>

          {/* ÉTAPE 1: Sélection de la classe */}
          {!selectedClass && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">
                1. Choisissez une classe de comptes
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {availableClasses.map(cls => (
                  <button
                    key={cls.code}
                    type="button"
                    onClick={() => handleSelectClass(cls.code)}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {cls.code}
                        </Badge>
                        <span className="font-medium text-slate-900 truncate">
                          {cls.label}
                        </span>
                      </div>
                      {cls.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {cls.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Sélection du compte */}
          {selectedClass && !selectedAccount && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </Button>
                <span className="text-sm font-medium text-slate-700">
                  2. Choisissez un compte
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {availableAccounts.map(acc => {
                  const hasSubaccounts = getSubaccounts(acc.code).length > 0;
                  return (
                    <button
                      key={acc.code}
                      type="button"
                      onClick={() => handleSelectAccount(acc.code)}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {acc.code}
                          </Badge>
                          <span className="font-medium text-slate-900 truncate">
                            {acc.label}
                          </span>
                        </div>
                        {acc.description && (
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {acc.description}
                          </div>
                        )}
                      </div>
                      {hasSubaccounts ? (
                        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Sélection du sous-compte (optionnel) */}
          {selectedAccount && availableSubaccounts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </Button>
                <span className="text-sm font-medium text-slate-700">
                  3. Précisez le sous-compte (optionnel)
                </span>
              </div>

              {/* Option: Utiliser le compte parent */}
              <button
                type="button"
                onClick={handleConfirmAccount}
                className="flex w-full items-center gap-3 rounded-lg border-2 border-blue-300 bg-blue-50 p-3 text-left hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="font-mono text-xs bg-blue-600">
                      {selectedAccount}
                    </Badge>
                    <span className="font-medium text-blue-900">
                      {getCategory(selectedAccount)?.label} (général)
                    </span>
                  </div>
                  <div className="text-xs text-blue-700 mt-0.5">
                    Utiliser ce compte sans préciser de sous-compte
                  </div>
                </div>
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
              </button>

              {/* Sous-comptes disponibles */}
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {availableSubaccounts.map(sub => (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => handleSelectSubaccount(sub.code)}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {sub.code}
                        </Badge>
                        <span className="font-medium text-slate-900 truncate">
                          {sub.label}
                        </span>
                      </div>
                      {sub.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {sub.description}
                        </div>
                      )}
                    </div>
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
