'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { debounce } from '@verone/utils';
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
  AlertCircle,
  Globe,
} from 'lucide-react';

import { useSuppliers, useCustomers } from '@verone/organisations';
import { QuickSourcingModal } from '@verone/products';
import { useSourcingProducts } from '@verone/products';

export default function SourcingProduitsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(''); // État local pour l'input
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // ✅ État debounced pour le hook
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all'); // 🆕 Filtre fournisseur
  const [clientFilter, setClientFilter] = useState('all'); // 🆕 Filtre client
  const [isQuickSourcingModalOpen, setIsQuickSourcingModalOpen] =
    useState(false); // 🆕 Modal sourcing rapide

  // ✅ FIX 3.5: Fonction debounce mémorisée
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

  // Hooks pour charger fournisseurs et clients professionnels
  const { organisations: suppliers } = useSuppliers();
  const { organisations: customers } = useCustomers();

  // Hook Supabase pour les produits sourcing
  const {
    products: sourcingProducts,
    loading,
    error,
    validateSourcing,
    orderSample,
    refetch,
  } = useSourcingProducts({
    search: debouncedSearchTerm || undefined, // ✅ Utiliser debouncedSearchTerm
    status: statusFilter === 'all' ? undefined : statusFilter,
    sourcing_type:
      sourcingTypeFilter === 'all'
        ? undefined
        : (sourcingTypeFilter as 'interne' | 'client'),
    supplier_id: supplierFilter === 'all' ? undefined : supplierFilter, // 🆕
    assigned_client_id: clientFilter === 'all' ? undefined : clientFilter, // 🆕
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sourcing':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            En sourcing
          </Badge>
        );
      case 'echantillon_a_commander':
        return (
          <Badge variant="outline" className="border-gray-300 text-black">
            Échantillon à commander
          </Badge>
        );
      case 'echantillon_commande':
        return (
          <Badge variant="outline" className="border-gray-300 text-black">
            Échantillon commandé
          </Badge>
        );
      case 'in_stock':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            En stock
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Brouillon
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            {status}
          </Badge>
        );
    }
  };

  const getSourcingTypeBadge = (
    sourcing_type: string | undefined,
    requires_sample: boolean
  ) => {
    if (requires_sample) {
      return (
        <Badge variant="outline" className="border-gray-300 text-black text-xs">
          Échantillon requis
        </Badge>
      );
    }
    switch (sourcing_type) {
      case 'client':
        return (
          <Badge
            variant="outline"
            className="border-blue-300 text-blue-600 text-xs"
          >
            Client
          </Badge>
        );
      case 'interne':
        return (
          <Badge variant="outline" className="border-black text-black text-xs">
            Interne
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Standard
          </Badge>
        );
    }
  };

  // Les filtres sont appliqués directement dans le hook useSourcingProducts
  const filteredProducts = sourcingProducts;

  // Handlers pour les actions
  const handleValidateSourcing = async (productId: string) => {
    await validateSourcing(productId);
  };

  const handleOrderSample = async (productId: string) => {
    await orderSample(productId);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Produits à Sourcer
              </h1>
              <p className="text-gray-600 mt-1">
                Gestion des demandes de sourcing clients et internes
              </p>
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
                variant="outline"
                onClick={() =>
                  router.push(
                    '/contacts-organisations/customers?type=professional'
                  )
                }
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Client Professionnel
              </ButtonV2>
              <ButtonV2
                onClick={() => setIsQuickSourcingModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Sourcing
              </ButtonV2>
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
                  onChange={e => {
                    const value = e.target.value;
                    setSearchTerm(value); // ✅ Mise à jour immédiate de l'input
                    debouncedSearch(value); // ✅ Recherche debouncée
                  }}
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
                  <SelectItem value="echantillon_a_commander">
                    Échantillon à commander
                  </SelectItem>
                  <SelectItem value="echantillon_commande">
                    Échantillon commandé
                  </SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sourcingTypeFilter}
                onValueChange={setSourcingTypeFilter}
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Type sourcing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="interne">Interne</SelectItem>
                </SelectContent>
              </Select>

              <ButtonV2
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Plus de filtres
              </ButtonV2>
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
                  <p className="text-2xl font-bold text-black">
                    {filteredProducts.length}
                  </p>
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
                    {
                      filteredProducts.filter(p => p.status === 'sourcing')
                        .length
                    }
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
                    {
                      filteredProducts.filter(p => p.status === 'in_stock')
                        .length
                    }
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
            <CardTitle className="text-black">
              Produits à Sourcer ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              Liste complète des demandes de sourcing
            </CardDescription>
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
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-black">
                                {product.name}
                              </h3>
                              {getStatusBadge(product.status)}
                              {getSourcingTypeBadge(
                                product.sourcing_type,
                                product.requires_sample
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  SKU: {product.sku}
                                </span>
                              </div>

                              {product.cost_price && (
                                <div className="flex items-center space-x-2">
                                  <Euro className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    Coût: {formatPrice(product.cost_price)}
                                  </span>
                                </div>
                              )}

                              {product.supplier && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    Fournisseur: {product.supplier.name}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Créé: {formatDate(product.created_at)}
                                </span>
                              </div>

                              {/* Lien vers page détails fournisseur (navigation interne) */}
                              {product.supplier && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <Link
                                    href={`/contacts-organisations/suppliers/${product.supplier.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Voir le fournisseur
                                  </Link>
                                </div>
                              )}

                              {/* Site web général du fournisseur */}
                              {product.supplier?.website && (
                                <div className="flex items-center space-x-2">
                                  <Globe className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={product.supplier.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Site web fournisseur
                                  </a>
                                </div>
                              )}

                              {/* Lien vers URL externe fournisseur (page produit spécifique) */}
                              {product.supplier_page_url && (
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={product.supplier_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Page produit chez fournisseur
                                  </a>
                                </div>
                              )}
                            </div>

                            {product.assigned_client && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-600">
                                    <strong>Client assigné:</strong>{' '}
                                    {product.assigned_client.name}
                                    {product.assigned_client.type === 'client'
                                      ? ' (Client)'
                                      : ` (${product.assigned_client.type})`}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <ButtonV2
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() =>
                            router.push(
                              `/produits/sourcing/produits/${product.id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </ButtonV2>
                        <ButtonV2
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() =>
                            router.push(`/catalogue/${product.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </ButtonV2>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              className="border-gray-300"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </ButtonV2>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/produits/sourcing/produits/${product.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/catalogue/${product.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {product.status === 'sourcing' && (
                              <DropdownMenuItem
                                onClick={() => handleOrderSample(product.id)}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Commander échantillon
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {product.supplier_id &&
                              product.status === 'sourcing' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleValidateSourcing(product.id)
                                  }
                                >
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
                    <p className="text-sm text-gray-500">
                      Essayez de modifier vos filtres ou créez votre premier
                      produit sourcing
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal sourcing rapide */}
      <QuickSourcingModal
        open={isQuickSourcingModalOpen}
        onClose={() => setIsQuickSourcingModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsQuickSourcingModalOpen(false);
        }}
      />
    </div>
  );
}
