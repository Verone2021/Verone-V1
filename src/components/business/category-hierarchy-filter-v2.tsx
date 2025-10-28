"use client"

/**
 * 🎯 CategoryHierarchyFilterV2 - Filtre de catégories hiérarchique avec badges
 *
 * FONCTIONNALITÉS :
 * - Arborescence à 3 niveaux (Famille > Catégorie > Sous-catégorie)
 * - Affichage uniquement des niveaux contenant des produits
 * - Badges amovibles pour les sélections actives
 * - Repliage automatique après sélection
 * - Compteurs de produits à chaque niveau
 * - Design minimaliste noir/blanc Vérone
 */

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Tag, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Types de données
interface Family {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  family_id: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface Product {
  id: string
  subcategory_id?: string
}

interface CategoryHierarchyFilterV2Props {
  families: Family[]
  categories: Category[]
  subcategories: Subcategory[]
  products: Product[] // Pour calculer les compteurs
  selectedSubcategories: string[]
  onSubcategoryToggle: (subcategoryId: string) => void
  className?: string
}

// Structure hiérarchique enrichie avec compteurs
interface EnrichedSubcategory extends Subcategory {
  productCount: number
}

interface EnrichedCategory extends Category {
  subcategories: EnrichedSubcategory[]
  productCount: number
}

interface EnrichedFamily extends Family {
  categories: EnrichedCategory[]
  productCount: number
}

interface SelectedFilter {
  subcategoryId: string
  subcategoryName: string
  categoryName: string
  familyName: string
}

export function CategoryHierarchyFilterV2({
  families,
  categories,
  subcategories,
  products,
  selectedSubcategories,
  onSubcategoryToggle,
  className
}: CategoryHierarchyFilterV2Props) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Enrichir la hiérarchie avec les compteurs de produits
  const enrichedHierarchy = useMemo(() => {
    // Compteurs par sous-catégorie
    const subcategoryProductCounts = new Map<string, number>()

    // Vérification sécurité : products peut être undefined pendant le chargement
    if (products && Array.isArray(products)) {
      products.forEach(product => {
        if (product.subcategory_id) {
          const count = subcategoryProductCounts.get(product.subcategory_id) || 0
          subcategoryProductCounts.set(product.subcategory_id, count + 1)
        }
      })
    }

    // Enrichir sous-catégories
    const enrichedSubcategories = subcategories.map(sub => ({
      ...sub,
      productCount: subcategoryProductCounts.get(sub.id) || 0
    }))

    // Regrouper par catégorie
    const categoriesMap = new Map<string, EnrichedCategory>()
    categories.forEach(cat => {
      const catSubcategories = enrichedSubcategories.filter(
        sub => sub.category_id === cat.id && sub.productCount > 0 // UNIQUEMENT si produits
      )

      const productCount = catSubcategories.reduce((sum, sub) => sum + sub.productCount, 0)

      categoriesMap.set(cat.id, {
        ...cat,
        subcategories: catSubcategories,
        productCount
      })
    })

    // Regrouper par famille
    const enrichedFamilies: EnrichedFamily[] = families.map(family => {
      const familyCategories = categories
        .filter(cat => cat.family_id === family.id)
        .map(cat => categoriesMap.get(cat.id)!)
        .filter(cat => cat && cat.productCount > 0) // UNIQUEMENT si produits

      const productCount = familyCategories.reduce((sum, cat) => sum + cat.productCount, 0)

      return {
        ...family,
        categories: familyCategories,
        productCount
      }
    }).filter(family => family.productCount > 0) // UNIQUEMENT familles avec produits

    return enrichedFamilies
  }, [families, categories, subcategories, products])

  // Calculer les filtres actifs pour affichage en badges
  const activeFilters = useMemo((): SelectedFilter[] => {
    return selectedSubcategories.map(subId => {
      const subcategory = subcategories.find(s => s.id === subId)
      if (!subcategory) return null

      const category = categories.find(c => c.id === subcategory.category_id)
      const family = category ? families.find(f => f.id === category.family_id) : null

      return {
        subcategoryId: subId,
        subcategoryName: subcategory.name,
        categoryName: category?.name || '',
        familyName: family?.name || ''
      }
    }).filter(Boolean) as SelectedFilter[]
  }, [selectedSubcategories, subcategories, categories, families])

  // Auto-expand les familles/catégories des sélections actives au chargement
  useEffect(() => {
    if (selectedSubcategories.length > 0) {
      const newExpandedFamilies = new Set<string>()
      const newExpandedCategories = new Set<string>()

      selectedSubcategories.forEach(subId => {
        const subcategory = subcategories.find(s => s.id === subId)
        if (subcategory) {
          const category = categories.find(c => c.id === subcategory.category_id)
          if (category) {
            newExpandedCategories.add(category.id)
            if (category.family_id) {
              newExpandedFamilies.add(category.family_id)
            }
          }
        }
      })

      setExpandedFamilies(newExpandedFamilies)
      setExpandedCategories(newExpandedCategories)
    }
  }, []) // Uniquement au montage

