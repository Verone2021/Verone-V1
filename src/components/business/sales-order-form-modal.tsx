'use client'

import { useState } from 'react'
import { Plus, X, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerSelector, UnifiedCustomer } from './customer-selector'
import { useProducts } from '@/hooks/use-products'
import { useSalesOrders, CreateSalesOrderData } from '@/hooks/use-sales-orders'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { formatCurrency } from '@/lib/utils'
import { AddressInput } from './address-input'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price_ht: number
  discount_percentage: number
  expected_delivery_date?: string
  notes?: string
  product?: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
    stock_quantity?: number
  }
  availableStock?: number
}

interface SalesOrderFormModalProps {
  onSuccess?: () => void
}

export function SalesOrderFormModal({ onSuccess }: SalesOrderFormModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data
  const [selectedCustomer, setSelectedCustomer] = useState<UnifiedCustomer | null>(null)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Items management
  const [items, setItems] = useState<OrderItem[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  // Hooks
  const { products } = useProducts({ search: productSearchTerm })
  const { createOrder } = useSalesOrders()
  const { getAvailableStock } = useStockMovements()

  // Calculs totaux
  const totalHT = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    return sum + itemTotal
  }, 0)

  const totalTTC = totalHT * 1.2 // TVA 20%

  // Gérer le changement de client
  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer)
    // Note: Les adresses ne sont plus pré-remplies automatiquement
    // L'utilisateur peut utiliser les boutons "Copier" des AddressInput
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setExpectedDeliveryDate('')
    setShippingAddress('')
    setBillingAddress('')
    setNotes('')
    setItems([])
    setProductSearchTerm('')
    setStockWarnings([])
  }

  // Vérifier la disponibilité du stock pour tous les items
  const checkAllStockAvailability = async (currentItems: OrderItem[]) => {
    const warnings: string[] = []

    for (const item of currentItems) {
      const availableStock = await getAvailableStock(item.product_id)
      if (availableStock < item.quantity) {
        warnings.push(
          `${item.product?.name} : Stock insuffisant (Disponible: ${availableStock}, Demandé: ${item.quantity})`
        )
      }
    }

    setStockWarnings(warnings)
  }

  const addProduct = async (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id)

    if (existingItem) {
      // Augmenter la quantité si le produit existe déjà
      const updatedItems = items.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      setItems(updatedItems)
      await checkAllStockAvailability(updatedItems)
    } else {
      // Ajouter un nouvel item
      const availableStock = await getAvailableStock(product.id)
      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        quantity: 1,
        unit_price_ht: product.price_ht || 0,
        discount_percentage: 0,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          primary_image_url: product.primary_image_url,
          stock_quantity: product.stock_quantity
        },
        availableStock
      }
      const updatedItems = [...items, newItem]
      setItems(updatedItems)
      await checkAllStockAvailability(updatedItems)
    }
    setShowProductSearch(false)
    setProductSearchTerm('')
  }

  const updateItem = async (itemId: string, field: keyof OrderItem, value: any) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    )
    setItems(updatedItems)

    // Revérifier le stock si la quantité a changé
    if (field === 'quantity') {
      await checkAllStockAvailability(updatedItems)
    }
  }

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId)
    setItems(updatedItems)
    checkAllStockAvailability(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || items.length === 0) return

    // Vérification finale du stock
    if (stockWarnings.length > 0) {
      if (!confirm('Il y a des problèmes de stock. Voulez-vous continuer quand même ?')) {
        return
      }
    }

    setLoading(true)
    try {
      // Construire les conditions de paiement automatiquement depuis le client
      let autoPaymentTerms = ''
      if (selectedCustomer.prepayment_required) {
        autoPaymentTerms = selectedCustomer.payment_terms
          ? `Prépaiement requis + ${selectedCustomer.payment_terms} jours`
          : 'Prépaiement requis'
      } else if (selectedCustomer.payment_terms) {
        autoPaymentTerms = `${selectedCustomer.payment_terms} jours`
      }

      const orderData: CreateSalesOrderData = {
        customer_id: selectedCustomer.id,
        customer_type: selectedCustomer.type === 'professional' ? 'organization' : 'individual',
        expected_delivery_date: expectedDeliveryDate || undefined,
        shipping_address: shippingAddress ? JSON.parse(`{"address": "${shippingAddress}"}`) : undefined,
        billing_address: billingAddress ? JSON.parse(`{"address": "${billingAddress}"}`) : undefined,
        payment_terms: autoPaymentTerms || undefined,
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
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Commande Client</DialogTitle>
          <DialogDescription>
            Créer une nouvelle commande client avec vérification du stock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alertes de stock */}
          {stockWarnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Problèmes de stock détectés :</p>
                  {stockWarnings.map((warning, index) => (
                    <p key={index} className="text-sm">• {warning}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerChange={handleCustomerChange}
                disabled={loading}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Affichage automatique des conditions de paiement */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conditions de paiement</Label>
                  {selectedCustomer ? (
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      {selectedCustomer.prepayment_required ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                            Prépaiement requis
                          </Badge>
                          {selectedCustomer.payment_terms && (
                            <span className="text-sm text-gray-700">+ {selectedCustomer.payment_terms} jours</span>
                          )}
                        </div>
                      ) : selectedCustomer.payment_terms ? (
                        <p className="text-sm text-gray-700">{selectedCustomer.payment_terms} jours</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Conditions à définir dans la fiche client</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="text-sm text-gray-500 italic">Sélectionnez un client</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AddressInput
                  label="Adresse de livraison"
                  value={shippingAddress}
                  onChange={setShippingAddress}
                  selectedCustomer={selectedCustomer}
                  addressType="shipping"
                  placeholder="Adresse complète de livraison"
                  disabled={loading}
                />

                <AddressInput
                  label="Adresse de facturation"
                  value={billingAddress}
                  onChange={setBillingAddress}
                  selectedCustomer={selectedCustomer}
                  addressType="billing"
                  placeholder="Adresse complète de facturation"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes sur la commande"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductSearch(true)}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun produit ajouté</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire HT</TableHead>
                        <TableHead>Remise (%)</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
                        const stockStatus = (item.availableStock || 0) >= item.quantity

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
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.product?.sku}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-20"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price_ht}
                                onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={item.discount_percentage}
                                onChange={(e) => updateItem(item.id, 'discount_percentage', parseFloat(e.target.value) || 0)}
                                className="w-20"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(itemTotal)}</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus ? 'default' : 'destructive'}>
                                {item.availableStock || 0} dispo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
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
              <CardContent className="pt-6">
                <div className="flex justify-end space-y-2">
                  <div className="text-right space-y-1">
                    <p className="text-lg">
                      <span className="font-medium">Total HT:</span> {formatCurrency(totalHT)}
                    </p>
                    <p className="text-sm text-gray-600">
                      TVA (20%): {formatCurrency(totalTTC - totalHT)}
                    </p>
                    <p className="text-xl font-bold">
                      Total TTC: {formatCurrency(totalTTC)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCustomer || items.length === 0}
            >
              {loading ? 'Création...' : 'Créer la commande'}
            </Button>
          </div>
        </form>

        {/* Modal de recherche de produits */}
        <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rechercher un produit</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom ou SKU..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.primary_image_url && (
                              <img
                                src={product.primary_image_url}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{formatCurrency(product.price_ht)}</TableCell>
                        <TableCell>
                          <Badge variant={product.stock_quantity > 0 ? 'default' : 'secondary'}>
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => addProduct(product)}
                          >
                            Ajouter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}