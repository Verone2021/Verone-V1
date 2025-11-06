'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Search, AlertTriangle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProducts } from '@/hooks/use-products'
import { useSalesOrders, CreateSalesOrderData } from '@/hooks/use-sales-orders'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { useProductPrice, formatPrice } from '@/hooks/use-pricing'
import { formatCurrency } from '@/lib/utils'
import { AddressInput } from '@/shared/modules/common/components/address/AddressInput'
import { EcoTaxVatInput } from '@/components/forms/eco-tax-vat-input'
import { createClient } from '@/lib/supabase/client'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price_ht: number
  tax_rate: number          // Taux de TVA par ligne (0.20 = 20%)
  discount_percentage: number
  eco_tax: number           // Éco-taxe par ligne (€)
  expected_delivery_date?: string
  notes?: string
  product?: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
    stock_quantity?: number
    eco_tax_default?: number  // Éco-taxe indicative du produit
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
  const [ecoTaxVatRate, setEcoTaxVatRate] = useState<number | null>(null)
  // RFA supprimé - Migration 003

  // Items management
  const [items, setItems] = useState<OrderItem[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  // Stock disponible par produit (pour la modal de sélection)
  const [productsAvailableStock, setProductsAvailableStock] = useState<Map<string, number>>(new Map())

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
      const customer: UnifiedCustomer = (order.customer_type === 'organization'
        ? {
            id: order.customer_id,
            type: 'professional' as const,
            name: order.organisations?.trade_name || order.organisations?.legal_name || '',
            email: order.organisations?.email as any,
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
          }) as any

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
      setEcoTaxVatRate(order.eco_tax_vat_rate ?? null)

      // Transformer les items de la commande en OrderItem[]
      const loadedItems = await Promise.all(
        (order.sales_order_items || []).map(async (item) => {
          const stockData = await getAvailableStock(item.product_id)

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            tax_rate: item.tax_rate || 0.20,    // Charger TVA ou 20% par défaut
            discount_percentage: item.discount_percentage,
            eco_tax: (item as any).eco_tax || 0,         // Charger éco-taxe (cast car types Supabase non à jour)
            expected_delivery_date: item.expected_delivery_date,
            notes: item.notes,
            product: item.products ? {
              id: item.products.id,
              name: item.products.name,
              sku: item.products.sku,
              primary_image_url: null,
              stock_quantity: item.products.stock_quantity,
              eco_tax_default: (item.products as any).eco_tax_default || 0  // Cast car types Supabase non à jour
            } : undefined,
            availableStock: stockData?.stock_available || 0,
            pricing_source: 'base_catalog' as const,
            original_price_ht: item.unit_price_ht,
            auto_calculated: false
          }
        })
      )

      setItems(loadedItems as any)
      await checkAllStockAvailability(loadedItems as any)
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

  // Effet : charger le stock disponible de chaque produit dans la modal de sélection
  useEffect(() => {
    if (showProductSearch && products.length > 0) {
      const loadProductsStock = async () => {
        const stockMap = new Map<string, number>()

        // Charger le stock disponible pour chaque produit
        await Promise.all(
          products.map(async (product) => {
            try {
              const stockData = await getAvailableStock(product.id)
              stockMap.set(product.id, stockData?.stock_available || 0)
            } catch (error) {
              console.error(`Erreur chargement stock pour ${product.sku}:`, error)
              stockMap.set(product.id, 0)
            }
          })
        )

        setProductsAvailableStock(stockMap)
      }

      loadProductsStock()
    }
  }, [showProductSearch, products, getAvailableStock])

  // Calculs totaux (inclut eco_tax - Migration eco_tax 2025-10-31)
  const totalHT = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    return sum + itemSubtotal + (item.eco_tax || 0)
  }, 0)

  // TVA calculée dynamiquement par ligne avec taux spécifique
  const totalTVA = items.reduce((sum, item) => {
    const lineHT = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
    const lineTVA = lineHT * (item.tax_rate || 0.20)
    return sum + lineTVA
  }, 0)

  const totalTTC = totalHT + totalTVA

  // Gérer le changement de client
  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer)

    // Pré-remplir automatiquement les adresses quand un client est sélectionné
    if (customer) {
      // Formater l'adresse de livraison
      if (customer.type === 'professional') {
        // Client B2B - Utiliser adresse de livraison ou facturation
        const useShipping = !!(customer.shipping_address_line1 || customer.shipping_city)
        const shippingParts = [
          customer.name,
          useShipping ? customer.shipping_address_line1 : customer.billing_address_line1,
          useShipping ? customer.shipping_address_line2 : customer.billing_address_line2,
          useShipping
            ? [customer.shipping_postal_code, customer.shipping_city].filter(Boolean).join(' ')
            : [customer.billing_postal_code, customer.billing_city].filter(Boolean).join(' '),
          useShipping ? customer.shipping_region : customer.billing_region,
          useShipping ? customer.shipping_country : customer.billing_country
        ].filter(Boolean).join('\n')
        setShippingAddress(shippingParts)

        // Adresse de facturation
        const billingParts = [
          customer.name,
          customer.billing_address_line1,
          customer.billing_address_line2,
          [customer.billing_postal_code, customer.billing_city].filter(Boolean).join(' '),
          customer.billing_region,
          customer.billing_country
        ].filter(Boolean).join('\n')
        setBillingAddress(billingParts)
      } else {
        // Client B2C - Utiliser adresse principale pour livraison
        const shippingParts = [
          customer.name,
          customer.address_line1,
          customer.address_line2,
          [customer.postal_code, customer.city].filter(Boolean).join(' '),
          customer.region,
          customer.country
        ].filter(Boolean).join('\n')
        setShippingAddress(shippingParts)

        // Adresse de facturation (spécifique ou principale)
        const useSpecificBilling = !!(customer.billing_address_line1_individual || customer.billing_city_individual)
        const billingParts = [
          customer.name,
          useSpecificBilling ? customer.billing_address_line1_individual : customer.address_line1,
          useSpecificBilling ? customer.billing_address_line2_individual : customer.address_line2,
          useSpecificBilling
            ? [customer.billing_postal_code_individual, customer.billing_city_individual].filter(Boolean).join(' ')
            : [customer.postal_code, customer.city].filter(Boolean).join(' '),
          useSpecificBilling ? customer.billing_region_individual : customer.region,
          useSpecificBilling ? customer.billing_country_individual : customer.country
        ].filter(Boolean).join('\n')
        setBillingAddress(billingParts)
      }
    } else {
      // Réinitialiser les adresses si pas de client
      setShippingAddress('')
      setBillingAddress('')
    }
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setExpectedDeliveryDate('')
    setShippingAddress('')
    setBillingAddress('')
    setNotes('')
    setEcoTaxVatRate(null)
    // RFA supprimé - Migration 003
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
        unit_price_ht: product?.minimumSellingPrice || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.minimumSellingPrice || 0,
        auto_calculated: false
      }
    }

    try {
      // Appel Supabase RPC calculate_product_price_v2
      const { data, error } = await supabase.rpc('calculate_product_price_v2' as any, {
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
          unit_price_ht: product?.minimumSellingPrice || 0,
          discount_percentage: 0,
          pricing_source: 'base_catalog' as const,
          original_price_ht: product?.minimumSellingPrice || 0,
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
        unit_price_ht: product?.minimumSellingPrice || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.minimumSellingPrice || 0,
        auto_calculated: false
      }
    } catch (err) {
      console.error('Exception calcul pricing:', err)
      const product = products.find(p => p.id === productId)
      return {
        unit_price_ht: product?.minimumSellingPrice || 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: product?.minimumSellingPrice || 0,
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

      // Utiliser minimumSellingPrice comme fallback si pricing.unit_price_ht est 0 ou null
      const finalPrice = pricing.unit_price_ht > 0
        ? pricing.unit_price_ht
        : (product.minimumSellingPrice || 0)

      const finalOriginalPrice = pricing.original_price_ht > 0
        ? pricing.original_price_ht
        : (product.minimumSellingPrice || 0)

      const updatedItems = items.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: newQuantity,
              unit_price_ht: finalPrice,
              discount_percentage: pricing.discount_percentage,
              pricing_source: pricing.pricing_source,
              original_price_ht: finalOriginalPrice,
              auto_calculated: pricing.auto_calculated || (finalPrice === product.minimumSellingPrice)
            }
          : item
      )
      setItems(updatedItems)
      await checkAllStockAvailability(updatedItems)
    } else {
      // Ajouter un nouvel item avec pricing V2
      const stockData = await getAvailableStock(product.id)
      const pricing = await calculateProductPrice(product.id, 1)

      // Utiliser minimumSellingPrice comme fallback si pricing.unit_price_ht est 0 ou null
      const finalPrice = pricing.unit_price_ht > 0
        ? pricing.unit_price_ht
        : (product.minimumSellingPrice || 0)

      const finalOriginalPrice = pricing.original_price_ht > 0
        ? pricing.original_price_ht
        : (product.minimumSellingPrice || 0)

      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        quantity: 1,
        unit_price_ht: finalPrice,
        tax_rate: 0.20,         // TVA 20% par défaut
        discount_percentage: pricing.discount_percentage,
        eco_tax: (product as any).eco_tax_default || 0,  // Éco-taxe depuis produit (cast car types non à jour)
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          primary_image_url: product.primary_image_url,
          stock_quantity: product.stock_quantity,
          eco_tax_default: (product as any).eco_tax_default || 0  // Cast car types Supabase non à jour
        },
        availableStock: stockData?.stock_available || 0,
        pricing_source: pricing.pricing_source,
        original_price_ht: finalOriginalPrice,
        auto_calculated: pricing.auto_calculated || (finalPrice === product.minimumSellingPrice)
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
        tax_rate: item.tax_rate,              // TVA personnalisée par ligne
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax || 0,           // Éco-taxe par ligne
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes
      }))

      if (mode === 'edit' && orderId) {
        // Mode édition : mettre à jour la commande existante
        const updateData = {
          expected_delivery_date: expectedDeliveryDate || undefined,
          shipping_address: shippingAddress ? { address: shippingAddress } : undefined,
          billing_address: billingAddress ? { address: billingAddress } : undefined,
          payment_terms: autoPaymentTerms || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate
        }

        await updateOrderWithItems(orderId, updateData, itemsData)
      } else {
        // Mode création : créer une nouvelle commande
        const orderData: CreateSalesOrderData = {
          customer_id: selectedCustomer.id,
          customer_type: selectedCustomer.type === 'professional' ? 'organization' : 'individual',
          expected_delivery_date: expectedDeliveryDate || undefined,
          shipping_address: shippingAddress ? { address: shippingAddress } : undefined,
          billing_address: billingAddress ? { address: billingAddress } : undefined,
          payment_terms: autoPaymentTerms || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
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
        <ButtonV2 className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </ButtonV2>
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
                disabled={loading}
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

              <div>
                <EcoTaxVatInput
                  value={ecoTaxVatRate}
                  onChange={setEcoTaxVatRate}
                  defaultTaxRate={20}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <ButtonV2
                type="button"
                variant="outline"
                onClick={() => setShowProductSearch(true)}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </ButtonV2>
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
                        <TableHead>TVA (%)</TableHead>
                        <TableHead>Éco-taxe (€)</TableHead>
                        {/* Afficher colonne Remise seulement si au moins 1 item a une remise > 0 */}
                        {items.some(item => (item.discount_percentage || 0) > 0) && (
                          <TableHead>Remise (%)</TableHead>
                        )}
                        <TableHead>Total HT</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const hasAnyDiscount = items.some(item => (item.discount_percentage || 0) > 0)
                        const itemSubtotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
                        const itemTotal = itemSubtotal + (item.eco_tax || 0)  // Inclure éco-taxe
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
                                  disabled={loading}
                                />
                                {item.auto_calculated && item.original_price_ht && item.original_price_ht !== item.unit_price_ht && (
                                  <p className="text-xs text-gray-500 line-through">
                                    Prix minimum de vente: {formatCurrency(item.original_price_ht)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={((item.tax_rate || 0.20) * 100).toFixed(2)}
                                  onChange={(e) => updateItem(item.id, 'tax_rate', (parseFloat(e.target.value) || 20) / 100)}
                                  className="w-24"
                                  disabled={loading}
                                />
                                <p className="text-xs text-gray-500">
                                  {((item.tax_rate || 0.20) * 100).toFixed(2)}%
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={(item.eco_tax || 0).toFixed(2)}
                                onChange={(e) => updateItem(item.id, 'eco_tax', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                disabled={loading}
                              />
                            </TableCell>
                            {/* Afficher cellule Remise seulement si au moins 1 item a une remise > 0 */}
                            {hasAnyDiscount && (
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
                            )}
                            <TableCell>{formatCurrency(itemTotal)}</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus ? 'secondary' : 'destructive'}>
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
                              <ButtonV2
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </ButtonV2>
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

          {/* RFA supprimé - Migration 003 */}

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
                      TVA: {formatCurrency(totalTVA)}
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
            <ButtonV2 type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={loading || loadingOrder || !selectedCustomer || items.length === 0}
            >
              {loading
                ? (mode === 'edit' ? 'Mise à jour...' : 'Création...')
                : (mode === 'edit' ? 'Mettre à jour la commande' : 'Créer la commande')
              }
            </ButtonV2>
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
                        <TableCell>{formatCurrency(product.minimumSellingPrice)}</TableCell>
                        <TableCell>
                          {(() => {
                            const availableStock = productsAvailableStock.get(product.id)
                            if (availableStock === undefined) {
                              // Stock en cours de chargement
                              return <Badge variant="secondary">...</Badge>
                            }
                            return (
                              <Badge variant={availableStock > 0 ? 'secondary' : 'secondary'}>
                                {availableStock}
                              </Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <ButtonV2
                            size="sm"
                            onClick={() => addProduct(product)}
                          >
                            Ajouter
                          </ButtonV2>
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