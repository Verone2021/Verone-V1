"use client"

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'

// Couleurs prédéfinies selon business rules
const PREDEFINED_COLORS = [
  { value: 'Blanc', label: 'Blanc', hex: '#FFFFFF' },
  { value: 'Noir', label: 'Noir', hex: '#000000' },
  { value: 'Rouge', label: 'Rouge', hex: '#DC2626' },
  { value: 'Bleu', label: 'Bleu', hex: '#2563EB' },
  { value: 'Vert', label: 'Vert', hex: '#16A34A' },
  { value: 'Jaune', label: 'Jaune', hex: '#CA8A04' },
  { value: 'Orange', label: 'Orange', hex: '#EA580C' },
  { value: 'Violet', label: 'Violet', hex: '#9333EA' },
  { value: 'Rose', label: 'Rose', hex: '#EC4899' },
  { value: 'Gris', label: 'Gris', hex: '#6B7280' },
  { value: 'Beige', label: 'Beige', hex: '#F5F5DC' },
  { value: 'Marron', label: 'Marron', hex: '#92400E' },
  { value: 'Doré', label: 'Doré', hex: '#D97706' },
  { value: 'Argenté', label: 'Argenté', hex: '#9CA3AF' },
  { value: 'Transparent', label: 'Transparent', hex: '#F9FAFB' }
]

// Matières prédéfinies selon business rules
const PREDEFINED_MATERIALS = [
  { value: 'Bois', label: 'Bois', description: 'Matériau naturel' },
  { value: 'Métal', label: 'Métal', description: 'Acier, aluminium, laiton...' },
  { value: 'Cuir', label: 'Cuir', description: 'Cuir véritable' },
  { value: 'Tissu', label: 'Tissu', description: 'Textile, velours, lin...' },
  { value: 'Céramique', label: 'Céramique', description: 'Porcelaine, grès...' },
  { value: 'Verre', label: 'Verre', description: 'Verre transparent ou coloré' },
  { value: 'Plastique', label: 'Plastique', description: 'Plastique recyclé ou non' },
  { value: 'Pierre', label: 'Pierre', description: 'Marbre, granit, ardoise...' },
  { value: 'Rotin', label: 'Rotin', description: 'Matériau naturel tressé' },
  { value: 'Bambou', label: 'Bambou', description: 'Matériau écologique' },
  { value: 'Liège', label: 'Liège', description: 'Matériau naturel isolant' },
  { value: 'Jute', label: 'Jute', description: 'Fibre végétale naturelle' },
  { value: 'Sisal', label: 'Sisal', description: 'Fibre végétale résistante' },
  { value: 'Corde', label: 'Corde', description: 'Corde naturelle ou synthétique' },
  { value: 'Papier', label: 'Papier', description: 'Papier, carton...' }
]

interface ColorSelectorProps {
  value?: string
  onChange: (color: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface MaterialSelectorProps {
  value?: string
  onChange: (material: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Composant sélecteur de couleur
export function ColorSelector({
  value,
  onChange,
  placeholder = "Sélectionner une couleur...",
  disabled = false,
  className
}: ColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedColor = PREDEFINED_COLORS.find(color => color.value === value)

  const handleSelect = (color: typeof PREDEFINED_COLORS[0]) => {
    onChange(color.value)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Bouton sélecteur */}
      <ButtonV2
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between text-left font-normal",
          !selectedColor && "text-gray-500"
        )}
      >
        <div className="flex items-center">
          {selectedColor && (
            <div
              className="w-4 h-4 rounded-full mr-2 border border-gray-300"
              style={{ backgroundColor: selectedColor.hex }}
            />
          )}
          <span className="truncate">
            {selectedColor ? selectedColor.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </ButtonV2>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleSelect(color)}
                className={cn(
                  "w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between",
                  value === color.value && "bg-black text-white hover:bg-gray-800"
                )}
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3 border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.label}</span>
                </div>
                {value === color.value && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant sélecteur de matière
export function MaterialSelector({
  value,
  onChange,
  placeholder = "Sélectionner une matière...",
  disabled = false,
  className
}: MaterialSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedMaterial = PREDEFINED_MATERIALS.find(material => material.value === value)

  const handleSelect = (material: typeof PREDEFINED_MATERIALS[0]) => {
    onChange(material.value)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Bouton sélecteur */}
      <ButtonV2
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between text-left font-normal",
          !selectedMaterial && "text-gray-500"
        )}
      >
        <span className="truncate">
          {selectedMaterial ? selectedMaterial.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </ButtonV2>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1">
            {PREDEFINED_MATERIALS.map((material) => (
              <button
                key={material.value}
                type="button"
                onClick={() => handleSelect(material)}
                className={cn(
                  "w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between",
                  value === material.value && "bg-black text-white hover:bg-gray-800"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{material.label}</div>
                  <div className={cn(
                    "text-xs opacity-70",
                    value === material.value ? "text-white" : "text-gray-500"
                  )}>
                    {material.description}
                  </div>
                </div>
                {value === material.value && (
                  <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant combiné couleur + matière
interface ColorMaterialSelectorProps {
  colorValue?: string
  materialValue?: string
  onColorChange: (color: string) => void
  onMaterialChange: (material: string) => void
  disabled?: boolean
  className?: string
}

export function ColorMaterialSelector({
  colorValue,
  materialValue,
  onColorChange,
  onMaterialChange,
  disabled = false,
  className
}: ColorMaterialSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Couleur <span className="text-red-500">*</span>
        </label>
        <ColorSelector
          value={colorValue}
          onChange={onColorChange}
          disabled={disabled}
          placeholder="Choisir la couleur..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Matière <span className="text-red-500">*</span>
        </label>
        <MaterialSelector
          value={materialValue}
          onChange={onMaterialChange}
          disabled={disabled}
          placeholder="Choisir la matière..."
        />
      </div>
    </div>
  )
}