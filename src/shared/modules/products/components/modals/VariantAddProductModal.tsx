'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, AlertCircle, ArrowRight } from 'lucide-react'
import { UniversalProductSelectorV2, SelectedProduct } from '@/components/business/universal-product-selector-v2'
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
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  const [color, setColor] = useState('')
  const [material, setMaterial] = useState('')
  const [commonWeight, setCommonWeight] = useState<number | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const newName = selectedProduct && (color || material)
    ? `${group?.name || ''} - ${[color, material].filter(Boolean).join(' - ')}`
    : group?.name || ''

  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setColor('')
      setMaterial('')
      setCommonWeight(undefined)
      setShowProductSelector(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedProduct?.variant_attributes) {
      setColor(selectedProduct.variant_attributes.color || '')
      setMaterial(selectedProduct.variant_attributes.material || '')
    }
  }, [selectedProduct])

  const handleProductSelect = (products: SelectedProduct[]) => {
    if (products.length > 0) {
      setSelectedProduct(products[0])
      setShowProductSelector(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || (!color && !material)) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        product_id: selectedProduct.id,
        variant_group_id: group?.id || ''
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
    <>
      <Dialog open={isOpen && !showProductSelector} onOpenChange={onClose}>
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
                {selectedProduct ? (
                  <div className="mt-2 p-4 border border-gray-300 rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedProduct.name}</div>
                      <div className="text-sm text-gray-600">{selectedProduct.sku}</div>
                    </div>
                    <ButtonV2
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                    >
                      Changer
                    </ButtonV2>
                  </div>
                ) : (
                  <ButtonV2
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductSelector(true)}
                    className="mt-2 w-full"
                  >
                    Sélectionner un produit
                  </ButtonV2>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Seuls les produits de la sous-catégorie "{group.subcategory?.name}" sans groupe de variantes sont disponibles
                </p>
              </div>

              {selectedProduct && (
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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-900">
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
                        <Badge variant="outline">{selectedProduct.name}</Badge>
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
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>
              <ButtonV2
                type="submit"
                disabled={!selectedProduct || (!color && !material) || isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter au groupe'}
              </ButtonV2>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* UniversalProductSelectorV2 - Filtre par subcategory_id */}
      {showProductSelector && group && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={handleProductSelect}
          mode="single"
          context="variants"
          title="Sélectionner un produit pour le groupe de variantes"
          description={`Groupe : ${group.name} • ${group.subcategory?.name}`}
          showQuantity={false}
          showPricing={false}
          showImages={true}
        />
      )}
    </>
  )
}
