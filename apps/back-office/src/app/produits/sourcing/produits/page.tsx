'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSuppliers, useCustomers } from '@verone/organisations';
import { QuickSourcingModal } from '@verone/products';
import { useSourcingProducts } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonUnified, IconButton } from '@verone/ui';
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
  Archive,
  Trash2,
} from 'lucide-react';

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
    archiveSourcingProduct,
    deleteSourcingProduct,
    refetch,
  } = useSourcingProducts({
    search: debouncedSearchTerm || undefined, // ✅ Utiliser debouncedSearchTerm
    product_status: statusFilter === 'all' ? undefined : statusFilter, // ✅ FIX: product_status au lieu de status
    sourcing_type:
      sourcingTypeFilter === 'all'
        ? undefined
        : (sourcingTypeFilter as 'interne' | 'client'),
    supplier_id: supplierFilter === 'all' ? undefined : supplierFilter, // 🆕
    assigned_client_id: clientFilter === 'all' ? undefined : clientFilter, // 🆕
  });

  // ✅ FIX: Utiliser les vraies valeurs enum de product_status
  const getStatusBadge = (productStatus: string | undefined) => {
    switch (productStatus) {
      case 'draft':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            En sourcing
          </Badge>
        );
      case 'preorder':
        return (
          <Badge
            variant="outline"
            className="border-orange-300 text-orange-600"
          >
            Échantillon commandé
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Au catalogue
          </Badge>
        );
      case 'discontinued':
        return (
          <Badge variant="outline" className="border-red-300 text-red-600">
            Discontinué
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            {productStatus || 'Inconnu'}
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

  const handleArchiveProduct = async (productId: string) => {
    await archiveSourcingProduct(productId);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteSourcingProduct(productId);
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
              <ButtonUnified
                variant="outline"
                onClick={() => router.push('/produits/sourcing')}
              >
                Retour Dashboard
              </ButtonUnified>
              <ButtonUnified
                variant="outline"
                icon={Users}
                iconPosition="left"
                onClick={() =>
                  router.push(
                    '/contacts-organisations/customers?type=professional'
                  )
                }
              >
                Client Professionnel
              </ButtonUnified>
              <ButtonUnified
                variant="default"
                icon={Plus}
                iconPosition="left"
                onClick={() => setIsQuickSourcingModalOpen(true)}
              >
                Nouveau Sourcing
              </ButtonUnified>
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

              <ButtonUnified
                variant="outline"
                icon={Filter}
                iconPosition="left"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Plus de filtres
              </ButtonUnified>
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
                      filteredProducts.filter(p => p.product_status === 'draft')
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
                      filteredProducts.filter(
                        p => p.product_status === 'active'
                      ).length
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
                              {getStatusBadge(product.product_status)}
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
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir les détails"
                          onClick={() =>
                            router.push(
                              `/produits/sourcing/produits/${product.id}`
                            )
                          }
                        />
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          label="Modifier"
                          onClick={() =>
                            router.push(`/catalogue/${product.id}/edit`)
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              variant="outline"
                              size="sm"
                              icon={MoreHorizontal}
                              label="Plus d'actions"
                            />
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
                            {product.product_status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleOrderSample(product.id)}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Commander échantillon
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {product.supplier_id &&
                              product.product_status === 'draft' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleValidateSourcing(product.id)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Valider et ajouter au catalogue
                                </DropdownMenuItem>
                              )}
                            {!product.archived_at && (
                              <DropdownMenuItem
                                onClick={() => handleArchiveProduct(product.id)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Annuler / Archiver
                              </DropdownMenuItem>
                            )}
                            {product.archived_at && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer définitivement
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
