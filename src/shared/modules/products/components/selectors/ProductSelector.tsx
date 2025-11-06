'use client'

import { useState, useEffect } from 'react'
import { Search, Package, Zap, Info, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Product {
  id: string
  name: string
  sku: string
  status: string
  creation_mode: string
  requires_sample: boolean
  supplier_name?: string
  product_type: string
  assigned_client_id?: string
}

interface ProductSelectorProps {
  consultationId?: string
  onProductSelect: (product: Product) => void
  selectedProductId?: string
  className?: string
}

export function ProductSelector({
  consultationId,
  onProductSelect,
  selectedProductId,
  className
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Charger les produits éligibles
  const loadProducts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .rpc('get_consultation_eligible_products', {
          target_consultation_id: consultationId || undefined
        })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Erreur chargement produits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [consultationId])

  // Filtrer les produits selon la recherche et l'onglet
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'catalogue' && (product.creation_mode === 'complete' || !product.creation_mode)) ||
      (activeTab === 'sourcing' && product.creation_mode === 'sourcing')

    return matchesSearch && matchesTab
  })

  // Grouper par type
  const catalogueProducts = filteredProducts.filter(p => p.creation_mode === 'complete' || !p.creation_mode)
  const sourcingProducts = filteredProducts.filter(p => p.creation_mode === 'sourcing')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      case 'sourcing': return 'bg-blue-100 text-blue-800'
      case 'preorder': return 'bg-gray-100 text-gray-900'
      case 'coming_soon': return 'bg-purple-100 text-purple-800'
      case 'pret_a_commander': return 'bg-gray-100 text-gray-900'
      case 'echantillon_a_commander': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En stock'
      case 'out_of_stock': return 'Rupture'
      case 'sourcing': return 'Sourcing'
      case 'preorder': return 'Précommande'
      case 'coming_soon': return 'Bientôt dispo'
      case 'pret_a_commander': return 'Prêt à commander'
      case 'echantillon_a_commander': return 'Échantillon requis'
      default: return status
    }
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedProductId === product.id ? 'ring-2 ring-black' : ''
      }`}
      onClick={() => onProductSelect(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-black mb-1">{product.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{product.sku}</p>

            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(product.status)}>
                {getStatusLabel(product.status)}
              </Badge>

              {product.creation_mode === 'sourcing' && (
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Sourcing
                </Badge>
              )}

              {(product.creation_mode === 'complete' || !product.creation_mode) && (
                <Badge variant="outline" className="border-green-500 text-green-700">
                  <Package className="h-3 w-3 mr-1" />
                  Catalogue
                </Badge>
              )}

              {product.requires_sample && (
                <Badge variant="outline" className="border-black text-gray-800">
                  <Info className="h-3 w-3 mr-1" />
                  Échantillon
                </Badge>
              )}
            </div>

            {product.supplier_name && (
              <p className="text-xs text-gray-500">
                Fournisseur: {product.supplier_name}
              </p>
            )}

            {product.assigned_client_id && (
              <p className="text-xs text-blue-600 mt-1">
                🎯 Produit client spécifique
              </p>
            )}
          </div>

          <div className="ml-2">
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Sélectionner un produit
        </CardTitle>
        <CardDescription>
          Choisissez un produit du catalogue ou en sourcing pour cette consultation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recherche */}
        <div className="space-y-2">
          <Label>Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, SKU, fournisseur..."
              className="pl-10 border-black"
            />
          </div>
        </div>

        {/* Onglets de filtrage */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Tous ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="catalogue">
              Catalogue ({catalogueProducts.length})
            </TabsTrigger>
            <TabsTrigger value="sourcing">
              Sourcing ({sourcingProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </TabsContent>

          <TabsContent value="catalogue" className="space-y-3 max-h-96 overflow-y-auto">
            {catalogueProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun produit catalogue disponible
              </div>
            ) : (
              catalogueProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </TabsContent>

          <TabsContent value="sourcing" className="space-y-3 max-h-96 overflow-y-auto">
            {sourcingProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun produit sourcing disponible
              </div>
            ) : (
              sourcingProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Information sur le workflow */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p><strong>Catalogue :</strong> Produits validés disponibles à la vente</p>
              <p><strong>Sourcing :</strong> Produits en recherche/développement</p>
              <p><strong>Échantillon :</strong> Validation qualité recommandée (non bloquante)</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-black">{products.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{catalogueProducts.length}</div>
            <div className="text-xs text-gray-600">Catalogue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{sourcingProducts.length}</div>
            <div className="text-xs text-gray-600">Sourcing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}