"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Package,
  User,
  Building,
  ArrowLeft,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { useDrafts } from '../../../hooks/use-drafts'
import { useToast } from '../../../hooks/use-toast'

export default function SourcingManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { drafts, loading, loadDrafts, updateSampleRequirement, validateDraft, finalizeToProduct } = useDrafts()

  const [searchTerm, setSearchTerm] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all')

  useEffect(() => {
    loadDrafts()
  }, [])

  // Filtrer les produits en sourcing uniquement
  const sourcingProducts = drafts.filter(draft => draft.creation_mode === 'sourcing')

  // Appliquer les filtres
  const filteredProducts = sourcingProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier_page_url?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === 'all' ||
                         (clientFilter === 'internal' && product.sourcing_type === 'interne') ||
                         (clientFilter === 'external' && product.sourcing_type === 'client')

    const matchesType = sourcingTypeFilter === 'all' ||
                       product.sourcing_type === sourcingTypeFilter

    return matchesSearch && matchesClient && matchesType
  })

  // Grouper par type de sourcing
  const internalSourcing = filteredProducts.filter(p => p.sourcing_type === 'interne')
  const clientSourcing = filteredProducts.filter(p => p.sourcing_type === 'client')

  // Actions sur les produits
  const handleViewProduct = (productId: string) => {
    router.push(`/catalogue/sourcing/products/${productId}`)
  }

  const handleEditProduct = (productId: string) => {
    router.push(`/catalogue/edit/${productId}`)
  }

  const handleToggleSample = async (productId: string, currentState: boolean) => {
    try {
      await updateSampleRequirement(productId, !currentState)
      toast({
        title: "Échantillonnage mis à jour",
        description: `Le produit ${!currentState ? 'nécessite maintenant' : 'ne nécessite plus'} d'échantillon`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'exigence d'échantillonnage",
        variant: "destructive"
      })
    }
  }

  const handleValidateToSample = async (productId: string) => {
    try {
      // D'abord marquer comme nécessitant un échantillon
      await updateSampleRequirement(productId, true)
      toast({
        title: "Produit envoyé vers échantillons",
        description: "Le produit a été marqué comme nécessitant un échantillon"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider le produit",
        variant: "destructive"
      })
    }
  }

  const handleValidateToCatalog = async (productId: string) => {
    try {
      await finalizeToProduct(productId)
      toast({
        title: "Produit finalisé et ajouté au catalogue",
        description: "Le produit sourcing a été transféré avec succès vers le catalogue principal"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de finaliser le produit sourcing",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits en sourcing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Gestion du Sourcing</h1>
                <p className="text-gray-600">Suivi des produits en cours de sourcing</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/catalogue/create')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Nouveau sourcing
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total sourcing</p>
                  <p className="text-2xl font-bold">{sourcingProducts.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sourcing interne</p>
                  <p className="text-2xl font-bold">{internalSourcing.length}</p>
                </div>
                <Building className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sourcing client</p>
                  <p className="text-2xl font-bold">{clientSourcing.length}</p>
                </div>
                <User className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avec échantillons</p>
                  <p className="text-2xl font-bold">
                    {sourcingProducts.filter(p => p.requires_sample).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom du produit, URL..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type de sourcing</Label>
                <Select value={sourcingTypeFilter} onValueChange={setSourcingTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="interne">Sourcing interne</SelectItem>
                    <SelectItem value="client">Sourcing client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtre client</Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="internal">Catalogue général</SelectItem>
                    <SelectItem value="external">Clients spécifiques</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setClientFilter('all')
                    setSourcingTypeFilter('all')
                  }}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits par onglets */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Tous ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="internal">
              Sourcing interne ({internalSourcing.length})
            </TabsTrigger>
            <TabsTrigger value="client">
              Sourcing client ({clientSourcing.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <SourcingProductsList
              products={filteredProducts}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onToggleSample={handleToggleSample}
              onValidateToSample={handleValidateToSample}
              onValidateToCatalog={handleValidateToCatalog}
            />
          </TabsContent>

          <TabsContent value="internal">
            <SourcingProductsList
              products={internalSourcing}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onToggleSample={handleToggleSample}
              onValidateToSample={handleValidateToSample}
              onValidateToCatalog={handleValidateToCatalog}
            />
          </TabsContent>

          <TabsContent value="client">
            <SourcingProductsList
              products={clientSourcing}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onToggleSample={handleToggleSample}
              onValidateToSample={handleValidateToSample}
              onValidateToCatalog={handleValidateToCatalog}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Composant pour afficher la liste des produits
function SourcingProductsList({
  products,
  onView,
  onEdit,
  onToggleSample,
  onValidateToSample,
  onValidateToCatalog
}: {
  products: any[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onToggleSample: (id: string, current: boolean) => void
  onValidateToSample: (id: string) => void
  onValidateToCatalog: (id: string) => void
}) {
  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun produit en sourcing ne correspond à vos critères de recherche.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* En-tête produit */}
                <div className="flex items-start space-x-4">
                  {product.primary_image_url && (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black">
                      {product.name || 'Sans nom'}
                    </h3>
                    {product.supplier_page_url && (
                      <a
                        href={product.supplier_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Voir chez le fournisseur →
                      </a>
                    )}
                  </div>
                </div>

                {/* Badges et statut */}
                <div className="flex items-center space-x-2">
                  <Badge variant={product.sourcing_type === 'interne' ? 'default' : 'secondary'}>
                    {product.sourcing_type === 'interne' ? 'Sourcing interne' : 'Sourcing client'}
                  </Badge>

                  {product.requires_sample && (
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      Échantillon requis
                    </Badge>
                  )}

                  {product.assigned_client_id && (
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      <User className="h-3 w-3 mr-1" />
                      Client spécifique
                    </Badge>
                  )}
                </div>

                {/* Métadonnées */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {product.lastModified}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(product.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Éditer
                </Button>

                <Select
                  value="actions"
                  onValueChange={(value) => {
                    if (value === 'sample') {
                      onValidateToSample(product.id)
                    } else if (value === 'catalog') {
                      onValidateToCatalog(product.id)
                    } else if (value === 'toggle-sample') {
                      onToggleSample(product.id, product.requires_sample)
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sample">
                      → Échantillons à commander
                    </SelectItem>
                    <SelectItem value="catalog">
                      → Catalogue principal
                    </SelectItem>
                    <SelectItem value="toggle-sample">
                      {product.requires_sample ? 'Retirer échantillon' : 'Nécessite échantillon'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}