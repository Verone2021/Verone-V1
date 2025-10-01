'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Check, AlertCircle, ArrowRight } from 'lucide-react'
import { useProducts } from '../../hooks/use-products'
import type { AddProductToGroupData, VariantGroup } from '../../types/variant-groups'

interface VariantAddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddProductToGroupData) => Promise<void>
  group: VariantGroup | null
}

export function VariantAddProductModal({
  isOpen,
  onClose,
  onSubmit,
  group
}: VariantAddProductModalProps) {
  const { products, loading: productsLoading } = useProducts()

  const [selectedProductId, setSelectedProductId] = useState('')
  const [color, setColor] = useState('')
  const [material, setMaterial] = useState('')
  const [commonWeight, setCommonWeight] = useState<number | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableProducts = useMemo(() => {
    if (!products || !group) return []
    return products.filter(p => !p.variant_group_id && p.subcategory_id === group.subcategory_id)
  }, [products, group])

  const selectedProduct = useMemo(() => {
    return availableProducts.find(p => p.id === selectedProductId)
  }, [availableProducts, selectedProductId])

  const newName = useMemo(() => {
    if (!group || !color && !material) return group?.name || ''
    const parts = [color, material].filter(Boolean)
    return `${group.name} - ${parts.join(' - ')}`
  }, [group, color, material])

  useEffect(() => {
    if (!isOpen) {
      setSelectedProductId('')
      setColor('')
      setMaterial('')
      setCommonWeight(undefined)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedProduct?.variant_attributes) {
      setColor(selectedProduct.variant_attributes.color || '')
      setMaterial(selectedProduct.variant_attributes.material || '')
    }
  }, [selectedProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || (!color && !material)) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        product_id: selectedProductId,
        variant_attributes: {
          color: color.trim() || undefined,
          material: material.trim() || undefined,
        }
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!group) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un produit au groupe</DialogTitle>
          <DialogDescription>
            Groupe : <strong>{group.name}</strong> • {group.subcategory?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product" className="text-sm font-medium">
                Produit à ajouter *
              </Label>
              <select
                id="product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                required
                disabled={productsLoading}
              >
                <option value="">Sélectionner un produit</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} • {product.sku}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {availableProducts.length === 0
                  ? 'Aucun produit disponible pour cette sous-catégorie'
                  : `${availableProducts.length} produit(s) disponible(s) dans cette sous-catégorie`
                }
              </p>
            </div>

            {selectedProductId && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color" className="text-sm font-medium">
                      Couleur
                    </Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ex: Noir, Blanc, Bleu"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="material" className="text-sm font-medium">
                      Matière
                    </Label>
                    <Input
                      id="material"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Ex: Bois, Métal, Tissu"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="common_weight" className="text-sm font-medium">
                    Poids commun (kg)
                  </Label>
                  <Input
                    id="common_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={commonWeight || ''}
                    onChange={(e) => setCommonWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Ex: 2.5"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Poids que tous les produits du groupe partageront
                  </p>
                </div>

                {(!color && !material) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Au moins une variante requise</p>
                      <p className="text-xs mt-1">Veuillez renseigner la couleur et/ou la matière</p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Aperçu des modifications
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Nom actuel :</span>
                      <Badge variant="outline">{selectedProduct?.name}</Badge>
                    </div>
                    <div className="flex items-center justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Nouveau nom :</span>
                      <Badge className="bg-blue-600 text-white">{newName}</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Propriétés conservées
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>✓ Prix de vente et coût</li>
                    <li>✓ Descriptions (technique, commerciale)</li>
                    <li>✓ Images et photos</li>
                    <li>✓ Stock et inventaire</li>
                    <li>✓ Fournisseur et références</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Propriétés synchronisées du groupe
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>→ Sous-catégorie : {group.subcategory?.name}</li>
                    {(group.dimensions_length || group.dimensions_width || group.dimensions_height) && (
                      <li>
                        → Dimensions : {group.dimensions_length || 0} × {group.dimensions_width || 0} × {group.dimensions_height || 0} {group.dimensions_unit}
                      </li>
                    )}
                    {commonWeight && (
                      <li>
                        → Poids commun : {commonWeight} kg
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!selectedProductId || (!color && !material) || isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter au groupe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}