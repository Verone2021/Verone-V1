/**
 * 🎨 DynamicColorSelector - Sélecteur de couleurs avec création dynamique
 *
 * Permet à l'utilisateur de :
 * - Rechercher parmi les couleurs existantes
 * - Créer une nouvelle couleur à la volée si introuvable
 * - Visualiser les codes hexadécimaux
 * - Sélectionner une couleur pour un produit/variante
 *
 * Utilisation :
 * ```tsx
 * <DynamicColorSelector
 *   value={selectedColor}
 *   onChange={(color) => setSelectedColor(color)}
 *   required={true}
 * />
 * ```
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Plus, Search, Loader2 } from 'lucide-react'
import { useColorSelection } from '@/hooks/use-product-colors'
import { cn } from '@/lib/utils'

interface DynamicColorSelectorProps {
  value?: string
  onChange: (color: string) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  excludeColors?: string[] // Couleurs à exclure (déjà utilisées)
}

export function DynamicColorSelector({
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Rechercher ou créer une couleur...',
  className,
  excludeColors = []
}: DynamicColorSelectorProps) {
  const {
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    filteredColors,
    colorExists,
    handleCreateAndSelect,
    isCreating,
    loading
  } = useColorSelection(value, excludeColors)

  const [isOpen, setIsOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync selectedColor with parent value
  useEffect(() => {
    if (value !== selectedColor) {
      setSelectedColor(value)
    }
  }, [value, selectedColor, setSelectedColor])

  // Notify parent when color changes
  useEffect(() => {
    if (selectedColor && selectedColor !== value) {
      onChange(selectedColor)
    }
  }, [selectedColor, onChange, value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setInputFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle color selection
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName)
    setSearchQuery('')
    setIsOpen(false)
    setInputFocused(false)
    onChange(colorName)
  }

  // Handle color creation
  const handleCreateColor = async () => {
    await handleCreateAndSelect()
    setIsOpen(false)
    setInputFocused(false)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsOpen(true)
  }

  // Handle input focus
  const handleInputFocus = () => {
    setInputFocused(true)
    setIsOpen(true)
  }

  // Get currently selected color object
  const selectedColorObj = filteredColors.find(c => c.name === selectedColor)

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-black mb-1.5">
        🎨 Couleur
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputFocused ? searchQuery : selectedColor || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          className={cn(
            'w-full pl-10 pr-10 py-2 border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            'text-sm'
          )}
        />

        {/* Color preview dot */}
        {selectedColorObj?.hex_code && !inputFocused && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: selectedColorObj.hex_code }}
            title={selectedColorObj.hex_code}
          />
        )}

        {/* Clear button when focused */}
        {inputFocused && searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Chargement des couleurs...
            </div>
          )}

          {/* No results */}
          {!loading && filteredColors.length === 0 && !searchQuery.trim() && (
            <div className="p-4 text-center text-sm text-gray-500">
              Aucune couleur disponible
            </div>
          )}

          {/* Color list */}
          {!loading && filteredColors.length > 0 && (
            <div className="py-1">
              {filteredColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleSelectColor(color.name)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left',
                    selectedColor === color.name && 'bg-gray-100'
                  )}
                >
                  {/* Color dot */}
                  {color.hex_code && (
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hex_code }}
                    />
                  )}

                  {/* Color name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      {color.name}
                    </div>
                    {color.hex_code && (
                      <div className="text-xs text-gray-500">
                        {color.hex_code}
                      </div>
                    )}
                  </div>

                  {/* Predefined badge */}
                  {color.is_predefined && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex-shrink-0">
                      Prédéfinie
                    </div>
                  )}

                  {/* Selected indicator */}
                  {selectedColor === color.name && (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create new color button */}
          {!loading &&
            searchQuery.trim() &&
            !colorExists &&
            filteredColors.length === 0 && (
              <div className="border-t">
                <button
                  type="button"
                  onClick={handleCreateColor}
                  disabled={isCreating}
                  className={cn(
                    'w-full px-3 py-3 flex items-center gap-2 hover:bg-green-50 transition-colors text-left',
                    'border-2 border-dashed border-green-300 m-2 rounded-lg',
                    isCreating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium text-green-700">
                    Créer "{searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1).toLowerCase()}"
                  </span>
                </button>
              </div>
            )}

          {/* Info footer */}
          {!loading && filteredColors.length > 0 && (
            <div className="border-t px-3 py-2 bg-gray-50">
              <div className="text-xs text-gray-600">
                {filteredColors.length} couleur{filteredColors.length > 1 ? 's' : ''} disponible{filteredColors.length > 1 ? 's' : ''}
                {excludeColors.length > 0 && (
                  <span className="ml-2 text-orange-600">
                    • {excludeColors.length} déjà utilisée{excludeColors.length > 1 ? 's' : ''}
                  </span>
                )}
                {searchQuery.trim() && !colorExists && (
                  <span className="ml-2 text-green-600">
                    • Tapez Entrée pour créer "{searchQuery}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      {!inputFocused && (
        <div className="mt-1.5 text-xs text-gray-500">
          Recherchez une couleur existante ou créez-en une nouvelle
        </div>
      )}
    </div>
  )
}

/**
 * Composant de sélection de couleurs avec création dynamique
 *
 * Fonctionnalités :
 * - Recherche autocomplete dans couleurs existantes
 * - Création à la volée si couleur introuvable
 * - Affichage code hexadécimal
 * - Badge prédéfinie/personnalisée
 * - Fallback vers couleurs par défaut si table inexistante
 *
 * Architecture :
 * - Utilise hook useColorSelection pour logique
 * - Dropdown custom avec gestion click outside
 * - État synchronisé avec parent via onChange
 * - Support required/disabled states
 *
 * Uniformisation :
 * - Utilisé dans tous formulaires produits/variantes/collections
 * - Remplace les select statiques de couleurs
 * - Couleurs persistées globalement en base
 */
