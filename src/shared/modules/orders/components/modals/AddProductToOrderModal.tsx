'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UniversalProductSelectorV2, SelectedProduct } from '@/components/business/universal-product-selector-v2'
import { formatCurrency } from '@/lib/utils'
import type { OrderType, CreateOrderItemData } from '@/shared/modules/orders/hooks'

/**
 * Modal Universel Ajout Produit à Commande
 *
 * Composant réutilisable pour achats ET ventes.
 * Utilise UniversalProductSelectorV2 pour la sélection produit.
 * Affiche prix indicatifs selon orderType (cost_price vs min_selling_price).
 * Permet configuration complète item (quantité, prix, remise, éco-taxe, TVA si ventes).
 */

interface AddProductToOrderModalProps {
  open: boolean
  onClose: () => void
  orderType: OrderType
  onAdd: (data: CreateOrderItemData) => Promise<void> | void
}

interface ProductImage {
  public_url: string
  is_primary: boolean
  display_order?: number
}

export function AddProductToOrderModal({
  open,
  onClose,
  orderType,
  onAdd
}: AddProductToOrderModalProps) {
  // États
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [ecoTax, setEcoTax] = useState(0)
  const [taxRate, setTaxRate] = useState(0.20)  // TVA 20% par défaut (ventes)
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Auto-remplir prix/éco-taxe quand produit sélectionné
  useEffect(() => {
    if (selectedProduct) {
      // Prix selon orderType
      const defaultPrice = orderType === 'purchase'
        ? (selectedProduct as any).cost_price || 0
        : (selectedProduct as any).min_selling_price || 0

      setUnitPrice(defaultPrice)
      setEcoTax((selectedProduct as any).eco_tax_default || 0)
    }
  }, [selectedProduct, orderType])

  // Calculer totaux aperçu
  const previewSubtotal = quantity * unitPrice * (1 - discountPercentage / 100)
  const previewTotal = previewSubtotal + ecoTax

  // Labels dynamiques selon orderType
  const getPriceLabel = () =>
    orderType === 'purchase' ? 'Prix achat indicatif' : 'Prix vente min indicatif'

  const getModalTitle = () =>
    orderType === 'purchase'
      ? 'Ajouter un produit à la commande fournisseur'
      : 'Ajouter un produit à la commande client'

  // Récupérer image primaire produit
  const getPrimaryImage = (product: any): string | null => {
    const images = product.product_images as ProductImage[] | undefined
    return images?.find(img => img.is_primary)?.public_url ||
           images?.[0]?.public_url ||
           null
  }

  // Gérer sélection produit depuis UniversalProductSelectorV2
  const handleProductSelect = (products: SelectedProduct[]) => {
    if (products.length > 0) {
      setSelectedProduct(products[0])
      // Si des quantités/prix sont déjà renseignés dans le sélecteur, les utiliser
      if (products[0].quantity) setQuantity(products[0].quantity)
      if (products[0].unit_price) setUnitPrice(products[0].unit_price)
      if (products[0].discount_percentage) setDiscountPercentage(products[0].discount_percentage)
      setShowProductSelector(false)
    }
  }

  // Gérer ajout produit
  const handleAdd = async () => {
    if (!selectedProduct) return

    // Validation
    if (quantity <= 0) {
      alert('La quantité doit être supérieure à 0')
      return
    }

    if (unitPrice < 0) {
      alert('Le prix unitaire ne peut pas être négatif')
      return
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      alert('La remise doit être entre 0 et 100%')
      return
    }

    if (ecoTax < 0) {
      alert('L\'éco-taxe ne peut pas être négative')
      return
    }

    setIsAdding(true)

    try {
      // Préparer données item
      const itemData: CreateOrderItemData = {
        product_id: selectedProduct.id,
        quantity,
        unit_price_ht: unitPrice,
        discount_percentage: discountPercentage,
        eco_tax: ecoTax,
        notes: notes.trim() || undefined
      }

      // Ajouter TVA si ventes
      if (orderType === 'sales') {
        itemData.tax_rate = taxRate
      }

      // Appeler callback parent
      await onAdd(itemData)

      // Reset et fermer
      resetForm()
      onClose()
    } catch (err) {
      console.error('❌ Erreur ajout produit:', err)
      alert(`Erreur lors de l'ajout du produit: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setIsAdding(false)
    }
  }

  // Reset formulaire
  const resetForm = () => {
    setSelectedProduct(null)
    setQuantity(1)
    setUnitPrice(0)
    setDiscountPercentage(0)
    setEcoTax(0)
    setTaxRate(0.20)
    setNotes('')
    setShowProductSelector(false)
  }

  // Reset au close
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <>
      <Dialog open={open && !showProductSelector} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            <DialogDescription>
              Sélectionnez un produit puis configurez la quantité, le prix et les options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* SECTION 1 : Sélection Produit */}
            <div className="space-y-4">
              <Label>Produit *</Label>
              {selectedProduct ? (
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    {getPrimaryImage(selectedProduct) && (
                      <img
                        src={getPrimaryImage(selectedProduct)!}
                        alt={selectedProduct.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">{selectedProduct.sku}</p>
                      <p className="text-sm text-primary mt-1">
                        {orderType === 'purchase'
                          ? `Achat: ${formatCurrency((selectedProduct as any).cost_price || 0)}`
                          : `Vente min: ${formatCurrency((selectedProduct as any).min_selling_price || 0)}`
                        }
                      </p>
                    </div>
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                    >
                      Changer
                    </ButtonV2>
                  </div>
                </Card>
              ) : (
                <ButtonV2
                  variant="outline"
                  onClick={() => setShowProductSelector(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Sélectionner un produit
                </ButtonV2>
              )}
            </div>

            {/* SECTION 2 : Configuration Item (si produit sélectionné) */}
            {selectedProduct && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Configuration de la ligne</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quantité avec +/- */}
                    <div>
                      <Label>Quantité *</Label>
                      <div className="flex gap-2 items-center mt-2">
                        <ButtonV2
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </ButtonV2>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-center"
                          min="1"
                        />
                        <ButtonV2
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </ButtonV2>
                      </div>
                    </div>

                    {/* Prix unitaire */}
                    <div>
                      <Label>
                        Prix unitaire HT * €
                        <span className="text-xs text-gray-500 ml-2 font-normal">
                          ({getPriceLabel()}: {formatCurrency(
                            orderType === 'purchase'
                              ? (selectedProduct as any).cost_price || 0
                              : (selectedProduct as any).min_selling_price || 0
                          )})
                        </span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="mt-2"
                        min="0"
                      />
                    </div>

                    {/* Remise */}
                    <div>
                      <Label>Remise %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-2"
                      />
                    </div>

                    {/* Éco-taxe */}
                    <div>
                      <Label>
                        Éco-taxe €
                        <span className="text-xs text-gray-500 ml-2 font-normal">
                          (indicative: {formatCurrency((selectedProduct as any).eco_tax_default || 0)})
                        </span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={ecoTax}
                        onChange={(e) => setEcoTax(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="mt-2"
                        min="0"
                      />
                    </div>

                    {/* TVA (VENTES UNIQUEMENT) */}
                    {orderType === 'sales' && (
                      <div>
                        <Label>Taux TVA %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={taxRate * 100}
                          onChange={(e) => setTaxRate((parseFloat(e.target.value) || 20) / 100)}
                          placeholder="20"
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Notes ligne */}
                  <div>
                    <Label>Notes (optionnel)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Commentaire spécifique à cette ligne..."
                      rows={2}
                      className="mt-2"
                    />
                  </div>

                  {/* Aperçu total */}
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-semibold mb-3">Aperçu</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sous-total HT:</span>
                        <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Éco-taxe:</span>
                        <span className="font-medium">{formatCurrency(ecoTax)}</span>
                      </div>
                      {discountPercentage > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Remise ({discountPercentage}%):</span>
                          <span>-{formatCurrency(quantity * unitPrice * (discountPercentage / 100))}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total ligne HT:</span>
                        <span className="font-bold text-primary">{formatCurrency(previewTotal)}</span>
                      </div>
                      {orderType === 'sales' && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>TVA ({(taxRate * 100).toFixed(1)}%):</span>
                          <span>{formatCurrency(previewTotal * taxRate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <ButtonV2 variant="outline" onClick={onClose} disabled={isAdding}>
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleAdd}
              disabled={!selectedProduct || isAdding}
            >
              {isAdding ? (
                'Ajout en cours...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter à la commande
                </>
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UniversalProductSelectorV2 - Avec quantité et pricing */}
      {showProductSelector && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={handleProductSelect}
          mode="single"
          context="orders"
          title={`Sélectionner un produit pour la commande ${orderType === 'purchase' ? 'fournisseur' : 'client'}`}
          description="Recherchez et sélectionnez le produit à ajouter"
          showQuantity={true}
          showPricing={true}
          showImages={true}
        />
      )}
    </>
  )
}
