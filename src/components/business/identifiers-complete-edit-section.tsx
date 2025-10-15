"use client"

import { useState } from 'react'
import { Tag, Save, X, Edit, Barcode, Award } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import { Badge } from '@/components/ui/badge'

interface Product {
  id: string
  sku: string
  slug?: string
  brand?: string
  gtin?: string
  condition?: string
}

interface IdentifiersCompleteEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function IdentifiersCompleteEditSection({
  product,
  onUpdate,
  className
}: IdentifiersCompleteEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges
  } = useInlineEdit({
    productId: product.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour identifiants:', error)
    }
  })

  const section: EditableSection = 'identifiers'
  const editData = getEditedData(section)
  const error = getError(section)

  const currentBrand = product.brand || '-'
  const currentGtin = product.gtin || '-'
  const currentCondition = product.condition || 'new'

  const conditionOptions = [
    { value: 'new', label: 'Neuf', color: 'bg-green-100 text-green-800' },
    { value: 'refurbished', label: 'Reconditionné', color: 'bg-blue-100 text-blue-800' },
    { value: 'used', label: 'Occasion', color: 'bg-gray-100 text-gray-900' }
  ]

  const handleStartEdit = () => {
    startEdit(section, {
      slug: product.slug || '',
      brand: product.brand || '',
      gtin: product.gtin || '',
      condition: product.condition || 'new'
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Identifiants mis à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: string) => {
    updateEditedData(section, { [field]: value })
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Identifiants & Références
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="outline"
              size="xs"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="xs"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-4">
          {/* SKU VÉRONE (lecture seule) */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              🏷️ SKU VÉRONE (auto-généré)
            </h4>
            <div className="font-mono text-lg font-bold text-gray-900">
              {product.sku}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Référence unique Vérone (non modifiable)
            </div>
          </div>

          {/* SLUG URL */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              🔗 SLUG URL
            </h4>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                URL Slug du produit
              </label>
              <input
                type="text"
                value={editData?.slug || ''}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="url-slug-produit"
              />
              <div className="text-xs text-blue-600 mt-1">
                Utilisé pour l'URL du produit (ex: /catalogue/url-slug-produit)
              </div>
            </div>
          </div>

          {/* MARQUE */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-3">
              <Award className="h-4 w-4 inline mr-1" />
              MARQUE
            </h4>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Marque du produit
              </label>
              <input
                type="text"
                value={editData?.brand || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="ex: Kartell, Fermob, Vitra"
              />
              <div className="text-xs text-purple-600 mt-1">
                Nom de la marque fabricant
              </div>
            </div>
          </div>

          {/* GTIN/CODE-BARRES */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              <Barcode className="h-4 w-4 inline mr-1" />
              GTIN / EAN / CODE-BARRES
            </h4>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Code-barres international
              </label>
              <input
                type="text"
                value={editData?.gtin || ''}
                onChange={(e) => handleFieldChange('gtin', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="ex: 3760123456789"
                pattern="[0-9]{8,14}"
                maxLength={14}
              />
              <div className="text-xs text-blue-600 mt-1">
                GTIN-8, GTIN-12, GTIN-13 ou GTIN-14 (8 à 14 chiffres)
              </div>
            </div>
          </div>

          {/* CONDITION/ÉTAT */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3">
              ✨ CONDITION/ÉTAT
            </h4>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                État du produit
              </label>
              <div className="space-y-2">
                {conditionOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={option.value}
                      checked={editData?.condition === option.value}
                      onChange={(e) => handleFieldChange('condition', e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-green-900">{option.label}</div>
                      <Badge className={cn("text-xs mt-1", option.color)}>
                        {option.value}
                      </Badge>
                    </div>
                  </label>
                ))}
              </div>
              <div className="text-xs text-green-600 mt-2">
                Sélectionner l'état physique du produit
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    )
  }

  // Mode affichage
  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Identifiants
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {/* SKU Vérone */}
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-xs text-gray-600 font-medium mb-1">🏷️ SKU VÉRONE</div>
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-mono font-bold">{product.sku}</span>
          </div>
        </div>

        {/* Slug URL */}
        {product.slug && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              🔗 SLUG URL
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-mono text-sm">{product.slug}</span>
            </div>
          </div>
        )}

        {/* Marque */}
        {product.brand && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-xs text-purple-600 font-medium mb-1">
              <Award className="h-3 w-3 inline mr-1" />
              MARQUE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-900 font-medium">{currentBrand}</span>
            </div>
          </div>
        )}

        {/* GTIN */}
        {product.gtin && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              <Barcode className="h-3 w-3 inline mr-1" />
              GTIN/CODE-BARRES
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-mono text-sm">{currentGtin}</span>
            </div>
          </div>
        )}

        {/* Condition */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium mb-1">✨ CONDITION</div>
          <div className="flex justify-between items-center">
            <Badge className={cn(
              "text-sm",
              currentCondition === 'new' ? 'bg-green-100 text-green-800' :
              currentCondition === 'refurbished' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-900'
            )}>
              {currentCondition === 'new' ? 'Neuf' :
               currentCondition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
            </Badge>
          </div>
        </div>

        {/* Message si données manquantes */}
        {!product.brand && !product.gtin && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Marque et code-barres non renseignés
          </div>
        )}
      </div>
    </div>
  )
}