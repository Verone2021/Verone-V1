"use client"

/**
 * 🎯 Section Édition Poids Produit - Vérone Back Office
 *
 * Gestion du poids d'un produit avec système de verrouillage si poids commun défini au niveau groupe
 *
 * ✅ Affichage poids actuel
 * ✅ Mode édition inline
 * ✅ Lock si has_common_weight = true dans variant_group
 * ✅ Message informatif + lien vers groupe
 * ✅ Pattern identique à supplier-edit-section
 */

import { useState } from 'react'
import { Weight, Save, X, Edit, AlertCircle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInlineEdit, type EditableSection } from '@/shared/modules/common/hooks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Product {
  id: string
  weight?: number | null
  variant_group_id?: string | null
}

interface VariantGroup {
  id: string
  name: string
  has_common_weight?: boolean
  common_weight?: number | null
}

interface WeightEditSectionProps {
  product: Product
  variantGroup?: VariantGroup | null
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function WeightEditSection({
  product,
  variantGroup,
  onUpdate,
  className
}: WeightEditSectionProps) {
  // Lock si poids géré par le groupe
  const isWeightManagedByGroup = !!(
    variantGroup?.has_common_weight &&
    product.variant_group_id
  )

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
      console.error('❌ Erreur mise à jour poids:', error)
    }
  })

  const section: EditableSection = 'weight'
  const editData = getEditedData(section)
  const error = getError(section)

  const currentWeight = product.weight || null

  const handleStartEdit = () => {
    startEdit(section, {
      weight: product.weight || null
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Poids mis à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (value: number | null) => {
    updateEditedData(section, { weight: value })
  }

  // Mode édition
  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Weight className="h-5 w-5 mr-2" />
            Poids
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="outline"
              size="xs"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="xs"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium">
              Poids (kg)
            </Label>
            <div className="flex items-end space-x-2">
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={editData?.weight || ''}
                onChange={(e) =>
                  handleFieldChange(
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="0.00"
                className="flex-1"
              />
              <span className="text-sm text-gray-600 mb-2 min-w-[30px]">kg</span>
            </div>
          </div>
        </div>

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
          <Weight className="h-5 w-5 mr-2" />
          Poids
        </h3>
        {isWeightManagedByGroup ? (
          <p className="text-xs text-black">ℹ️ Géré par le groupe de variantes</p>
        ) : (
          <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </ButtonV2>
        )}
      </div>

      {isWeightManagedByGroup && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          ℹ️ Le poids est commun à toutes les variantes du groupe "{variantGroup?.name}".{' '}
          <a
            href={`/produits/catalogue/variantes/${variantGroup?.id}`}
            className="underline font-medium hover:text-blue-900"
          >
            Modifier depuis la page du groupe
          </a>
        </div>
      )}

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-xs text-gray-600 font-medium mb-1">⚖️ POIDS</div>
        <div className="text-gray-900 font-medium">
          {currentWeight ? `${currentWeight} kg` : 'Non défini'}
        </div>
      </div>
    </div>
  )
}
