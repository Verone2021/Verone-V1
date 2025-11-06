"use client"

import { useState, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'

interface Subcategory {
  id: string
  name: string
  categories?: {
    name: string
    families?: {
      name: string
    }
  }
}

interface SubcategorySearchSelectorProps {
  value?: string
  onChange: (subcategoryId: string) => void
  subcategories: Subcategory[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SubcategorySearchSelector({
  value,
  onChange,
  subcategories,
  placeholder = "Rechercher une sous-catégorie...",
  disabled = false,
  className
}: SubcategorySearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)

  // Recherche dans toute la hiérarchie
  const filteredSubcategories = subcategories.filter(sub => {
    const searchLower = searchTerm.toLowerCase()
    const subcategoryMatch = sub.name.toLowerCase().includes(searchLower)
    const categoryMatch = sub.categories?.name.toLowerCase().includes(searchLower)
    const familyMatch = sub.categories?.families?.name.toLowerCase().includes(searchLower)

    return subcategoryMatch || categoryMatch || familyMatch
  })

  // Mettre à jour la sélection quand la valeur change
  useEffect(() => {
    if (value) {
      const selected = subcategories.find(sub => sub.id === value)
      setSelectedSubcategory(selected || null)
    } else {
      setSelectedSubcategory(null)
    }
  }, [value, subcategories])

  const handleSelect = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory)
    onChange(subcategory.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getHierarchyText = (subcategory: Subcategory) => {
    if (!subcategory.categories) return subcategory.name

    const parts = []
    if (subcategory.categories.families?.name) {
      parts.push(subcategory.categories.families.name)
    }
    if (subcategory.categories.name) {
      parts.push(subcategory.categories.name)
    }
    parts.push(subcategory.name)

    return parts.join(' › ')
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Sous-catégorie *</Label>

      {/* Affichage de la sélection actuelle */}
      {selectedSubcategory && !isOpen && (
        <div
          className="p-3 border border-gray-300 rounded-md bg-gray-50 cursor-pointer flex items-center justify-between"
          onClick={() => !disabled && setIsOpen(true)}
        >
          <div>
            <div className="font-medium text-sm text-black">
              {selectedSubcategory.name}
            </div>
            <div className="text-xs text-gray-600">
              {getHierarchyText(selectedSubcategory)}
            </div>
          </div>
          {!disabled && <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      )}

      {/* Interface de recherche */}
      {(!selectedSubcategory || isOpen) && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="pl-10"
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {/* Liste des résultats */}
          {isOpen && (
            <div className="border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
              {filteredSubcategories.length > 0 ? (
                filteredSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSelect(subcategory)}
                  >
                    <div className="font-medium text-sm text-black">
                      {subcategory.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getHierarchyText(subcategory)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-gray-500">
                  Aucune sous-catégorie trouvée
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bouton pour changer la sélection */}
      {selectedSubcategory && !isOpen && (
        <ButtonV2
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full"
        >
          Changer de sous-catégorie
        </ButtonV2>
      )}
    </div>
  )
}