  // Toggle famille (expand/collapse)
  const toggleFamily = (familyId: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev)
      if (next.has(familyId)) {
        next.delete(familyId)
      } else {
        next.add(familyId)
      }
      return next
    })
  }

  // Toggle catégorie (expand/collapse)
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Sélection sous-catégorie avec repliage automatique
  const handleSubcategoryClick = (subcategoryId: string, categoryId: string) => {
    onSubcategoryToggle(subcategoryId)

    // Replier la catégorie parent après sélection
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.delete(categoryId)
      return next
    })
  }

  // Réinitialiser tous les filtres
  const handleResetAll = () => {
    selectedSubcategories.forEach(subId => onSubcategoryToggle(subId))
  }

  // Retirer un filtre individuel depuis les badges
  const handleRemoveFilter = (subcategoryId: string) => {
    onSubcategoryToggle(subcategoryId)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* BADGES FILTRES ACTIFS */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-black opacity-70">
              Filtres actifs ({activeFilters.length})
            </h4>
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="h-6 text-xs text-black hover:bg-gray-100"
            >
              Réinitialiser
            </ButtonV2>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.subcategoryId}
                variant="secondary"
                className="bg-black text-white border-black cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleRemoveFilter(filter.subcategoryId)}
              >
                <span className="text-xs">
                  {filter.familyName} › {filter.categoryName} › {filter.subcategoryName}
                </span>
                <X className="ml-1.5 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* TITRE SECTION */}
      <div className="flex items-center space-x-2">
        <Tag className="h-4 w-4 text-black" />
        <h3 className="text-sm font-medium text-black">Catégories</h3>
      </div>

      {/* ARBORESCENCE */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {enrichedHierarchy.map(family => {
            const isFamilyExpanded = expandedFamilies.has(family.id)
            const selectedCountInFamily = family.categories.reduce((sum, cat) => {
              return sum + cat.subcategories.filter(sub =>
                selectedSubcategories.includes(sub.id)
              ).length
            }, 0)

            return (
              <div key={family.id} className="space-y-1">
                {/* FAMILLE (Niveau 0) */}
                <button
                  onClick={() => toggleFamily(family.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors text-left",
                    selectedCountInFamily > 0 && "bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {isFamilyExpanded ? (
                      <FolderOpen className="h-4 w-4 flex-shrink-0 text-black" />
                    ) : (
                      <Folder className="h-4 w-4 flex-shrink-0 text-black" />
                    )}
                    <span className="text-sm font-medium text-black truncate">
                      {family.name}
                    </span>
                    <span className="text-xs text-black opacity-50">
                      ({family.productCount})
                    </span>
                    {selectedCountInFamily > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {selectedCountInFamily}
                      </Badge>
                    )}
                  </div>
                  {isFamilyExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-black opacity-50" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-black opacity-50" />
                  )}
                </button>

                {/* CATÉGORIES (Niveau 1) */}
                {isFamilyExpanded && (
                  <div className="ml-6 space-y-1">
                    {family.categories.map(category => {
                      const isCategoryExpanded = expandedCategories.has(category.id)
                      const selectedCountInCategory = category.subcategories.filter(sub =>
                        selectedSubcategories.includes(sub.id)
                      ).length

                      return (
                        <div key={category.id} className="space-y-1">
                          {/* CATÉGORIE */}
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors text-left",
                              selectedCountInCategory > 0 && "bg-blue-50"
                            )}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="text-sm text-black truncate">
                                {category.name}
                              </span>
                              <span className="text-xs text-black opacity-50">
                                ({category.productCount})
                              </span>
                              {selectedCountInCategory > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 border-blue-300">
                                  {selectedCountInCategory}
                                </Badge>
                              )}
                            </div>
                            {isCategoryExpanded ? (
                              <ChevronDown className="h-3 w-3 flex-shrink-0 text-black opacity-50" />
                            ) : (
                              <ChevronRight className="h-3 w-3 flex-shrink-0 text-black opacity-50" />
                            )}
                          </button>

                          {/* SOUS-CATÉGORIES (Niveau 2) */}
                          {isCategoryExpanded && (
                            <div className="ml-6 space-y-1">
                              {category.subcategories.map(subcategory => {
                                const isSelected = selectedSubcategories.includes(subcategory.id)

                                return (
                                  <button
                                    key={subcategory.id}
                                    onClick={() => handleSubcategoryClick(subcategory.id, category.id)}
                                    className={cn(
                                      "w-full flex items-center space-x-2 p-2 rounded transition-colors text-left text-sm",
                                      isSelected
                                        ? "bg-black text-white"
                                        : "text-black hover:bg-gray-100"
                                    )}
                                  >
                                    {/* Checkbox personnalisée */}
                                    <div
                                      className={cn(
                                        "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0",
                                        isSelected
                                          ? "bg-white border-white"
                                          : "border-gray-400 bg-white"
                                      )}
                                    >
                                      {isSelected && (
                                        <div className="h-2 w-2 bg-black rounded-sm" />
                                      )}
                                    </div>
                                    <span className="flex-1 truncate">
                                      {subcategory.name}
                                    </span>
                                    <span className={cn(
                                      "text-xs flex-shrink-0",
                                      isSelected ? "text-white opacity-70" : "text-black opacity-50"
                                    )}>
                                      ({subcategory.productCount})
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* État vide */}
          {enrichedHierarchy.length === 0 && (
            <div className="text-center py-8 text-black opacity-50 text-sm">
              Aucune catégorie avec produits disponible
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
