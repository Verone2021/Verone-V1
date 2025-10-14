'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateOrganisationModal } from './create-organisation-modal'
import { useOrganisations, Organisation } from '@/hooks/use-organisations'
import { useProducts } from '@/hooks/use-products'
import { usePurchaseOrders, CreatePurchaseOrderData, CreatePurchaseOrderItemData } from '@/hooks/use-purchase-orders'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface PurchaseOrderFormModalProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  prefilledProduct?: any
  prefilledSupplier?: string
}

interface OrderItem extends CreatePurchaseOrderItemData {
  id: string
  product?: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
    cost_price?: number  // Prix d'achat catalogue pour comparaison
  }
}

export function PurchaseOrderFormModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledProduct,
  prefilledSupplier
}: PurchaseOrderFormModalProps) {
  const [open, setOpen] = useState(isOpen || false)
  const [loading, setLoading] = useState(false)

  // Form data
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Organisation | null>(null)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  // Adresse d'entrepôt par défaut
  const [deliveryAddress, setDeliveryAddress] = useState('Groupe DSA - (Verone)\n4, rue du Pérou\n91300 Massy\nFrance')
  const [notes, setNotes] = useState('')

  // Items management
  const [items, setItems] = useState<OrderItem[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')

  // Hooks
  const { organisations: suppliers, getOrganisationById, refetch: refetchSuppliers } = useOrganisations({ type: 'supplier', is_active: true })
  // Filtrer les produits par fournisseur sélectionné
  const { products } = useProducts({
    search: productSearchTerm,
    supplier_id: selectedSupplierId || undefined
  })
  const { createOrder } = usePurchaseOrders()
  const { toast } = useToast()

  // Synchroniser avec les props externes
  useEffect(() => {
    if (typeof isOpen !== 'undefined') {
      setOpen(isOpen)
    }
  }, [isOpen])

  // Pré-remplir avec produit fourni
  useEffect(() => {
    if (prefilledProduct && open) {
      // Vérifier si le produit n'est pas déjà dans les items
      const existingItem = items.find(item => item.product_id === prefilledProduct.id)
      if (!existingItem) {
        const newItem: OrderItem = {
          id: Math.random().toString(36).substr(2, 9),
          product_id: prefilledProduct.id,
          quantity: 1, // Quantité échantillon par défaut
          unit_price_ht: prefilledProduct.cost_price || 0,
          discount_percentage: 0,
          notes: 'Échantillon pour validation',
          product: {
            id: prefilledProduct.id,
            name: prefilledProduct.name || 'Produit sans nom',
            sku: prefilledProduct.sku || '',
            primary_image_url: prefilledProduct.primary_image_url,
            cost_price: prefilledProduct.cost_price  // Stocker prix catalogue pour comparaison
          }
        }
        setItems([newItem])
      }

      // Pré-sélectionner le fournisseur si disponible
      if (prefilledProduct.supplier_id && prefilledProduct.supplier_id !== selectedSupplierId) {
        handleSupplierChange(prefilledProduct.supplier_id)
      } else if (prefilledSupplier && prefilledSupplier !== selectedSupplierId) {
        handleSupplierChange(prefilledSupplier)
      }

      // Ajouter note indiquant que c'est pour échantillon
      if (prefilledProduct.requires_sample) {
        setNotes(prev => {
          const sampleNote = `Commande d'échantillon pour le produit "${prefilledProduct.name || 'sans nom'}"`
          return prev ? `${prev}\n\n${sampleNote}` : sampleNote
        })
      }
    }
  }, [prefilledProduct, open, prefilledSupplier])

  // Calculs totaux
  const totalHT = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    return sum + itemTotal
  }, 0)

  const totalTTC = totalHT * 1.2 // TVA 20%

  // Gérer le changement de fournisseur
  const handleSupplierChange = async (supplierId: string) => {
    setSelectedSupplierId(supplierId)

    if (supplierId) {
      const supplier = await getOrganisationById(supplierId)
      setSelectedSupplier(supplier)
    } else {
      setSelectedSupplier(null)
    }
  }

  // Handler pour la création d'un nouveau fournisseur
  const handleSupplierCreated = async (supplierId: string, supplierName: string) => {
    // Rafraîchir la liste des fournisseurs
    await refetchSuppliers()

    // Auto-sélectionner le nouveau fournisseur
    await handleSupplierChange(supplierId)

    toast({
      title: "✅ Fournisseur créé et sélectionné",
      description: `${supplierName} a été créé et sélectionné automatiquement.`
    })
  }

  const resetForm = () => {
    setSelectedSupplierId('')
    setSelectedSupplier(null)
    setExpectedDeliveryDate('')
    setDeliveryAddress('Groupe DSA - (Verone)\n4, rue du Pérou\n91300 Massy\nFrance')
    setNotes('')
    setItems([])
    setProductSearchTerm('')
  }

  const handleClose = () => {
    setOpen(false)
    if (onClose) {
      onClose()
    }
  }

  const addProduct = (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id)

    if (existingItem) {
      // Augmenter la quantité si le produit existe déjà
      setItems(items.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Ajouter un nouvel item
      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        quantity: 1,
        unit_price_ht: product.cost_price || 0,
        discount_percentage: 0,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          primary_image_url: product.primary_image_url,
          cost_price: product.cost_price  // Stocker prix catalogue pour comparaison
        }
      }
      setItems([...items, newItem])
    }
    setShowProductSearch(false)
    setProductSearchTerm('')
  }

  const updateItem = (itemId: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId || items.length === 0) return

    setLoading(true)
    try {
      const orderData: CreatePurchaseOrderData = {
        supplier_id: selectedSupplierId,
        expected_delivery_date: expectedDeliveryDate || undefined,
        payment_terms: selectedSupplier?.payment_terms || undefined,
        delivery_address: deliveryAddress || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          discount_percentage: item.discount_percentage,
          expected_delivery_date: item.expected_delivery_date,
          notes: item.notes
        }))
      }

      await createOrder(orderData)

      resetForm()
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={typeof isOpen !== 'undefined' ? handleOpenChange : setOpen}
    >
      {typeof isOpen === 'undefined' && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Commande Fournisseur</DialogTitle>
          <DialogDescription>
            Créer une nouvelle commande d'approvisionnement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedSupplierId}
                      onValueChange={handleSupplierChange}
                    >
                      <SelectTrigger className="border-black">
                        <SelectValue placeholder="Sélectionner un fournisseur..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CreateOrganisationModal
                    onOrganisationCreated={handleSupplierCreated}
                    defaultType="supplier"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="deliveryAddress">Adresse de livraison (Entrepôt)</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {selectedSupplier && selectedSupplier.payment_terms && (
                <div className="space-y-2 col-span-2 p-3 bg-gray-50 border rounded-lg">
                  <Label className="text-sm font-medium">Conditions de paiement du fournisseur</Label>
                  <p className="text-sm text-gray-700">{selectedSupplier.payment_terms}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes additionnelles..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Articles</CardTitle>
                  <CardDescription>
                    {items.length} article(s) dans la commande
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductSearch(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun article ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire HT</TableHead>
                        {/* Afficher colonne Remise seulement si au moins 1 item a une remise > 0 */}
                        {items.some(item => (item.discount_percentage || 0) > 0) && (
                          <TableHead>Remise (%)</TableHead>
                        )}
                        <TableHead>Total HT</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const hasAnyDiscount = items.some(item => (item.discount_percentage || 0) > 0)
                        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {item.product?.primary_image_url && (
                                  <img
                                    src={item.product.primary_image_url}
                                    alt={item.product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{item.product?.name}</p>
                                  <p className="text-sm text-gray-500">{item.product?.sku}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price_ht}
                                  onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                  min="0"
                                />
                                {item.product?.cost_price && item.unit_price_ht !== item.product.cost_price && (
                                  <p className="text-xs text-gray-500 line-through">
                                    Prix minimum de vente: {formatCurrency(item.product.cost_price)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            {/* Afficher cellule Remise seulement si au moins 1 item a une remise > 0 */}
                            {hasAnyDiscount && (
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.discount_percentage || 0}
                                  onChange={(e) => updateItem(item.id, 'discount_percentage', parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                  min="0"
                                  max="100"
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              {formatCurrency(itemTotal)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totaux */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total HT</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalHT)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TVA (20%)</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalTTC - totalHT)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total TTC</p>
                    <p className="text-xl font-bold">{formatCurrency(totalTTC)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedSupplierId || items.length === 0}
            >
              {loading ? 'Création...' : 'Créer la commande'}
            </Button>
          </div>
        </form>

        {/* Modal de recherche de produits */}
        <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Ajouter un produit</DialogTitle>
              <DialogDescription>
                Rechercher et sélectionner un produit à ajouter à la commande
              </DialogDescription>
            </DialogHeader>

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

              <div className="max-h-80 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {productSearchTerm ? 'Aucun produit trouvé' : 'Saisissez un terme de recherche'}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addProduct(product)}
                      >
                        <div className="flex items-center gap-3">
                          {product.primary_image_url && (
                            <img
                              src={product.primary_image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                            <Badge variant="outline" className="text-xs">
                              Stock: {product.stock_quantity || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(product.cost_price || 0)}
                          </p>
                          <p className="text-sm text-gray-500">Prix d'achat</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}