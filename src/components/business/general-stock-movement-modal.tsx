'use client'

import React, { useState, useMemo } from 'react'
import { RefreshCw, AlertTriangle, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// Removed Command imports - using native list instead
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import { useStock } from '@/hooks/use-stock'
import { useCatalogue } from '@/hooks/use-catalogue'
import { useStockMovements, type StockReasonCode } from '@/hooks/use-stock-movements'
import { Badge } from '@/components/ui/badge'
import { StockDisplay } from './stock-display'

interface GeneralStockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GeneralStockMovementModal({ isOpen, onClose, onSuccess }: GeneralStockMovementModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [movementType, setMovementType] = useState<'add' | 'remove' | 'adjust'>('add')
  const [quantity, setQuantity] = useState('')
  const [reasonCode, setReasonCode] = useState<StockReasonCode>('manual_adjustment')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { toast } = useToast()
  const { createManualMovement } = useStock()
  const { products, loading: productsLoading } = useCatalogue()
  const { getReasonsByCategory, getReasonDescription } = useStockMovements()

  // Produit sélectionné
  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === selectedProductId)
  }, [products, selectedProductId])

  // Filtrage des produits pour la recherche
  const filteredProducts = useMemo(() => {
    if (!products) return []
    if (!productSearch) return products // Afficher TOUS les produits sans recherche

    const search = productSearch.toLowerCase()
    return products
      .filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search)
      )
      .slice(0, 50) // Limite plus élevée pour les résultats de recherche
  }, [products, productSearch])

  const currentStock = selectedProduct?.stock_real || 0
  const minLevel = selectedProduct?.min_stock_level || 5
  const reasonsByCategory = getReasonsByCategory()

  // Validation en temps réel
  const getValidationMessage = () => {
    if (!selectedProductId) return { type: 'error', message: 'Veuillez sélectionner un produit' }
    if (!quantity) return null

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) return { type: 'error', message: 'Quantité invalide' }

    if (movementType === 'remove' && qty > currentStock) {
      return {
        type: 'error',
        message: `Stock insuffisant (disponible: ${currentStock})`
      }
    }

    if (movementType === 'adjust') {
      const newStock = qty
      if (newStock < minLevel) {
        return {
          type: 'warning',
          message: `Attention: Stock sous le seuil minimum (${minLevel})`
        }
      }
    }

    if (movementType === 'remove') {
      const newStock = currentStock - qty
      if (newStock < minLevel) {
        return {
          type: 'warning',
          message: `Attention: Stock résultant sous le seuil (${newStock})`
        }
      }
    }

    return null
  }

  const validation = getValidationMessage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProductId) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner un produit",
        variant: "destructive"
      })
      return
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir une quantité valide supérieure à 0",
        variant: "destructive"
      })
      return
    }

    if (validation?.type === 'error') {
      toast({
        title: "Erreur",
        description: validation.message,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await createManualMovement({
        product_id: selectedProductId,
        movement_type: movementType,
        quantity: parseInt(quantity),
        reason_code: reasonCode,
        notes: notes.trim() || undefined,
        unit_cost: unitCost ? parseFloat(unitCost) : undefined
      })

      // Réinitialiser le formulaire après succès
      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProductId('')
    setProductSearch('')
    setQuantity('')
    setUnitCost('')
    setNotes('')
    setReasonCode('manual_adjustment')
    setMovementType('add')
    setShowAdvanced(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  // Suggestions de motifs selon le type de mouvement
  const getSuggestedReasons = () => {
    switch (movementType) {
      case 'add':
        return [...reasonsByCategory.entrees_speciales, ...reasonsByCategory.retours_sav]
      case 'remove':
        return [
          ...reasonsByCategory.pertes_degradations,
          ...reasonsByCategory.usage_commercial,
          ...reasonsByCategory.rd_production
        ]
      case 'adjust':
        return reasonsByCategory.ajustements
      default:
        return []
    }
  }

  const suggestedReasons = getSuggestedReasons()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mouvement de stock - Sélection produit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du produit */}
          <div className="space-y-3">
            <Label>
              Produit <span className="text-red-500">*</span>
            </Label>

            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productSearchOpen}
                  className="w-full justify-between h-auto min-h-[2.5rem] p-3"
                >
                  {selectedProduct ? (
                    <div className="flex items-center gap-3 text-left">
                      {selectedProduct.primary_image_url && (
                        <img
                          src={selectedProduct.primary_image_url}
                          alt={selectedProduct.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{selectedProduct.name}</div>
                        <div className="text-sm text-gray-600">{selectedProduct.sku}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Rechercher un produit...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" style={{ pointerEvents: 'auto' }}>
                <div className="flex flex-col" style={{ pointerEvents: 'auto' }}>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Rechercher par nom ou SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {productsLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        Chargement...
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucun produit trouvé
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setSelectedProductId(product.id)
                            setProductSearchOpen(false)
                            setProductSearch('')
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          style={{ pointerEvents: 'auto' }}
                        >
                          {product.primary_image_url && (
                            <img
                              src={product.primary_image_url}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">{product.sku}</div>
                          </div>
                          <StockDisplay
                            stock_real={product.stock_real || 0}
                            min_stock_level={product.min_stock_level}
                            size="sm"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Informations produit sélectionné */}
          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span><strong>SKU:</strong> {selectedProduct.sku}</span>
                <span><strong>Stock actuel:</strong> {currentStock} unités</span>
              </div>
              {currentStock <= minLevel && (
                <div className="flex items-center gap-2 mt-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Stock sous le seuil minimum ({minLevel})</span>
                </div>
              )}
            </div>
          )}

          {/* Type de mouvement */}
          <div className="space-y-3">
            <Label>Type d'opération</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={movementType === 'add' ? 'default' : 'outline'}
                onClick={() => setMovementType('add')}
                className="justify-start"
              >
                Ajouter (+)
              </Button>
              <Button
                type="button"
                variant={movementType === 'remove' ? 'default' : 'outline'}
                onClick={() => setMovementType('remove')}
                className="justify-start"
              >
                Retirer (-)
              </Button>
              <Button
                type="button"
                variant={movementType === 'adjust' ? 'default' : 'outline'}
                onClick={() => setMovementType('adjust')}
                className="justify-start"
              >
                Ajuster (=)
              </Button>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label>
              {movementType === 'adjust' ? 'Nouvelle quantité finale' : 'Quantité à traiter'}
            </Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={movementType === 'adjust' ? 'Quantité finale souhaitée' : 'Nombre d\'unités'}
              required
            />
            {validation && (
              <div className={`flex items-center gap-2 text-sm ${
                validation.type === 'error' ? 'text-red-600' : 'text-amber-600'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <span>{validation.message}</span>
              </div>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-3">
            <Label>Motif de l'opération</Label>

            {/* Motifs suggérés */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Motifs courants :</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedReasons.slice(0, 4).map((reason) => (
                  <Button
                    key={reason.code}
                    type="button"
                    variant={reasonCode === reason.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReasonCode(reason.code)}
                    className="justify-start text-left h-auto py-2"
                  >
                    <div>
                      <div className="font-medium">{reason.label}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Tous les motifs */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  {showAdvanced ? 'Masquer' : 'Voir tous les motifs'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <Select value={reasonCode} onValueChange={(value: StockReasonCode) => setReasonCode(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un motif détaillé" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reasonsByCategory).map(([category, reasons]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                          {category.replace('_', ' ')}
                        </div>
                        {reasons.map((reason) => (
                          <SelectItem key={reason.code} value={reason.code}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>

            {/* Description du motif sélectionné */}
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Motif sélectionné:</strong> {getReasonDescription(reasonCode)}
            </div>
          </div>

          {/* Notes obligatoires pour certains motifs */}
          <div className="space-y-2">
            <Label>
              Notes explicatives
              {['theft', 'loss_unknown', 'damage_transport', 'write_off'].includes(reasonCode) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails sur l'opération (obligatoire pour certains motifs)..."
              rows={3}
              required={['theft', 'loss_unknown', 'damage_transport', 'write_off'].includes(reasonCode)}
            />
          </div>

          {/* Coût unitaire optionnel */}
          {movementType === 'add' && (
            <div className="space-y-2">
              <Label>Coût unitaire (optionnel)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00 €"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || validation?.type === 'error' || !selectedProductId}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer le mouvement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}