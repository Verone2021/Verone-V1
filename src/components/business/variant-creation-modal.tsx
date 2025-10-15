"use client"

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Copy, Palette, Layers } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductData {
  id: string
  name: string
  sku: string
  supplier_id?: string
  supplier?: {
    id: string
    name: string
  }
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  dimensions_unit?: string
  weight?: number
  weight_unit?: string
  base_cost?: number
  selling_price?: number
  description?: string
  technical_description?: string
  category_id?: string
  subcategory_id?: string
  variant_group_id?: string
}

interface VariantCreationModalProps {
  isOpen: boolean
  onClose: () => void
  productData: ProductData
  onVariantCreated?: () => void
}

export function VariantCreationModal({
  isOpen,
  onClose,
  productData,
  onVariantCreated
}: VariantCreationModalProps) {
  const [color, setColor] = useState('')
  const [material, setMaterial] = useState('')
  const [additionalNote, setAdditionalNote] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setColor('')
      setMaterial('')
      setAdditionalNote('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreateVariant = async () => {
    if (!color && !material) {
      setError('Veuillez renseigner au moins la couleur ou la matière')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const variantAttributes: Record<string, string> = {}
      if (color) variantAttributes.color = color
      if (material) variantAttributes.material = material

      const variantSuffix = [color, material].filter(Boolean).join(' - ')

      const response = await fetch(`/api/products/${productData.id}/variants/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variant_attributes: variantAttributes,
          additional_note: additionalNote || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la variante')
      }

      setSuccess(true)
      setTimeout(() => {
        if (onVariantCreated) onVariantCreated()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('❌ Erreur création variante:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Créer une Variante
          </h2>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isCreating}
          >
            <X className="h-4 w-4" />
          </ButtonV2>
        </div>

        <div className="p-6 space-y-6">
          {/* Données copiées automatiquement */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Copy className="h-4 w-4 mr-2" />
              Données copiées automatiquement
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom produit:</span>
                <span className="font-medium text-gray-900">{productData.name}</span>
              </div>

              {productData.supplier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fournisseur:</span>
                  <span className="font-medium text-blue-900">{productData.supplier.name}</span>
                </div>
              )}

              {(productData.dimensions_length || productData.dimensions_width || productData.dimensions_height) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium text-gray-900 font-mono">
                    {productData.dimensions_length || 0} × {productData.dimensions_width || 0} × {productData.dimensions_height || 0} {productData.dimensions_unit || 'cm'}
                  </span>
                </div>
              )}

              {productData.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Poids:</span>
                  <span className="font-medium text-gray-900 font-mono">
                    {productData.weight} {productData.weight_unit || 'kg'}
                  </span>
                </div>
              )}

              {productData.category_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Catégorie:</span>
                  <Badge variant="outline" className="text-xs">Identique</Badge>
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-gray-500 italic">
              ℹ️ Ces informations seront identiques pour la variante (règle métier)
            </div>
          </div>

          {/* Champs différenciants */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-900 mb-4 flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Attributs différenciants (obligatoire)
            </h3>

            <div className="space-y-4">
              {/* Couleur */}
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  <Palette className="h-3 w-3 inline mr-1" />
                  Couleur
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="ex: Noir, Blanc Cassé, Gris Anthracite"
                  disabled={isCreating}
                />
                <div className="text-xs text-purple-600 mt-1">
                  Couleur spécifique de cette variante
                </div>
              </div>

              {/* Matière */}
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  <Layers className="h-3 w-3 inline mr-1" />
                  Matière
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="ex: Chêne Massif, Métal Laqué, Tissu Velours"
                  disabled={isCreating}
                />
                <div className="text-xs text-purple-600 mt-1">
                  Matière spécifique de cette variante
                </div>
              </div>

              {/* Note additionnelle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note additionnelle (optionnel)
                </label>
                <textarea
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Détails supplémentaires pour différencier cette variante..."
                  rows={3}
                  disabled={isCreating}
                />
              </div>
            </div>
          </div>

          {/* Aperçu SKU */}
          {(color || material) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium mb-1">
                APERÇU NOM VARIANTE
              </div>
              <div className="font-medium text-blue-900">
                {productData.name} - {[color, material].filter(Boolean).join(' - ')}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                SKU sera auto-généré à la création
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
              <div className="text-sm text-green-800 font-medium">
                ✅ Variante créée avec succès ! Redirection...
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-2">
          <ButtonV2
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={handleCreateVariant}
            disabled={isCreating || (!color && !material)}
            className="bg-black hover:bg-gray-800"
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Création...' : 'Créer la Variante'}
          </ButtonV2>
        </div>
      </div>
    </div>
  )
}