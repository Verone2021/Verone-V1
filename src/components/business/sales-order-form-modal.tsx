'use client'

import { useState, useEffect } from 'react'
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
import { useProductPrice, formatPrice } from '@/hooks/use-pricing'
import { formatCurrency } from '@/lib/utils'
import { AddressInput } from './address-input'
import { createClient } from '@/lib/supabase/client'

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
  // Pricing V2 metadata
  pricing_source?: 'customer_specific' | 'customer_group' | 'channel' | 'base_catalog'
  original_price_ht?: number
  auto_calculated?: boolean // Indique si le prix vient du pricing V2
}

interface SalesOrderFormModalProps {
  mode?: 'create' | 'edit'
  orderId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function SalesOrderFormModal({
  mode = 'create',
  orderId,
  open: controlledOpen,
  onOpenChange,
  onSuccess
}: SalesOrderFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Utiliser l'état contrôlé si fourni, sinon l'état interne
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen !== undefined) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }
  const [loading, setLoading] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const supabase = createClient()

  // Form data
  const [selectedCustomer, setSelectedCustomer] = useState<UnifiedCustomer | null>(null)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [rfaDiscount, setRfaDiscount] = useState<number>(0) // Remise Fin d'Affaire globale (%)

  // Items management
  const [items, setItems] = useState<OrderItem[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  // Hooks
  const { products } = useProducts({ search: productSearchTerm })
  const { createOrder, updateOrderWithItems, fetchOrder } = useSalesOrders()
  const { getAvailableStock } = useStockMovements()

  // Charger la commande existante en mode édition
  const loadExistingOrder = async (orderIdToLoad: string) => {
    setLoadingOrder(true)
    try {
      const order = await fetchOrder(orderIdToLoad)
      if (!order) throw new Error('Commande non trouvée')

      // Construire l'objet customer unifié
      const customer: UnifiedCustomer = order.customer_type === 'organization'
        ? {
            id: order.customer_id,
            type: 'professional' as const,
            name: order.organisations?.name || '',
            email: order.organisations?.email,
            phone: order.organisations?.phone,
            address: [
              order.organisations?.address_line1,
              order.organisations?.address_line2,
              order.organisations?.postal_code,
              order.organisations?.city
            ].filter(Boolean).join(', '),
            payment_terms: null,
            prepayment_required: false
          }
        : {
            id: order.customer_id,
            type: 'individual' as const,
            name: `${order.individual_customers?.first_name} ${order.individual_customers?.last_name}`,
            email: order.individual_customers?.email,
            phone: order.individual_customers?.phone,
            address: [
              order.individual_customers?.address_line1,
              order.individual_customers?.address_line2,
              order.individual_customers?.postal_code,
              order.individual_customers?.city
            ].filter(Boolean).join(', '),
            payment_terms: null,
            prepayment_required: false
          }

      setSelectedCustomer(customer)

      // Charger les données de la commande
      setExpectedDeliveryDate(order.expected_delivery_date || '')
      setShippingAddress(
        order.shipping_address
          ? (typeof order.shipping_address === 'string'
              ? order.shipping_address
              : order.shipping_address.address || '')
          : ''
      )
      setBillingAddress(
        order.billing_address
          ? (typeof order.billing_address === 'string'
              ? order.billing_address
              : order.billing_address.address || '')
          : ''
      )
      setNotes(order.notes || '')

      // Transformer les items de la commande en OrderItem[]
      const loadedItems: OrderItem[] = await Promise.all(
        (order.sales_order_items || []).map(async (item) => {
          const stockData = await getAvailableStock(item.product_id)

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            discount_percentage: item.discount_percentage,
            expected_delivery_date: item.expected_delivery_date,
            notes: item.notes,
            product: item.products ? {
              id: item.products.id,
              name: item.products.name,
              sku: item.products.sku,
              primary_image_url: null,
              stock_quantity: item.products.stock_quantity
            } : undefined,
            availableStock: stockData?.stock_available || 0,
            pricing_source: 'base_catalog' as const,
            original_price_ht: item.unit_price_ht,
            auto_calculated: false
          }
        })
      )

      setItems(loadedItems)
      await checkAllStockAvailability(loadedItems)
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error)
    } finally {
      setLoadingOrder(false)
    }
  }

  // Effet : charger la commande en mode édition quand la modal s'ouvre
  useEffect(() => {
    if (open && mode === 'edit' && orderId) {
      loadExistingOrder(orderId)
    }
  }, [open, mode, orderId])

  // Calculs totaux
  const subtotalHT = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    return sum + itemTotal
  }, 0)

  // Appliquer remise RFA sur le sous-total
  const rfaAmount = subtotalHT * (rfaDiscount / 100)
  const totalHT = subtotalHT - rfaAmount
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
    setRfaDiscount(0)
    setItems([])
    setProductSearchTerm('')
    setStockWarnings([])
  }

  // Vérifier la disponibilité du stock pour tous les items
  const checkAllStockAvailability = async (currentItems: OrderItem[]) => {
    const warnings: string[] = []

    for (const item of currentItems) {
      const stockData = await getAvailableStock(item.product_id)
      const availableStock = stockData?.stock_available || 0
      if (availableStock < item.quantity) {
        warnings.push(
          `${item.product?.name} : Stock insuffisant (Disponible: ${availableStock}, Demandé: ${item.quantity})`
        )
      }
    }

    setStockWarnings(warnings)
  }

  // Calculer le prix d'un produit avec pricing V2
  const calculateProductPrice = async (productId: string, quantity: number = 1) => {
    if (!selectedCustomer) {
      // Pas de client sélectionné, utiliser prix catalogue de base
      const product = products.find(p => p.id === productId)
      return {
        unit_price_ht: product?.price_ht || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.price_ht || 0,
        auto_calculated: false
      }
    }

    try {
      // Appel Supabase RPC calculate_product_price_v2
      const { data, error } = await supabase.rpc('calculate_product_price_v2', {
        p_product_id: productId,
        p_quantity: quantity,
        p_channel_id: null, // TODO: Ajouter sélecteur canal si besoin
        p_customer_id: selectedCustomer.id,
        p_customer_type: selectedCustomer.type === 'professional' ? 'organization' : 'individual',
        p_date: new Date().toISOString().split('T')[0]
      })

      if (error) {
        console.error('Erreur calcul pricing V2:', error)
        // Fallback sur prix catalogue
        const product = products.find(p => p.id === productId)
        return {
          unit_price_ht: product?.price_ht || 0,
          discount_percentage: 0,
          pricing_source: 'base_catalog' as const,
          original_price_ht: product?.price_ht || 0,
          auto_calculated: false
        }
      }

      const pricingResult = data?.[0]
      if (pricingResult) {
        return {
          unit_price_ht: pricingResult.price_ht,
          discount_percentage: (pricingResult.discount_rate || 0) * 100,
          pricing_source: pricingResult.price_source,
          original_price_ht: pricingResult.original_price,
          auto_calculated: true
        }
      }

      // Fallback
      const product = products.find(p => p.id === productId)
      return {
        unit_price_ht: product?.price_ht || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.price_ht || 0,
        auto_calculated: false
      }
    } catch (err) {
      console.error('Exception calcul pricing:', err)
      const product = products.find(p => p.id === productId)
      return {
        unit_price_ht: product?.price_ht || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.price_ht || 0,
        auto_calculated: false
      }
    }
  }

  const addProduct = async (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id)

    if (existingItem) {
      // Augmenter la quantité si le produit existe déjà
      const newQuantity = existingItem.quantity + 1

      // Recalculer le prix avec la nouvelle quantité (paliers!)
      const pricing = await calculateProductPrice(product.id, newQuantity)

      const updatedItems = items.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: newQuantity,
              unit_price_ht: pricing.unit_price_ht,
              discount_percentage: pricing.discount_percentage,
              pricing_source: pricing.pricing_source,
              original_price_ht: pricing.original_price_ht,
              auto_calculated: pricing.auto_calculated
            }
          : item
      )
      setItems(updatedItems)
      await checkAllStockAvailability(updatedItems)
    } else {
      // Ajouter un nouvel item avec pricing V2
      const stockData = await getAvailableStock(product.id)
      const pricing = await calculateProductPrice(product.id, 1)

      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        quantity: 1,
        unit_price_ht: pricing.unit_price_ht,
        discount_percentage: pricing.discount_percentage,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          primary_image_url: product.primary_image_url,
          stock_quantity: product.stock_quantity
        },
        availableStock: stockData?.stock_available || 0,
        pricing_source: pricing.pricing_source,
        original_price_ht: pricing.original_price_ht,
        auto_calculated: pricing.auto_calculated
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

      const itemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        discount_percentage: item.discount_percentage,
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes
      }))

      if (mode === 'edit' && orderId) {
        // Mode édition : mettre à jour la commande existante
        const updateData = {
          expected_delivery_date: expectedDeliveryDate || undefined,
          shipping_address: shippingAddress ? JSON.parse(`{"address": "${shippingAddress}"}`) : undefined,
          billing_address: billingAddress ? JSON.parse(`{"address": "${billingAddress}"}`) : undefined,
          payment_terms: autoPaymentTerms || undefined,
          notes: notes || undefined
        }

        await updateOrderWithItems(orderId, updateData, itemsData)
      } else {
        // Mode création : créer une nouvelle commande
        const orderData: CreateSalesOrderData = {
          customer_id: selectedCustomer.id,
          customer_type: selectedCustomer.type === 'professional' ? 'organization' : 'individual',
          expected_delivery_date: expectedDeliveryDate || undefined,
          shipping_address: shippingAddress ? JSON.parse(`{"address": "${shippingAddress}"}`) : undefined,
          billing_address: billingAddress ? JSON.parse(`{"address": "${billingAddress}"}`) : undefined,
          payment_terms: autoPaymentTerms || undefined,
          notes: notes || undefined,
          items: itemsData
        }

        await createOrder(orderData)
      }

      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error(`Erreur lors de ${mode === 'edit' ? 'la mise à jour' : 'la création'}:`, error)
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
          <DialogTitle>
            {mode === 'edit' ? 'Modifier la Commande Client' : 'Nouvelle Commande Client'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Modifier la commande existante (items, quantités, adresses, dates)'
              : 'Créer une nouvelle commande client avec vérification du stock'
            }
          </DialogDescription>
        </DialogHeader>

        {loadingOrder && (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement de la commande...</div>
          </div>
        )}

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
                disabled={loading || mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="text-sm text-gray-500 italic">
                  Le client ne peut pas être modifié pour une commande existante
                </p>
              )}

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
                        <TableHead>Source</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
                        const stockStatus = (item.availableStock || 0) >= item.quantity

                        // Labels et couleurs pour source pricing
                        const pricingSourceLabels = {
                          customer_specific: 'Contrat',
                          customer_group: 'Groupe',
                          channel: 'Canal',
                          base_catalog: 'Catalogue'
                        }
                        const pricingSourceColors = {
                          customer_specific: 'bg-purple-100 text-purple-800 border-purple-200',
                          customer_group: 'bg-blue-100 text-blue-800 border-blue-200',
                          channel: 'bg-green-100 text-green-800 border-green-200',
                          base_catalog: 'bg-gray-100 text-gray-800 border-gray-200'
                        }

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
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price_ht}
                                  onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                  disabled={loading || item.auto_calculated}
                                />
                                {item.auto_calculated && item.original_price_ht && item.original_price_ht > item.unit_price_ht && (
                                  <p className="text-xs text-gray-500 line-through">
                                    {formatCurrency(item.original_price_ht)}
                                  </p>
                                )}
                              </div>
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
                                disabled={loading || item.auto_calculated}
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(itemTotal)}</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus ? 'default' : 'destructive'}>
                                {item.availableStock || 0} dispo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.pricing_source && (
                                <Badge
                                  variant="outline"
                                  className={pricingSourceColors[item.pricing_source]}
                                >
                                  {pricingSourceLabels[item.pricing_source]}
                                </Badge>
                              )}
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

          {/* Remise RFA (Remise Fin d'Affaire) */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remise Exceptionnelle (RFA)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="rfaDiscount">Remise Fin d'Affaire (%)</Label>
                    <Input
                      id="rfaDiscount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={rfaDiscount}
                      onChange={(e) => setRfaDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={loading}
                      className="w-32"
                    />
                  </div>
                  {rfaDiscount > 0 && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Montant remise RFA</p>
                      <p className="text-lg font-semibold text-green-700">
                        -{formatCurrency(rfaAmount)}
                      </p>
                    </div>
                  )}
                </div>
                {rfaDiscount > 0 && (
                  <Alert className="mt-3 bg-green-50 border-green-200">
                    <AlertDescription className="text-sm text-gray-700">
                      <strong>Remise exceptionnelle appliquée :</strong> Une remise globale de {rfaDiscount}% sera appliquée sur le montant total HT de la commande.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Totaux */}
          {items.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end space-y-2">
                  <div className="text-right space-y-1">
                    <p className="text-base text-gray-600">
                      <span className="font-medium">Sous-total HT:</span> {formatCurrency(subtotalHT)}
                    </p>
                    {rfaDiscount > 0 && (
                      <p className="text-base text-green-700">
                        <span className="font-medium">Remise RFA ({rfaDiscount}%):</span> -{formatCurrency(rfaAmount)}
                      </p>
                    )}
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
              disabled={loading || loadingOrder || !selectedCustomer || items.length === 0}
            >
              {loading
                ? (mode === 'edit' ? 'Mise à jour...' : 'Création...')
                : (mode === 'edit' ? 'Mettre à jour la commande' : 'Créer la commande')
              }
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