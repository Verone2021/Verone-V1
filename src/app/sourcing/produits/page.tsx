"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  User,
  Users,
  Building,
  Calendar,
  Package,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Euro,
  AlertCircle
} from 'lucide-react'
import { useSourcingProducts } from '@/hooks/use-sourcing-products'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function SourcingProduitsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all')

  // Hook Supabase pour les produits sourcing
  const { products: sourcingProducts, loading, error, validateSourcing, orderSample } = useSourcingProducts({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sourcing_type: sourcingTypeFilter === 'all' ? undefined : (sourcingTypeFilter as 'interne' | 'client')
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sourcing':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">En sourcing</Badge>
      case 'echantillon_a_commander':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">Échantillon à commander</Badge>
      case 'echantillon_commande':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">Échantillon commandé</Badge>
      case 'in_stock':
        return <Badge variant="outline" className="border-green-300 text-green-600">En stock</Badge>
      case 'draft':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Brouillon</Badge>
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-600">{status}</Badge>
    }
  }

  const getSourcingTypeBadge = (sourcing_type: string | undefined, requires_sample: boolean) => {
    if (requires_sample) {
      return <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">Échantillon requis</Badge>
    }
    switch (sourcing_type) {
      case 'client':
        return <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">Client</Badge>
      case 'interne':
        return <Badge variant="outline" className="border-black text-black text-xs">Interne</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Standard</Badge>
    }
  }

  // Les filtres sont appliqués directement dans le hook useSourcingProducts
  const filteredProducts = sourcingProducts

  // Handlers pour les actions
  const handleValidateSourcing = async (productId: string) => {
    await validateSourcing(productId)
  }

  const handleOrderSample = async (productId: string) => {
    await orderSample(productId)
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Non défini'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Produits à Sourcer</h1>
              <p className="text-gray-600 mt-1">Gestion des demandes de sourcing clients et internes</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/sourcing')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/contacts-organisations/customers?type=professional')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Client Professionnel
              </Button>
              <Button
                onClick={() => router.push('/catalogue/create')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Sourcing
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtres et recherche */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
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
                  <SelectItem value="sourcing">En sourcing</SelectItem>
                  <SelectItem value="echantillon_a_commander">Échantillon à commander</SelectItem>
                  <SelectItem value="echantillon_commande">Échantillon commandé</SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourcingTypeFilter} onValueChange={setSourcingTypeFilter}>
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Type sourcing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="interne">Interne</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Plus de filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-black">{filteredProducts.length}</p>
                </div>
                <Package className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredProducts.filter(p => p.status === 'sourcing').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Échantillons</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredProducts.filter(p => p.requires_sample).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En stock</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredProducts.filter(p => p.status === 'in_stock').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Produits à Sourcer ({filteredProducts.length})</CardTitle>
            <CardDescription>Liste complète des demandes de sourcing</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Chargement des produits...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600">Erreur: {error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4 mb-4">
                          {/* Image du produit */}
                          {product.main_image_url && (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-black">{product.name}</h3>
                              {getStatusBadge(product.status)}
                              {getSourcingTypeBadge(product.sourcing_type, product.requires_sample)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">SKU: {product.sku}</span>
                              </div>

                              {product.supplier_cost_price && (
                                <div className="flex items-center space-x-2">
                                  <Euro className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">Coût: {formatPrice(product.supplier_cost_price)}</span>
                                </div>
                              )}

                              {product.estimated_selling_price && (
                                <div className="flex items-center space-x-2">
                                  <Euro className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600">Prix estimé: {formatPrice(product.estimated_selling_price)}</span>
                                </div>
                              )}

                              {product.supplier && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">Fournisseur: {product.supplier.name}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Créé: {formatDate(product.created_at)}</span>
                              </div>

                              {product.supplier_page_url && (
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={product.supplier_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Lien fournisseur
                                  </a>
                                </div>
                              )}
                            </div>

                            {product.assigned_client && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-600">
                                    <strong>Client assigné:</strong> {product.assigned_client.name}
                                    {product.assigned_client.is_professional ? ' (Professionnel)' : ' (Particulier)'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() => router.push(`/catalogue/${product.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() => router.push(`/catalogue/${product.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/catalogue/${product.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/catalogue/${product.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {product.status === 'sourcing' && (
                              <DropdownMenuItem onClick={() => handleOrderSample(product.id)}>
                                <Package className="h-4 w-4 mr-2" />
                                Commander échantillon
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {product.supplier_id && product.status === 'sourcing' && (
                              <DropdownMenuItem onClick={() => handleValidateSourcing(product.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Valider et ajouter au catalogue
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun produit trouvé</p>
                    <p className="text-sm text-gray-500">Essayez de modifier vos filtres ou créez votre premier produit sourcing</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}