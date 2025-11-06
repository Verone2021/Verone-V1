"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  Package,
  Clock,
  Eye,
  Edit,
  X,
  AlertTriangle,
  Star,
  Building,
  User,
  Calendar,
  Euro,
  ImageIcon,
  MoreHorizontal,
  Loader2,
  Plus,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSourcingProducts, SourcingProduct } from '@/shared/modules/products/hooks'
import { useToast } from '@/shared/modules/common/hooks'
import { SampleValidationSimple } from '@/components/business/sample-validation-simple'

export default function SourcingValidationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    products,
    loading,
    validateSourcing
  } = useSourcingProducts({})

  const [selectedProduct, setSelectedProduct] = useState<SourcingProduct | null>(null)
  const [validationNotes, setValidationNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'validation' | 'samples'>('validation')
  const [workflowMetrics, setWorkflowMetrics] = useState<any>(null)
  const [validationData, setValidationData] = useState({
    supplier_id: '',
    cost_price: 0,
    requires_sample: false,
    estimated_selling_price: 0
  })

  // Valider un produit sourcing et le transférer au catalogue
  const handleValidateProduct = async (product: SourcingProduct) => {
    try {
      const success = await validateSourcing(product.id)

      if (success) {
        toast({
          title: "Produit validé",
          description: "Le produit a été transféré au catalogue"
        })

        setSelectedProduct(null)
        setValidationNotes('')
        setValidationData({ supplier_id: '', cost_price: 0, requires_sample: false, estimated_selling_price: 0 })
      }
    } catch (error) {
      console.error('Erreur validation produit:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de valider le produit",
        variant: "destructive"
      })
    }
  }

  // Obtenir le badge de statut
  const getStatusBadge = (product: SourcingProduct) => {
    if (product.requires_sample) {
      return <Badge variant="outline" className="border-gray-300 text-black">Échantillons requis</Badge>
    }

    switch (product.status) {
      case 'sourcing':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">En sourcing</Badge>
      case 'echantillon_a_commander':
        return <Badge variant="outline" className="border-gray-300 text-black">Échantillon à commander</Badge>
      case 'echantillon_commande':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Échantillon commandé</Badge>
      case 'in_stock':
        return <Badge variant="outline" className="border-green-300 text-green-600">En stock</Badge>
      default:
        return <Badge variant="outline">En cours</Badge>
    }
  }

  // Filtrer les produits en sourcing (status = 'sourcing')
  const productsToValidate = products.filter(p => p.status === 'sourcing')

  // Produits avec fournisseur assigné (prêts pour validation)
  const productsReadyForCatalog = products.filter(p =>
    p.supplier_id && p.status === 'sourcing' && !p.requires_sample
  )

  // Produits nécessitant des échantillons
  const productsRequiringSamples = products.filter(p => p.requires_sample)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
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
              <h1 className="text-3xl font-bold text-black">Validation Produits Sourcing</h1>
              <p className="text-gray-600 mt-1">Workflow complet: Sourcing → Échantillons → Catalogue</p>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                onClick={() => router.push('/produits/sourcing')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Dashboard
              </ButtonV2>
              <ButtonV2
                onClick={() => router.push('/catalogue')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Voir Catalogue
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Onglets de navigation */}
        <div className="flex space-x-1 mb-6">
          <ButtonV2
            variant={activeTab === 'validation' ? 'secondary' : 'outline'}
            onClick={() => setActiveTab('validation')}
            className={activeTab === 'validation' ? 'bg-black text-white' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Validation Sourcing ({productsToValidate.length})
          </ButtonV2>
          <ButtonV2
            variant={activeTab === 'samples' ? 'secondary' : 'outline'}
            onClick={() => setActiveTab('samples')}
            className={activeTab === 'samples' ? 'bg-black text-white' : ''}
          >
            <Package className="h-4 w-4 mr-2" />
            Échantillons Groupés ({productsRequiringSamples.length})
          </ButtonV2>
        </div>

        {/* Statistiques workflow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">À Valider</CardTitle>
              <Clock className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{productsToValidate.length}</div>
              <p className="text-xs text-gray-600">produits sourcing</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Échantillons</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{productsRequiringSamples.length}</div>
              <p className="text-xs text-gray-600">nécessitent validation</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prêts Catalogue</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{productsReadyForCatalog.length}</div>
              <p className="text-xs text-gray-600">transfert possible</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sourcing</CardTitle>
              <Star className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {products.length}
              </div>
              <p className="text-xs text-gray-600">produits en sourcing</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'validation' ? (
          /* Onglet Validation Sourcing */
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Validation Sourcing ({productsToValidate.length})</CardTitle>
              <CardDescription>Produits sourcing à valider avant passage échantillons/catalogue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {productsToValidate.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun produit en attente de validation</p>
                    <p className="text-sm text-gray-500">Tous les produits sourcés ont été traités</p>
                  </div>
                ) : (
                  productsToValidate.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      {/* En-tête produit */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-black text-lg">{product.name}</h3>
                            {getStatusBadge(product)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')} • SKU: {product.sku}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            className="border-gray-300"
                            onClick={() => router.push(`/catalogue/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </ButtonV2>
                        </div>
                      </div>

                      {/* Informations sourcing */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">URL fournisseur:</span>
                          <a
                            href={product.supplier_page_url || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block truncate"
                          >
                            {product.supplier_page_url}
                          </a>
                        </div>
                        <div>
                          <span className="text-gray-600">Type sourcing:</span>
                          <span className="font-medium text-black ml-1">
                            {(product as any).sourcing_type === 'client' ? 'Client spécifique' : 'Catalogue général'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Échantillons requis:</span>
                          <span className={`font-medium ml-1 ${product.requires_sample ? 'text-black' : 'text-green-600'}`}>
                            {product.requires_sample ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </div>

                      {/* Actions de validation */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          {product.supplier_id ? 'Prêt pour validation' : 'Fournisseur requis'}
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <ButtonV2
                                size="sm"
                                className="bg-black hover:bg-gray-800 text-white"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Valider Sourcing
                              </ButtonV2>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Onglet Échantillons Groupés */
          <SampleValidationSimple />
        )}

        {/* Produits prêts pour le catalogue */}
        {productsReadyForCatalog.length > 0 && (
          <Card className="border-green-500 mt-6">
            <CardHeader>
              <CardTitle className="text-green-700">Prêts pour Catalogue ({productsReadyForCatalog.length})</CardTitle>
              <CardDescription>Produits validés prêts pour transfert au catalogue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productsReadyForCatalog.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-black">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {product.requires_sample ? 'Échantillons validés' : 'Pas d\'échantillons requis'}
                      </p>
                    </div>
                    <ButtonV2
                      size="sm"
                      onClick={() => handleValidateProduct(product)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Transférer
                    </ButtonV2>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de validation sourcing */}
        {selectedProduct && (
          <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Valider le sourcing</DialogTitle>
                <DialogDescription>
                  Compléter les informations pour valider {selectedProduct.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier_id">ID Fournisseur *</Label>
                  <Input
                    id="supplier_id"
                    placeholder="Sélectionner ou saisir l'ID fournisseur"
                    value={validationData.supplier_id}
                    onChange={(e) => setValidationData(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="border-black focus:ring-black"
                  />
                </div>
                <div>
                  <Label htmlFor="cost_price">Prix d'achat (€) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={validationData.cost_price}
                    onChange={(e) => setValidationData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                    className="border-black focus:ring-black"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_selling_price">Prix de vente estimé (€)</Label>
                  <Input
                    id="estimated_selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={validationData.estimated_selling_price}
                    onChange={(e) => setValidationData(prev => ({ ...prev, estimated_selling_price: parseFloat(e.target.value) || 0 }))}
                    className="border-black focus:ring-black"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_sample"
                    checked={validationData.requires_sample}
                    onChange={(e) => setValidationData(prev => ({ ...prev, requires_sample: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requires_sample">Nécessite validation d'échantillons</Label>
                </div>
                <Textarea
                  placeholder="Notes de validation (optionnel)..."
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  className="border-black focus:ring-black"
                />
              </div>
              <DialogFooter>
                <ButtonV2
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(null)
                    setValidationNotes('')
                    setValidationData({ supplier_id: '', cost_price: 0, requires_sample: false, estimated_selling_price: 0 })
                  }}
                >
                  Annuler
                </ButtonV2>
                <ButtonV2
                  onClick={() => handleValidateProduct(selectedProduct)}
                  className="bg-black hover:bg-gray-800 text-white"
                  disabled={!selectedProduct.supplier_id}
                >
                  Valider Sourcing
                </ButtonV2>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}