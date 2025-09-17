'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOrganisations, Organisation } from '@/hooks/use-organisations'
import { useProducts } from '@/hooks/use-products'
import { useSalesOrders, CreateSalesOrderData, CreateSalesOrderItemData } from '@/hooks/use-sales-orders'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { formatCurrency } from '@/lib/utils'
import { AddressInput } from './address-input'

interface SalesOrderFormModalProps {
  onSuccess?: () => void
}

interface OrderItem extends CreateSalesOrderItemData {
  id: string
  product?: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
    stock_quantity?: number
  }
  availableStock?: number
}

export function SalesOrderFormModal({ onSuccess }: SalesOrderFormModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Organisation | null>(null)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')

  // Items management
  const [items, setItems] = useState<OrderItem[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  // Hooks
  const { organisations: customers, getOrganisationById } = useOrganisations({ type: 'customer', is_active: true })
  const { products } = useProducts({ search: productSearchTerm, in_stock_only: true })
  const { createOrder, checkStockAvailability } = useSalesOrders()
  const { getAvailableStock } = useStockMovements()

  // Calculs totaux
  const totalHT = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    return sum + itemTotal
  }, 0)

  const totalTTC = totalHT * 1.2 // TVA 20%

  // Gérer le changement de client
  const handleCustomerChange = async (customerId: string) => {
    setSelectedCustomerId(customerId)

    if (customerId) {
      const customer = await getOrganisationById(customerId)
      setSelectedCustomer(customer)
    } else {
      setSelectedCustomer(null)
    }
  }

  const resetForm = () => {
    setSelectedCustomerId('')
    setSelectedCustomer(null)
    setExpectedDeliveryDate('')
    setShippingAddress('')
    setBillingAddress('')
    setPaymentTerms('')
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
    if (!selectedCustomerId || items.length === 0) return

    // Vérification finale du stock
    if (stockWarnings.length > 0) {
      if (!confirm('Il y a des problèmes de stock. Voulez-vous continuer quand même ?')) {
        return
      }
    }

    setLoading(true)
    try {
      const orderData: CreateSalesOrderData = {
        customer_id: selectedCustomerId,
        expected_delivery_date: expectedDeliveryDate || undefined,
        shipping_address: shippingAddress ? JSON.parse(`{"address": "${shippingAddress}"}`) : undefined,
        billing_address: billingAddress ? JSON.parse(`{"address": "${billingAddress}"}`) : undefined,
        payment_terms: paymentTerms || undefined,
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
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Client *</Label>
                <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <AddressInput
                label="Adresse de livraison"
                value={shippingAddress}
                onChange={setShippingAddress}
                selectedOrganisation={selectedCustomer}
                placeholder="Adresse complète de livraison..."
              />

              <AddressInput
                label="Adresse de facturation"
                value={billingAddress}
                onChange={setBillingAddress}
                selectedOrganisation={selectedCustomer}
                placeholder="Adresse complète de facturation..."
              />

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                <Input
                  id="paymentTerms"
                  placeholder="Ex: 30 jours net"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>

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
                        <TableHead>Stock</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire HT</TableHead>
                        <TableHead>Remise (%)</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
                        const hasStockIssue = (item.availableStock || 0) < item.quantity

                        return (
                          <TableRow key={item.id} className={hasStockIssue ? 'bg-red-50' : ''}>
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
                              <Badge variant={hasStockIssue ? 'destructive' : 'outline'}>
                                {item.availableStock || 0} dispo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className={`w-20 ${hasStockIssue ? 'border-red-300' : ''}`}
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price_ht}
                                onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                min="0"
                              />
                            </TableCell>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCustomerId || items.length === 0}
              variant={stockWarnings.length > 0 ? 'destructive' : 'default'}
            >
              {loading ? 'Création...' : stockWarnings.length > 0 ? 'Créer malgré les alertes' : 'Créer la commande'}
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
                            {formatCurrency(product.price_ht || 0)}
                          </p>
                          <p className="text-sm text-gray-500">Prix de vente</p>
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