"use client"

import { useState } from 'react'
import { Edit2, Save, X, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import { generateVariantName } from '../../lib/business-rules/naming-rules'
import { CategoryHierarchySelector } from './category-hierarchy-selector'

interface Product {
  id: string
  name: string
  slug: string
  subcategory_id?: string
  supplier_id?: string
}

interface GeneralInfoEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function GeneralInfoEditSection({ product, onUpdate, className }: GeneralInfoEditSectionProps) {
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
      console.error('❌ Erreur mise à jour informations générales:', error)
    }
  })

  const section: EditableSection = 'general'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      name: product.name,
      slug: product.slug,
      subcategory_id: product.subcategory_id || '',
      supplier_id: product.supplier_id || ''
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      // Optionnel : afficher une notification de succès
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: string) => {
    const processedValue = value

    // Auto-generate slug from name if name is being edited
    if (field === 'name') {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '') // Remove leading and trailing hyphens

      updateEditedData(section, {
        [field]: processedValue,
        slug: autoSlug
      })
    } else {
      updateEditedData(section, { [field]: processedValue })
    }
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Edit2 className="h-5 w-5 mr-2" />
            Informations Générales
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nom du produit */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              value={editData?.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Nom du produit"
              required
            />
          </div>


          {/* Catégorisation */}
          <div>
            <CategoryHierarchySelector
              value={editData?.subcategory_id || ''}
              onChange={(subcategoryId, hierarchyInfo) => {
                updateEditedData(section, {
                  subcategory_id: subcategoryId || ''
                })
              }}
              placeholder="Sélectionner une sous-catégorie"
              required={true}
            />
          </div>

          {/* Slug (auto-généré) */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              URL Slug (auto-généré)
            </label>
            <input
              type="text"
              value={editData?.slug || ''}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-gray-50"
              placeholder="url-slug-produit"
            />
            <div className="text-xs text-gray-500 mt-1">
              Utilisé pour l'URL du produit. Se génère automatiquement depuis le nom.
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
          <FileText className="h-5 w-5 mr-2" />
          Informations Générales
        </h3>
        <Button variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit2 className="h-3 w-3 mr-1" />
          Modifier
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm text-black opacity-70">Nom:</span>
          <div className="text-lg font-semibold text-black">{product.name}</div>
        </div>
        <div>
          <span className="text-sm text-black opacity-70">URL Slug:</span>
          <div className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">{product.slug}</div>
        </div>
      </div>
    </div>
  )
}