"use client"

import { useState } from 'react'
import { FileText, Save, X, Edit, AlertCircle, Plus } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Product {
  id: string
  description?: string | null
  technical_description?: string | null
  selling_points?: string[] | null
}

interface ProductDescriptionsEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function ProductDescriptionsEditSection({
  product,
  onUpdate,
  className
}: ProductDescriptionsEditSectionProps) {
  const [newSellingPoint, setNewSellingPoint] = useState('')

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
      console.error('❌ Erreur mise à jour descriptions:', error)
    }
  })

  const section: EditableSection = 'descriptions'
  const editData = getEditedData(section)
  const error = getError(section)

  // Données actuelles
  const currentDescription = product.description || ''
  const currentTechnicalDescription = product.technical_description || ''
  const currentSellingPoints = product.selling_points || []

  const handleStartEdit = () => {
    startEdit(section, {
      description: product.description || '',
      technical_description: product.technical_description || '',
      selling_points: product.selling_points || []
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Descriptions mises à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
    setNewSellingPoint('')
  }

  const handleFieldChange = (field: string, value: string | string[]) => {
    updateEditedData(section, { [field]: value })
  }

  const handleAddSellingPoint = () => {
    if (newSellingPoint.trim() && editData?.selling_points) {
      const currentPoints = editData.selling_points as string[]
      if (!currentPoints.includes(newSellingPoint.trim())) {
        handleFieldChange('selling_points', [...currentPoints, newSellingPoint.trim()])
        setNewSellingPoint('')
      }
    }
  }

  const handleRemoveSellingPoint = (index: number) => {
    if (editData?.selling_points) {
      const currentPoints = editData.selling_points as string[]
      handleFieldChange('selling_points', currentPoints.filter((_, i) => i !== index))
    }
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Descriptions
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
              variant="secondary"
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
          {/* DESCRIPTION GÉNÉRALE */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              📝 DESCRIPTION GÉNÉRALE
            </h4>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Description produit
              </label>
              <textarea
                value={editData?.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
                placeholder="Description générale du produit visible par les clients..."
                rows={5}
              />
              <div className="text-xs text-blue-600 mt-1">
                Description principale affichée aux clients (site, fiches produits, catalogues)
              </div>
            </div>
          </div>

          {/* CARACTÉRISTIQUES TECHNIQUES */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-3">
              🔧 CARACTÉRISTIQUES TECHNIQUES
            </h4>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Description technique
              </label>
              <textarea
                value={editData?.technical_description || ''}
                onChange={(e) => handleFieldChange('technical_description', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y min-h-[120px]"
                placeholder="Matériaux, dimensions, composition, spécifications techniques..."
                rows={5}
              />
              <div className="text-xs text-purple-600 mt-1">
                Détails techniques : matériaux, dimensions, composition, normes, entretien
              </div>
            </div>
          </div>

          {/* POINTS DE VENTE */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3">
              ✨ POINTS DE VENTE ({(editData?.selling_points as string[] || []).length} points)
            </h4>

            {/* Liste des points existants */}
            {(editData?.selling_points as string[] || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {(editData?.selling_points as string[]).map((point, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border border-green-200">
                    <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-1.5"></div>
                    <span className="flex-1 text-sm text-green-900">{point}</span>
                    <ButtonV2
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemoveSellingPoint(index)}
                      className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </ButtonV2>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter nouveau point */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Ajouter un point de vente
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSellingPoint}
                  onChange={(e) => setNewSellingPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSellingPoint()}
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="ex: Livraison rapide et gratuite"
                />
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={handleAddSellingPoint}
                  disabled={!newSellingPoint.trim()}
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4" />
                </ButtonV2>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Arguments de vente : avantages, points forts, différenciation, bénéfices clients
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
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
          <FileText className="h-5 w-5 mr-2" />
          Descriptions
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {/* Description générale */}
        {currentDescription ? (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">📝 DESCRIPTION GÉNÉRALE</div>
            <div className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
              {currentDescription}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-500 italic">Aucune description générale</div>
          </div>
        )}

        {/* Caractéristiques techniques */}
        {currentTechnicalDescription ? (
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-xs text-purple-600 font-medium mb-1">🔧 CARACTÉRISTIQUES TECHNIQUES</div>
            <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">
              {currentTechnicalDescription}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-500 italic">Aucune description technique</div>
          </div>
        )}

        {/* Points de vente */}
        {currentSellingPoints.length > 0 ? (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-xs text-green-600 font-medium mb-2">✨ POINTS DE VENTE ({currentSellingPoints.length})</div>
            <ul className="space-y-1">
              {currentSellingPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-900">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0 mt-2"></div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-500 italic">Aucun argument commercial</div>
          </div>
        )}

        {/* Message si aucune donnée */}
        {!currentDescription && !currentTechnicalDescription && currentSellingPoints.length === 0 && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Aucune description renseignée
          </div>
        )}
      </div>
    </div>
  )
}
