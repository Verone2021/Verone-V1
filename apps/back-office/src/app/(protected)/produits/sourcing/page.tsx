'use client';

import { useState, useMemo, useEffect } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { QuickSourcingModal } from '@verone/products';
import { useSourcingProducts } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { IconButton } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { debounce } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Package,
  Euro,
  AlertCircle,
  Archive,
  Trash2,
  Building,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react';

export default function SourcingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all');
  const [isQuickSourcingModalOpen, setIsQuickSourcingModalOpen] =
    useState(false);
  const [completedThisMonth, setCompletedThisMonth] = useState<number>(0);

  // Debounce search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

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
    search: debouncedSearchTerm || undefined,
    product_status: statusFilter === 'all' ? undefined : statusFilter,
    sourcing_type:
      sourcingTypeFilter === 'all'
        ? undefined
        : (sourcingTypeFilter as 'interne' | 'client'),
  });

  // Charger le nombre de produits complétés ce mois-ci
  useEffect(() => {
    const fetchCompletedCount = async () => {
      try {
        const supabase = createClient();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('creation_mode', 'complete')
          .eq('product_status', 'active')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        setCompletedThisMonth(count || 0);
      } catch (error) {
        console.error('Erreur chargement produits complétés:', error);
      }
    };
    fetchCompletedCount();
  }, []);

  // KPIs calculés
  const stats = {
    totalDrafts:
      sourcingProducts?.filter(p => p.product_status === 'draft').length || 0,
    pendingValidation:
      sourcingProducts?.filter(
        p => p.product_status === 'preorder' || p.requires_sample
      ).length || 0,
    samplesOrdered:
      sourcingProducts?.filter(
        p => p.requires_sample && p.product_status === 'preorder'
      ).length || 0,
    completedThisMonth,
  };

  // Badge statut
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
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: colors.text.muted, color: colors.text.DEFAULT }}
        >
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
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: colors.text.muted,
              color: colors.text.DEFAULT,
            }}
          >
            Interne
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handlers
  const handleValidateSourcing = async (productId: string) => {
    await validateSourcing(productId);
  };

  const _handleOrderSample = async (productId: string) => {
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

  // Helper pour récupérer l'image principale
  const getPrimaryImage = (product: any) => {
    if (!product.product_images || product.product_images.length === 0)
      return null;
    const primary = product.product_images.find((img: any) => img.is_primary);
    return primary?.public_url || product.product_images[0]?.public_url || null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: spacing[6] }}
      >
        <div>
          <h1
            className="text-3xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            Sourcing
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion des produits à sourcer et validation catalogue
          </p>
        </div>
        <ButtonV2
          variant="primary"
          icon={Plus}
          onClick={() => setIsQuickSourcingModalOpen(true)}
        >
          Nouveau Sourcing
        </ButtonV2>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>
                  Brouillons Actifs
                </p>
                <div
                  className="text-2xl font-bold"
                  style={{ color: colors.text.DEFAULT }}
                >
                  {loading ? '...' : stats.totalDrafts}
                </div>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  produits en cours de sourcing
                </p>
              </div>
              <Search
                className="h-8 w-8"
                style={{ color: colors.primary[500] }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>
                  En Validation
                </p>
                <div
                  className="text-2xl font-bold"
                  style={{ color: colors.warning[500] }}
                >
                  {loading ? '...' : stats.pendingValidation}
                </div>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  produits à valider
                </p>
              </div>
              <AlertTriangle
                className="h-8 w-8"
                style={{ color: colors.warning[500] }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>
                  Échantillons
                </p>
                <div
                  className="text-2xl font-bold"
                  style={{ color: colors.primary[500] }}
                >
                  {loading ? '...' : stats.samplesOrdered}
                </div>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  commandes en cours
                </p>
              </div>
              <Eye className="h-8 w-8" style={{ color: colors.primary[500] }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>
                  Complétés
                </p>
                <div
                  className="text-2xl font-bold"
                  style={{ color: colors.success[500] }}
                >
                  {loading ? '...' : stats.completedThisMonth}
                </div>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  ce mois-ci
                </p>
              </div>
              <TrendingUp
                className="h-8 w-8"
                style={{ color: colors.success[500] }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: colors.text.DEFAULT }}>
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 h-4 w-4"
                style={{ color: colors.text.muted }}
              />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  debouncedSearch(value);
                }}
                className="pl-10"
                style={{ borderColor: colors.border.DEFAULT }}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">En sourcing</SelectItem>
                <SelectItem value="preorder">Échantillon commandé</SelectItem>
                <SelectItem value="active">Au catalogue</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sourcingTypeFilter}
              onValueChange={setSourcingTypeFilter}
            >
              <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
                <SelectValue placeholder="Type sourcing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="interne">Interne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: colors.text.DEFAULT }}>
            Produits à Sourcer ({sourcingProducts.length})
          </CardTitle>
          <CardDescription>
            Liste complète des demandes de sourcing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <Package
                className="h-12 w-12 mx-auto mb-4 animate-spin"
                style={{ color: colors.text.muted }}
              />
              <p style={{ color: colors.text.subtle }}>
                Chargement des produits...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: colors.danger[500] }}
              />
              <p style={{ color: colors.danger[500] }}>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {sourcingProducts.map(product => {
                const imageUrl = getPrimaryImage(product);

                return (
                  <div
                    key={product.id}
                    className="rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    style={{ border: `1px solid ${colors.border.DEFAULT}` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Image produit */}
                      <div
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: colors.background.subtle,
                          border: `1px solid ${colors.border.DEFAULT}`,
                        }}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon
                              className="h-6 w-6"
                              style={{ color: colors.text.muted }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Infos produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3
                            className="font-semibold truncate"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            {product.name}
                          </h3>
                          {getStatusBadge(product.product_status)}
                          {getSourcingTypeBadge(
                            product.sourcing_type,
                            product.requires_sample
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Package
                              className="h-4 w-4"
                              style={{ color: colors.text.muted }}
                            />
                            <span style={{ color: colors.text.subtle }}>
                              SKU: {product.sku}
                            </span>
                          </div>

                          {product.cost_price && (
                            <div className="flex items-center space-x-2">
                              <Euro
                                className="h-4 w-4"
                                style={{ color: colors.text.muted }}
                              />
                              <span style={{ color: colors.text.subtle }}>
                                {formatPrice(product.cost_price)}
                              </span>
                            </div>
                          )}

                          {product.supplier && (
                            <div className="flex items-center space-x-2">
                              <Building
                                className="h-4 w-4"
                                style={{ color: colors.text.muted }}
                              />
                              <span
                                className="truncate"
                                style={{ color: colors.text.subtle }}
                              >
                                {product.supplier.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Calendar
                              className="h-4 w-4"
                              style={{ color: colors.text.muted }}
                            />
                            <span style={{ color: colors.text.subtle }}>
                              {formatDate(product.created_at)}
                            </span>
                          </div>
                        </div>

                        {product.assigned_client && (
                          <div
                            className="mt-2 p-2 rounded text-sm"
                            style={{ backgroundColor: colors.primary[50] }}
                          >
                            <div className="flex items-center space-x-2">
                              <User
                                className="h-4 w-4"
                                style={{ color: colors.primary[600] }}
                              />
                              <span style={{ color: colors.primary[600] }}>
                                <strong>Client:</strong>{' '}
                                {product.assigned_client.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions - Boutons CRUD design v2 */}
                      <div className="flex items-center gap-1.5">
                        {/* Bouton Voir */}
                        <ButtonV2
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() =>
                            router.push(
                              `/produits/sourcing/produits/${product.id}`
                            )
                          }
                        >
                          Voir
                        </ButtonV2>

                        {/* Bouton Modifier - redirige vers la page détails avec modal */}
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          label="Modifier le produit"
                          onClick={() =>
                            router.push(
                              `/produits/sourcing/produits/${product.id}`
                            )
                          }
                        />

                        {/* Bouton Valider (si fournisseur assigné et draft) */}
                        {product.supplier_id &&
                          product.product_status === 'draft' && (
                            <IconButton
                              variant="success"
                              size="sm"
                              icon={CheckCircle}
                              label="Valider et ajouter au catalogue"
                              onClick={() => handleValidateSourcing(product.id)}
                            />
                          )}

                        {/* Bouton Archiver (si pas archivé) */}
                        {!product.archived_at && (
                          <IconButton
                            variant="outline"
                            size="sm"
                            icon={Archive}
                            label="Archiver le produit"
                            onClick={() => handleArchiveProduct(product.id)}
                          />
                        )}

                        {/* Bouton Supprimer (si archivé) */}
                        {product.archived_at && (
                          <IconButton
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            label="Supprimer définitivement"
                            onClick={() => handleDeleteProduct(product.id)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sourcingProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package
                    className="h-12 w-12 mx-auto mb-4"
                    style={{ color: colors.text.muted }}
                  />
                  <p style={{ color: colors.text.subtle }}>
                    Aucun produit trouvé
                  </p>
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    Essayez de modifier vos filtres ou créez votre premier
                    produit sourcing
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
