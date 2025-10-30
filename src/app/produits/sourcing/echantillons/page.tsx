"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseQuery } from '@/hooks/base/use-supabase-query'
import {
  Eye,
  Package,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Building,
  User,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomerSelector, UnifiedCustomer } from '@/components/business/customer-selector'
import { SampleProductSelectorModal, Product } from '@/components/business/sample-product-selector-modal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function SourcingEchantillonsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // États formulaire échantillon client
  const [showSampleForm, setShowSampleForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<UnifiedCustomer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // ✅ Données RÉELLES depuis Supabase (purchase_order_items avec sample_type)
  const { data: rawSampleItems, loading, error } = useSupabaseQuery<any>({
    tableName: 'purchase_order_items',
    select: `
      id,
      quantity,
      unit_price_ht,
      sample_type,
      notes,
      created_at,
      purchase_orders!purchase_order_id(
        id,
        po_number,
        status,
        expected_delivery_date,
        supplier_id
      ),
      products!product_id(id, name, sku, cost_price)
    `,
    filters: (query) => query
      .not('sample_type', 'is', null) // Seulement échantillons (internal ou customer)
      .order('created_at', { ascending: false }),
    autoFetch: true
  })

  // Transform backend data → UI format
  const sampleOrders = useMemo(() => {
    if (!rawSampleItems || rawSampleItems.length === 0) return []

    return rawSampleItems.map((item: any) => {
      const purchaseOrder = item.purchase_orders
      const product = item.products

      // Map purchase order status → sample status
      const mapStatus = (poStatus: string) => {
        switch (poStatus) {
          case 'draft': return 'pending'
          case 'sent': return 'ordered'
          case 'partially_received': return 'in_transit'
          case 'completed': return 'delivered'
          default: return 'pending'
        }
      }

      return {
        id: item.id,
        order_number: purchaseOrder.po_number || `ECH-${item.id.slice(0, 8)}`,
        product_title: product.name,
        supplier: 'Fournisseur (TODO: join organisations)',
        client: item.sample_type === 'internal'
          ? 'Interne - Catalogue'
          : 'Client (TODO: relation customer)',
        status: mapStatus(purchaseOrder.status),
        order_date: new Date(item.created_at).toLocaleDateString('fr-FR'),
        expected_delivery: purchaseOrder.expected_delivery_date
          ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('fr-FR')
          : 'Non définie',
        delivery_date: purchaseOrder.status === 'completed' && purchaseOrder.expected_delivery_date
          ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('fr-FR')
          : undefined,
        samples: [
          {
            id: item.id,
            type: product.name,
            color: 'Standard',
            size: `Qté: ${item.quantity}`
          }
        ],
        budget: `${(item.unit_price_ht * item.quantity).toFixed(2)}€`,
        notes: item.notes || 'Aucune note'
      }
    })
  }, [rawSampleItems])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">En attente</Badge>
      case 'ordered':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Commandé</Badge>
      case 'in_transit':
        return <Badge variant="outline" className="border-gray-300 text-black">En transit</Badge>
      case 'delivered':
        return <Badge variant="outline" className="border-green-300 text-green-600">Livré</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'ordered':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-black" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = order.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handler pour le changement de client
  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer)

    // Auto-remplir l'adresse de livraison
    if (customer) {
      if (customer.type === 'professional') {
        // B2B : Utiliser shipping_address ou billing_address
        const address = [
          customer.name,
          customer.shipping_address_line1 || customer.billing_address_line1,
          customer.shipping_city || customer.billing_city,
          customer.shipping_postal_code || customer.billing_postal_code
        ].filter(Boolean).join(', ')
        setDeliveryAddress(address)
      } else {
        // B2C : Utiliser adresse principale
        const address = [
          customer.name,
          customer.address_line1,
          customer.city,
          customer.postal_code
        ].filter(Boolean).join(', ')
        setDeliveryAddress(address)
      }
    } else {
      setDeliveryAddress('')
    }
  }

  // Handler pour la sélection de produit
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setSelectedProductId(product.id)
  }

  // Handler pour la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedProductId) {
      toast({ title: 'Erreur', description: 'Client et produit requis', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erreur', description: 'Utilisateur non connecté', variant: 'destructive' })
        setSubmitting(false)
        return
      }

      // Récupérer infos produit pour le prix et le fournisseur
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('cost_price, supplier_id')
        .eq('id', selectedProductId)
        .single()

      if (productError || !product?.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Produit invalide ou fournisseur manquant',
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      // Créer une purchase order pour l'échantillon
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: `SAMPLE-${Date.now()}`,
          status: 'draft',
          notes: `Échantillon client: ${selectedCustomer.name}`,
          created_by: user.id,
          supplier_id: product.supplier_id
        })
        .select('id')
        .single()

      if (poError) throw poError

      // Créer le purchase_order_item
      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: newPO.id,
          product_id: selectedProductId,
          quantity,
          unit_price_ht: product?.cost_price || 0.01, // Minimum 0.01 pour respecter contrainte CHECK
          sample_type: 'customer',
          customer_organisation_id: selectedCustomer.type === 'professional' ? selectedCustomer.id : null,
          customer_individual_id: selectedCustomer.type === 'individual' ? selectedCustomer.id : null,
          notes: `Livraison: ${deliveryAddress}\n\nNotes: ${notes}`
        })

      if (itemError) throw itemError

      toast({ title: 'Demande créée', description: 'Demande d\'échantillon enregistrée avec succès' })
      setShowSampleForm(false)
      // Reset form
      setSelectedCustomer(null)
      setSelectedProductId('')
      setQuantity(1)
      setDeliveryAddress('')
      setNotes('')
      // Rafraîchir la liste
      window.location.reload()
    } catch (error) {
      console.error('Erreur création échantillon:', error)
      toast({ title: 'Erreur', description: 'Impossible de créer la demande', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des échantillons...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Échantillons</h1>
              <p className="text-gray-600 mt-1">Commandes et suivi des échantillons produits</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/produits/sourcing')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Dashboard
              </Button>
              <Button
                onClick={() => setShowSampleForm(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Échantillon
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{sampleOrders.length}</div>
              <p className="text-xs text-gray-600">échantillons commandés</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Cours</CardTitle>
              <Truck className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sampleOrders.filter(o => ['ordered', 'in_transit'].includes(o.status)).length}
              </div>
              <p className="text-xs text-gray-600">commandes en transit</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Livrés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sampleOrders.filter(o => o.status === 'delivered').length}
              </div>
              <p className="text-xs text-gray-600">prêts pour validation</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Budget Total</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">145€</div>
              <p className="text-xs text-gray-600">ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par produit, fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ordered">Commandé</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes d'échantillons */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Commandes d'Échantillons ({filteredOrders.length})</CardTitle>
            <CardDescription>Suivi complet des échantillons commandés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  {/* En-tête commande */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold text-black">{order.order_number}</h3>
                        <p className="text-sm text-gray-600">{order.product_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(order.status)}
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Fournisseur:</span>
                      <span className="font-medium text-black">{order.supplier}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium text-black">{order.client}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-black">{order.budget}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Commandé le:</span>
                      <span className="text-black">{order.order_date}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {order.status === 'delivered' ? 'Livré le:' : 'Livraison prévue:'}
                      </span>
                      <span className="text-black">
                        {order.status === 'delivered' ? order.delivery_date : order.expected_delivery}
                      </span>
                    </div>
                  </div>

                  {/* Liste des échantillons */}
                  <div className="mb-4">
                    <h4 className="font-medium text-black mb-2">Échantillons commandés:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.samples.map((sample) => (
                        <div key={sample.id} className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm">
                          <div>
                            <span className="font-medium text-black">{sample.type}</span>
                            <span className="text-gray-600 ml-2">({sample.color})</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{sample.size}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {order.samples.length} échantillon{order.samples.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      {order.status === 'delivered' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider échantillons
                        </Button>
                      )}
                      {order.status === 'in_transit' && (
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-600">
                          <Truck className="h-4 w-4 mr-2" />
                          Suivre livraison
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune commande d'échantillon trouvée</p>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Formulaire Échantillon Client */}
      <Dialog open={showSampleForm} onOpenChange={setShowSampleForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande d'Échantillon Client</DialogTitle>
            <DialogDescription>
              Créer une demande d'échantillon pour un client professionnel (B2B) ou particulier (B2C)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Sélection Client (B2B ou B2C) */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Sélectionner le client *</Label>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerChange={handleCustomerChange}
                disabled={submitting}
              />
            </div>

            {/* 2. Affichage informations client */}
            {selectedCustomer && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        Client sélectionné : {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-green-700">
                        Type : {selectedCustomer.type === 'professional' ? 'Professionnel (B2B)' : 'Particulier (B2C)'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Sélection Produit */}
            <div>
              <Label>Produit *</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductModal(true)}
                disabled={submitting}
                className="w-full justify-start text-left font-normal"
              >
                <Package className="h-4 w-4 mr-2" />
                {selectedProduct ? selectedProduct.name : 'Sélectionner un produit...'}
              </Button>

              {/* Affichage produit sélectionné */}
              {selectedProduct && (
                <Card className="mt-3 bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                        <img
                          src={selectedProduct.product_images.find((img: { is_primary: boolean; public_url: string }) => img.is_primary)?.public_url || selectedProduct.product_images[0].public_url}
                          alt={selectedProduct.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{selectedProduct.name}</p>
                        {selectedProduct.sku && (
                          <p className="text-sm text-green-700">SKU: {selectedProduct.sku}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {selectedProduct.creation_mode === 'complete' ? 'Catalogue' : 'Sourcing'}
                          </Badge>
                          {selectedProduct.organisations && (
                            <span className="text-xs text-green-700">
                              Fournisseur: {selectedProduct.organisations.legal_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 4. Quantité */}
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                disabled={submitting}
              />
              <p className="text-sm text-gray-500 mt-1">Maximum 10 échantillons par demande</p>
            </div>

            {/* 5. Adresse de livraison */}
            <div>
              <Label htmlFor="delivery">Adresse de livraison</Label>
              <Textarea
                id="delivery"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Auto-remplie depuis la fiche client..."
                rows={3}
                disabled={submitting}
              />
              <p className="text-sm text-gray-500 mt-1">Modifiable si nécessaire</p>
            </div>

            {/* 6. Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexte, usage prévu, remarques particulières..."
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSampleForm(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!selectedCustomer || !selectedProductId || submitting}
                className="bg-black hover:bg-gray-800"
              >
                {submitting ? 'Création...' : 'Créer la demande'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Sélection Produit */}
      <SampleProductSelectorModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onProductSelect={handleProductSelect}
        allowCatalog={true}
        allowSourcing={true}
      />
    </div>
  )
}