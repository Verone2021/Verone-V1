"use client"

import { useState } from 'react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StandardModifyButton } from '@/components/ui/standard-modify-button'
import { Save, X, FileText, Package, Star } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Product {
  id: string
  name: string
  description?: string
  variant_attributes?: Record<string, any>
  selling_points?: string[]
}

interface UnifiedDescriptionEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function UnifiedDescriptionEditSection({
  product,
  onUpdate,
  className
}: UnifiedDescriptionEditSectionProps) {
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
      console.error('❌ Erreur mise à jour description unifiée:', error)
    }
  })

  const section: EditableSection = 'description'
  const editData = getEditedData(section)
  const error = getError(section)


  const handleStartEdit = () => {
    startEdit(section, {
      description: product.description || '',
      selling_points: product.selling_points || []
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Description unifiée mise à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: any) => {
    updateEditedData(section, { [field]: value })
  }


  const addSellingPoint = () => {
    const currentPoints = editData?.selling_points || []
    updateEditedData(section, {
      selling_points: [...currentPoints, '']
    })
  }

  const updateSellingPoint = (index: number, value: string) => {
    const currentPoints = editData?.selling_points || []
    const newPoints = [...currentPoints]
    newPoints[index] = value
    updateEditedData(section, {
      selling_points: newPoints
    })
  }

  const removeSellingPoint = (index: number) => {
    const currentPoints = editData?.selling_points || []
    const newPoints = currentPoints.filter((_, i) => i !== index)
    updateEditedData(section, {
      selling_points: newPoints
    })
  }

  if (isEditing(section)) {
    return (
      <div className={cn("bg-white border border-black p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-black flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Description Complète
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1 h-6"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1 h-6"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-6">
          {/* Description + Caractéristiques principales */}
          <div>
            <Label className="text-sm font-medium text-black mb-2 block">
              📝 Description + Caractéristiques principales
            </Label>
            <Textarea
              value={editData?.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="min-h-[120px] border-gray-300 focus:border-black focus:ring-black"
              placeholder="Description détaillée et caractéristiques principales du produit..."
            />
          </div>

          {/* Points de vente */}
          <div>
            <Label className="text-sm font-medium text-black mb-3 block flex items-center">
              <Star className="h-4 w-4 mr-1" />
              ⭐ Points de vente
            </Label>
            <div className="space-y-2">
              {(editData?.selling_points || []).map((point: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={point}
                    onChange={(e) => updateSellingPoint(index, e.target.value)}
                    className="flex-1 text-sm border-gray-300 focus:border-black focus:ring-black"
                    placeholder="Point de vente attractif..."
                  />
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={() => removeSellingPoint(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </ButtonV2>
                </div>
              ))}
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={addSellingPoint}
                className="text-xs"
              >
                <Package className="h-3 w-3 mr-1" />
                Ajouter un point de vente
              </ButtonV2>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    )
  }

  // Mode affichage
  return (
    <div className={cn("bg-white border border-black p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Description & Caractéristiques
        </h3>
        <StandardModifyButton onClick={handleStartEdit} />
      </div>

      <div className="space-y-4">
        {/* Description + Caractéristiques principales */}
        {product.description && (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">📝 Description + Caractéristiques principales</div>
            <p className="text-gray-900 text-sm whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {/* Points de vente */}
        {product.selling_points && product.selling_points.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <Star className="h-4 w-4 mr-1" />
              ⭐ Points de vente
            </div>
            <div className="space-y-1">
              {product.selling_points.map((point, index) => (
                <div key={index} className="flex items-center text-sm text-gray-900">
                  <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si vide */}
        {!product.description &&
         (!product.selling_points || product.selling_points.length === 0) && (
          <div className="text-center text-gray-400 text-sm italic py-4">
            Aucune description ou point de vente défini
          </div>
        )}
      </div>
    </div>
  )
}