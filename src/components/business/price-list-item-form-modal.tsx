'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Switch } from '../ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useProducts } from '@/hooks/use-products'
import {
  useCreatePriceListItem,
  useUpdatePriceListItem,
  usePriceListItems,
  usePriceList
} from '@/hooks/use-price-lists'
import { formatCurrency } from '@/lib/utils'

interface PriceListItemFormModalProps {
  open: boolean
  onClose: () => void
  priceListId: string
  itemId?: string | null
}

interface TierForm {
  min_quantity: number
  max_quantity: number | null
  price_ht: number
  discount_rate: number
  margin_rate: number
  valid_from: string
  valid_until: string
  is_active: boolean
  notes: string
}

export function PriceListItemFormModal({
  open,
  onClose,
  priceListId,
  itemId
}: PriceListItemFormModalProps) {
  const isEditMode = !!itemId

  // Product selection state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductSearch, setShowProductSearch] = useState(!isEditMode)

  // Tiers configuration state
  const [tiers, setTiers] = useState<TierForm[]>([
    {
      min_quantity: 1,
      max_quantity: null,
      price_ht: 0,
      discount_rate: 0,
      margin_rate: 0,
      valid_from: '',
      valid_until: '',
      is_active: true,
      notes: ''
    }
  ])

  // Hooks
  const { data: products } = useProducts({ search: productSearchTerm })
  const { data: priceList } = usePriceList(priceListId)
  const { data: existingItems } = usePriceListItems(priceListId)
  const { mutate: createItem, isPending: isCreating } = useCreatePriceListItem()
  const { mutate: updateItem, isPending: isUpdating } = useUpdatePriceListItem()

  const isLoading = isCreating || isUpdating

  // Load existing item in edit mode
  useEffect(() => {
    if (itemId && existingItems) {
      const item = existingItems.find(i => i.id === itemId)
      if (item) {
        setSelectedProduct(item.products)
        setTiers([{
          min_quantity: item.min_quantity,
          max_quantity: item.max_quantity,
          price_ht: item.price_ht,
          discount_rate: (item.discount_rate || 0) * 100, // Convert to percentage
          margin_rate: (item.margin_rate || 0) * 100,
          valid_from: item.valid_from || '',
          valid_until: item.valid_until || '',
          is_active: item.is_active,
          notes: item.notes || ''
        }])
        setShowProductSearch(false)
      }
    }
  }, [itemId, existingItems])

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setShowProductSearch(false)
    // Initialize first tier with product's base price
    setTiers([{
      ...tiers[0],
      price_ht: product.price_ht || 0
    }])
  }

  const handleAddTier = () => {
    // Add new tier with next logical min_quantity
    const lastTier = tiers[tiers.length - 1]
    const nextMinQty = lastTier.max_quantity ? lastTier.max_quantity + 1 : lastTier.min_quantity + 10

    setTiers([
      ...tiers,
      {
        min_quantity: nextMinQty,
        max_quantity: null,
        price_ht: lastTier.price_ht * 0.95, // Suggest 5% discount
        discount_rate: 0,
        margin_rate: 0,
        valid_from: lastTier.valid_from,
        valid_until: lastTier.valid_until,
        is_active: true,
        notes: ''
      }
    ])
  }

  const handleRemoveTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index))
    }
  }

  const handleTierChange = (index: number, field: keyof TierForm, value: any) => {
    const newTiers = [...tiers]
    newTiers[index] = {
      ...newTiers[index],
      [field]: value
    }
    setTiers(newTiers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct) {
      alert('Veuillez sélectionner un produit')
      return
    }

    // Validate tiers
    for (const tier of tiers) {
      if (tier.min_quantity < 1) {
        alert('La quantité minimum doit être au moins 1')
        return
      }
      if (tier.max_quantity !== null && tier.max_quantity < tier.min_quantity) {
        alert('La quantité maximum doit être supérieure à la quantité minimum')
        return
      }
      if (tier.price_ht <= 0) {
        alert('Le prix doit être supérieur à 0')
        return
      }
    }

    // Sort tiers by min_quantity
    const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)

    if (isEditMode && itemId) {
      // Update existing item (only one tier in edit mode)
      const tier = sortedTiers[0]
      updateItem(
        {
          itemId,
          priceListId,
          data: {
            price_ht: tier.price_ht,
            discount_rate: tier.discount_rate > 0 ? tier.discount_rate / 100 : null,
            min_quantity: tier.min_quantity,
            max_quantity: tier.max_quantity,
            margin_rate: tier.margin_rate > 0 ? tier.margin_rate / 100 : null,
            valid_from: tier.valid_from || undefined,
            valid_until: tier.valid_until || undefined,
            is_active: tier.is_active,
            notes: tier.notes || undefined
          }
        },
        {
          onSuccess: () => {
            onClose()
            resetForm()
          }
        }
      )
    } else {
      // Create multiple items (one per tier)
      let successCount = 0
      const totalTiers = sortedTiers.length

      for (const tier of sortedTiers) {
        await new Promise<void>((resolve) => {
          createItem(
            {
              price_list_id: priceListId,
              product_id: selectedProduct.id,
              price_ht: tier.price_ht,
              discount_rate: tier.discount_rate > 0 ? tier.discount_rate / 100 : undefined,
              min_quantity: tier.min_quantity,
              max_quantity: tier.max_quantity,
              margin_rate: tier.margin_rate > 0 ? tier.margin_rate / 100 : undefined,
              currency: priceList?.currency,
              valid_from: tier.valid_from || undefined,
              valid_until: tier.valid_until || undefined,
              is_active: tier.is_active,
              notes: tier.notes || undefined
            },
            {
              onSuccess: () => {
                successCount++
                if (successCount === totalTiers) {
                  onClose()
                  resetForm()
                }
                resolve()
              },
              onError: () => {
                resolve()
              }
            }
          )
        })
      }
    }
  }

  const resetForm = () => {
    setSelectedProduct(null)
    setProductSearchTerm('')
    setShowProductSearch(true)
    setTiers([{
      min_quantity: 1,
      max_quantity: null,
      price_ht: 0,
      discount_rate: 0,
      margin_rate: 0,
      valid_from: '',
      valid_until: '',
      is_active: true,
      notes: ''
    }])
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier le palier de prix' : 'Ajouter un produit avec paliers'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifiez les paramètres du palier de prix'
              : 'Configurez les paliers de prix manuellement pour ce produit'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          {showProductSearch && !isEditMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Sélectionner le Produit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par nom ou SKU..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {products && products.length > 0 && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Prix Catalogue</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">{product.sku}</span>
                              </TableCell>
                              <TableCell>{formatCurrency(product.price_ht)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSelectProduct(product)}
                                >
                                  Sélectionner
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Product Info */}
          {selectedProduct && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: <span className="font-mono">{selectedProduct.sku}</span> •
                      Prix catalogue: <span className="font-medium">{formatCurrency(selectedProduct.price_ht)}</span>
                    </p>
                  </div>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null)
                        setShowProductSearch(true)
                      }}
                    >
                      Changer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tiers Configuration */}
          {selectedProduct && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {isEditMode ? 'Paramètres du Palier' : '2. Configurer les Paliers de Prix'}
                  </CardTitle>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTier}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter Palier
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tiers.map((tier, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Palier {index + 1}</Badge>
                        {!isEditMode && tiers.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTier(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Quantités */}
                        <div className="space-y-2">
                          <Label htmlFor={`min_qty_${index}`}>
                            Quantité Minimum <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id={`min_qty_${index}`}
                            type="number"
                            min="1"
                            value={tier.min_quantity}
                            onChange={(e) => handleTierChange(index, 'min_quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`max_qty_${index}`}>Quantité Maximum</Label>
                          <Input
                            id={`max_qty_${index}`}
                            type="number"
                            min={tier.min_quantity}
                            value={tier.max_quantity || ''}
                            onChange={(e) => handleTierChange(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="∞ (illimité)"
                          />
                        </div>

                        {/* Prix et Remises */}
                        <div className="space-y-2">
                          <Label htmlFor={`price_${index}`}>
                            Prix HT ({priceList?.currency}) <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id={`price_${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.price_ht}
                            onChange={(e) => handleTierChange(index, 'price_ht', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`discount_${index}`}>Remise (%)</Label>
                          <Input
                            id={`discount_${index}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={tier.discount_rate}
                            onChange={(e) => handleTierChange(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`margin_${index}`}>Marge (%)</Label>
                          <Input
                            id={`margin_${index}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={tier.margin_rate}
                            onChange={(e) => handleTierChange(index, 'margin_rate', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>

                        {/* Validité */}
                        <div className="space-y-2">
                          <Label htmlFor={`valid_from_${index}`}>Date Début Validité</Label>
                          <Input
                            id={`valid_from_${index}`}
                            type="date"
                            value={tier.valid_from}
                            onChange={(e) => handleTierChange(index, 'valid_from', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`valid_until_${index}`}>Date Fin Validité</Label>
                          <Input
                            id={`valid_until_${index}`}
                            type="date"
                            value={tier.valid_until}
                            onChange={(e) => handleTierChange(index, 'valid_until', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor={`notes_${index}`}>Notes</Label>
                        <Textarea
                          id={`notes_${index}`}
                          value={tier.notes}
                          onChange={(e) => handleTierChange(index, 'notes', e.target.value)}
                          placeholder="Notes optionnelles sur ce palier"
                          rows={2}
                        />
                      </div>

                      {/* Active toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Label htmlFor={`active_${index}`}>Palier actif</Label>
                        <Switch
                          id={`active_${index}`}
                          checked={tier.is_active}
                          onCheckedChange={(checked) => handleTierChange(index, 'is_active', checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !selectedProduct}>
              {isLoading
                ? 'Enregistrement...'
                : isEditMode
                ? 'Mettre à jour'
                : `Créer ${tiers.length} palier${tiers.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
