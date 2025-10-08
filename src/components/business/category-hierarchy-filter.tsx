"use client"

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Tag } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'

interface Family {
  id: string
  name: string
  categories?: Category[]
}

interface Category {
  id: string
  name: string
  family_id: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface CategoryHierarchyFilterProps {
  families: Family[]
  categories: Category[]
  subcategories: Subcategory[]
  selectedSubcategories: string[]
  onSubcategoryToggle: (subcategoryId: string) => void
  className?: string
}

export function CategoryHierarchyFilter({
  families,
  categories,
  subcategories,
  selectedSubcategories,
  onSubcategoryToggle,
  className
}: CategoryHierarchyFilterProps) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [hasInitialExpand, setHasInitialExpand] = useState(false)

  // Auto-expand si des sous-catégories sont sélectionnées (UNIQUEMENT au chargement initial)
  useEffect(() => {
    if (selectedSubcategories.length > 0 && !hasInitialExpand) {
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
      setHasInitialExpand(true)
    }
  }, [selectedSubcategories, subcategories, categories, hasInitialExpand])

  const toggleFamily = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies)
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId)
    } else {
      newExpanded.add(familyId)
    }
    setExpandedFamilies(newExpanded)
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Wrapper pour gérer la sélection ET le repliage automatique
  const handleSubcategoryClick = (subcategoryId: string) => {
    // Trouver la catégorie parent de cette sous-catégorie
    const subcategory = subcategories.find(s => s.id === subcategoryId)
    if (subcategory) {
      const categoryId = subcategory.category_id

      // Appeler la fonction de toggle originale
      onSubcategoryToggle(subcategoryId)

      // Replier la catégorie parent immédiatement
      setExpandedCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    }
  }

  // Regrouper catégories par famille
  const getCategoriesForFamily = (familyId: string) => {
    return categories.filter(cat => cat.family_id === familyId)
  }

  // Regrouper sous-catégories par catégorie
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  // Compter le nombre de sélections dans une famille/catégorie
  const getSelectedCountForFamily = (familyId: string) => {
    const familyCategories = getCategoriesForFamily(familyId)
    let count = 0
    familyCategories.forEach(cat => {
      const catSubcategories = getSubcategoriesForCategory(cat.id)
      count += catSubcategories.filter(sub => selectedSubcategories.includes(sub.id)).length
    })
    return count
  }

  const getSelectedCountForCategory = (categoryId: string) => {
    const categorySubcategories = getSubcategoriesForCategory(categoryId)
    return categorySubcategories.filter(sub => selectedSubcategories.includes(sub.id)).length
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-black mb-2 flex items-center">
        <Tag className="h-4 w-4 mr-2" />
        Catégories
      </h3>

      <div className="space-y-1 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
        {families.map(family => {
          const isExpanded = expandedFamilies.has(family.id)
          const familyCategories = getCategoriesForFamily(family.id)
          const selectedCount = getSelectedCountForFamily(family.id)

          if (familyCategories.length === 0) return null

          return (
            <div key={family.id} className="space-y-1">
              {/* Famille */}
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedCount > 0 && "bg-blue-50"
                )}
                onClick={() => toggleFamily(family.id)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Folder className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{family.name}</span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* Catégories */}
              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {familyCategories.map(category => {
                    const isCategoryExpanded = expandedCategories.has(category.id)
                    const categorySubcategories = getSubcategoriesForCategory(category.id)
                    const categorySelectedCount = getSelectedCountForCategory(category.id)

                    if (categorySubcategories.length === 0) return null

                    return (
                      <div key={category.id} className="space-y-1">
                        {/* Catégorie */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors",
                            categorySelectedCount > 0 && "bg-green-50"
                          )}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-sm text-gray-700">{category.name}</span>
                            {categorySelectedCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                {categorySelectedCount}
                              </Badge>
                            )}
                          </div>
                          {isCategoryExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          )}
                        </div>

                        {/* Sous-catégories */}
                        {isCategoryExpanded && (
                          <div className="ml-4 space-y-1">
                            {categorySubcategories.map(subcategory => {
                              const isSelected = selectedSubcategories.includes(subcategory.id)

                              return (
                                <div
                                  key={subcategory.id}
                                  className={cn(
                                    "flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors text-sm",
                                    isSelected
                                      ? "bg-black text-white"
                                      : "text-gray-600 hover:bg-gray-100"
                                  )}
                                  onClick={() => handleSubcategoryClick(subcategory.id)}
                                >
                                  <div
                                    className={cn(
                                      "h-3 w-3 rounded border flex items-center justify-center flex-shrink-0",
                                      isSelected
                                        ? "bg-white border-white"
                                        : "border-gray-400"
                                    )}
                                  >
                                    {isSelected && (
                                      <div className="h-1.5 w-1.5 bg-black rounded-sm" />
                                    )}
                                  </div>
                                  <span className="flex-1">{subcategory.name}</span>
                                </div>
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
      </div>

      {/* Compteur de sélection */}
      {selectedSubcategories.length > 0 && (
        <div className="text-xs text-gray-600 flex items-center justify-between">
          <span>{selectedSubcategories.length} sous-catégorie{selectedSubcategories.length > 1 ? 's' : ''} sélectionnée{selectedSubcategories.length > 1 ? 's' : ''}</span>
          <button
            onClick={() => selectedSubcategories.forEach(onSubcategoryToggle)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Tout désélectionner
          </button>
        </div>
      )}
    </div>
  )
}
