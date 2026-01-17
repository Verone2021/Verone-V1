'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { CategoryFilterCombobox } from '@verone/categories';
import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import {
  UniversalProductSelectorV2,
  type SelectedProduct,
} from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { Badge, Progress } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  Search,
  Package,
  Star,
  Plus,
  Loader2,
  ToggleRight,
  X,
  LayoutGrid,
  List,
  Eye,
  Users,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useAddProductsToCatalog,
  useToggleProductEnabled,
  useToggleProductFeatured,
  type LinkMeCatalogProduct,
} from '../hooks/use-linkme-catalog';
import { usePendingApprovalsCount } from '../hooks/use-product-approvals';
import { calculateSimpleCompleteness } from '../types';

// Labels et styles pour product_status (source de verite)
const PRODUCT_STATUS_CONFIG = {
  active: {
    label: 'Actif',
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  preorder: {
    label: 'Precommande',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  discontinued: {
    label: 'Arrete',
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
} as const;

// Composant badge statut produit
function ProductStatusBadge({
  status,
}: {
  status: 'active' | 'preorder' | 'discontinued' | 'draft';
}) {
  const config = PRODUCT_STATUS_CONFIG[status] || PRODUCT_STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// Composant badge stock
function StockBadge({ stock }: { stock: number }) {
  if (stock > 10) {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 border-green-200"
      >
        {stock} en stock
      </Badge>
    );
  } else if (stock > 0) {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-orange-50 text-orange-700 border-orange-200"
      >
        {stock} restant
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-red-50 text-red-700 border-red-200"
      >
        Rupture
      </Badge>
    );
  }
}

/**
 * Page Catalogue LinkMe
 *
 * Gestion des produits disponibles pour les affiliés :
 * - Toggle activation (visible affiliés connectés)
 * - Toggle vitrine (visible visiteurs non connectés)
 * - Configuration marge (min/max/suggérée)
 * - Ajout de nouveaux produits depuis catalogue global
 */
export default function LinkMeCataloguePage() {
  // State: Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<
    string | undefined
  >(undefined);

  // State: Vue (grille ou liste)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // State: Modal ajout produits
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State: Onglet actif (général vs sourcés vs affiliés)
  const [activeTab, setActiveTab] = useState<
    'general' | 'sourced' | 'affiliate'
  >('general');

  // Hooks - Un seul hook pour tous les produits
  const { data: allCatalogProducts, isLoading: catalogLoading } =
    useLinkMeCatalogProducts();
  const addProductsMutation = useAddProductsToCatalog();
  const toggleEnabledMutation = useToggleProductEnabled();
  const toggleFeaturedMutation = useToggleProductFeatured();

  // Hook pour compter les approbations en attente
  const { data: pendingCount = 0 } = usePendingApprovalsCount();

  // Séparer les produits par type: général, sourcés, affiliés
  const generalCatalogProducts = useMemo(
    () =>
      (allCatalogProducts || []).filter(
        p => !p.is_sourced && !p.created_by_affiliate
      ),
    [allCatalogProducts]
  );
  const sourcingProducts = useMemo(
    () =>
      (allCatalogProducts || []).filter(
        p => p.is_sourced && !p.created_by_affiliate
      ),
    [allCatalogProducts]
  );
  const affiliateProducts = useMemo(
    () =>
      (allCatalogProducts || []).filter(p => p.created_by_affiliate !== null),
    [allCatalogProducts]
  );

  // Produits déjà dans le catalogue (IDs) - pour exclure du sélecteur
  const catalogProductIds = useMemo(() => {
    return allCatalogProducts?.map(p => p.product_id) || [];
  }, [allCatalogProducts]);

  // Produits catalogue général filtrés
  const filteredCatalogProducts = useMemo(() => {
    return (generalCatalogProducts || []).filter(product => {
      // Recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = product.product_name.toLowerCase().includes(search);
        const matchRef = product.product_reference
          .toLowerCase()
          .includes(search);
        if (!matchName && !matchRef) return false;
      }

      // Statut
      if (statusFilter === 'enabled' && !product.is_enabled) return false;
      if (statusFilter === 'disabled' && product.is_enabled) return false;

      // Sous-catégorie (filtre hiérarchique)
      if (subcategoryFilter && product.subcategory_id !== subcategoryFilter) {
        return false;
      }

      return true;
    });
  }, [generalCatalogProducts, searchTerm, statusFilter, subcategoryFilter]);

  // Produits sur mesure filtrés (même type LinkMeCatalogProduct)
  const filteredSourcingProducts = useMemo(() => {
    return (sourcingProducts || []).filter(product => {
      // Recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = product.product_name.toLowerCase().includes(search);
        const matchRef = product.product_reference
          .toLowerCase()
          .includes(search);
        if (!matchName && !matchRef) return false;
      }

      // Statut
      if (statusFilter === 'enabled' && !product.is_enabled) return false;
      if (statusFilter === 'disabled' && product.is_enabled) return false;

      // Sous-catégorie (filtre hiérarchique)
      if (subcategoryFilter && product.subcategory_id !== subcategoryFilter) {
        return false;
      }

      return true;
    });
  }, [sourcingProducts, searchTerm, statusFilter, subcategoryFilter]);

  // Produits affiliés filtrés
  const filteredAffiliateProducts = useMemo(() => {
    return (affiliateProducts || []).filter(product => {
      // Recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = product.product_name.toLowerCase().includes(search);
        const matchRef = product.product_reference
          .toLowerCase()
          .includes(search);
        if (!matchName && !matchRef) return false;
      }

      // Statut
      if (statusFilter === 'enabled' && !product.is_enabled) return false;
      if (statusFilter === 'disabled' && product.is_enabled) return false;

      // Sous-catégorie (filtre hiérarchique)
      if (subcategoryFilter && product.subcategory_id !== subcategoryFilter) {
        return false;
      }

      return true;
    });
  }, [affiliateProducts, searchTerm, statusFilter, subcategoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const allProducts = allCatalogProducts || [];
    return {
      total: allProducts.length,
      enabled: allProducts.filter(p => p.is_enabled).length,
      featured: allProducts.filter(p => p.is_featured).length,
      // Compteurs par onglet
      generalCount: generalCatalogProducts.length,
      sourcedCount: sourcingProducts.length,
      affiliateCount: affiliateProducts.length,
    };
  }, [
    allCatalogProducts,
    generalCatalogProducts,
    sourcingProducts,
    affiliateProducts,
  ]);

  // Handlers
  const handleToggleEnabled = async (product: LinkMeCatalogProduct) => {
    try {
      await toggleEnabledMutation.mutateAsync({
        catalogProductId: product.id,
        isEnabled: !product.is_enabled,
      });
      toast.success(
        product.is_enabled
          ? 'Produit désactivé du catalogue'
          : 'Produit activé dans le catalogue'
      );
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleToggleFeatured = async (product: LinkMeCatalogProduct) => {
    try {
      await toggleFeaturedMutation.mutateAsync({
        catalogProductId: product.id,
        isFeatured: !product.is_featured,
      });
      toast.success(
        product.is_featured
          ? 'Produit retiré des vedettes'
          : 'Produit ajouté aux vedettes'
      );
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleAddProducts = async (products: SelectedProduct[]) => {
    if (products.length === 0) return;

    try {
      const productIds = products.map(p => p.id);
      await addProductsMutation.mutateAsync(productIds);
      toast.success(`${products.length} produit(s) ajouté(s) au catalogue`);
      setIsAddModalOpen(false);
    } catch {
      toast.error("Erreur lors de l'ajout des produits");
    }
  };

  // Loading: un seul état pour tout le catalogue
  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Catalogue Produits</h1>
              <p className="text-sm text-gray-500">
                Gérez les produits disponibles pour les affiliés
              </p>
            </div>
          </div>

          <ButtonV2 onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des produits
          </ButtonV2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Stats KPI */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total catalogue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <ToggleRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.enabled}</p>
                  <p className="text-sm text-gray-500">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.featured}</p>
                  <p className="text-sm text-gray-500">Vedettes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets: Catalogue Général vs Produits Sur Mesure */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === 'general'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Catalogue général
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  activeTab === 'general'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.generalCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sourced')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === 'sourced'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Users className="h-4 w-4" />
              Produits sur mesure
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  activeTab === 'sourced'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.sourcedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('affiliate')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === 'affiliate'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <UserPlus className="h-4 w-4" />
              Produits des affiliés
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  activeTab === 'affiliate'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.affiliateCount}
              </span>
              {/* Badge notification approbations en attente */}
              {pendingCount > 0 && (
                <Link
                  href="/canaux-vente/linkme/approbations"
                  onClick={e => e.stopPropagation()}
                  className="ml-1"
                >
                  <Badge
                    variant="destructive"
                    className="animate-pulse hover:scale-105 transition-transform"
                  >
                    {pendingCount} en attente
                  </Badge>
                </Link>
              )}
            </button>
          </div>

          {/* Filtre Statut Actif/Inactif - Onglets visuels */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === 'all'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Tous
              <span className="ml-1.5 text-xs text-gray-500">
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('enabled')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === 'enabled'
                  ? 'bg-green-100 shadow-sm text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Actifs
              <span className="ml-1.5 text-xs">{stats.enabled}</span>
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === 'disabled'
                  ? 'bg-red-100 shadow-sm text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Désactivés
              <span className="ml-1.5 text-xs">
                {stats.total - stats.enabled}
              </span>
            </button>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou référence..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre Catégorie hiérarchique */}
              <CategoryFilterCombobox
                value={subcategoryFilter}
                onValueChange={setSubcategoryFilter}
                entityType="products"
                placeholder="Catégorie..."
              />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {activeTab === 'general'
                  ? filteredCatalogProducts.length
                  : activeTab === 'sourced'
                    ? filteredSourcingProducts.length
                    : filteredAffiliateProducts.length}{' '}
                produit
                {(activeTab === 'general'
                  ? filteredCatalogProducts.length
                  : activeTab === 'sourced'
                    ? filteredSourcingProducts.length
                    : filteredAffiliateProducts.length) > 1
                  ? 's'
                  : ''}{' '}
                affiché
                {(activeTab === 'general'
                  ? filteredCatalogProducts.length
                  : activeTab === 'sourced'
                    ? filteredSourcingProducts.length
                    : filteredAffiliateProducts.length) > 1
                  ? 's'
                  : ''}
              </p>

              <div className="flex items-center gap-2">
                {/* Toggle Vue Grille/Liste */}
                <div className="flex items-center border rounded-lg p-0.5 bg-gray-100">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'grid'
                        ? 'bg-white shadow-sm text-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    title="Vue grille"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'list'
                        ? 'bg-white shadow-sm text-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    title="Vue liste"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {(searchTerm ||
                  statusFilter !== 'all' ||
                  subcategoryFilter) && (
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSubcategoryFilter(undefined);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser filtres
                  </ButtonV2>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produits - Rendu conditionnel selon onglet */}
        {activeTab === 'general' ? (
          /* ========== ONGLET CATALOGUE GÉNÉRAL ========== */
          filteredCatalogProducts.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                Aucun produit dans le catalogue
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Cliquez sur &quot;Ajouter des produits&quot; pour commencer
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* VUE GRILLE - Catalogue Général */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalogProducts.map(product => (
                <Card
                  key={product.id}
                  className={cn(
                    'border-2 transition-all duration-150',
                    !product.is_enabled
                      ? 'border-gray-200 bg-gray-50 opacity-75'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Thumbnail + Info */}
                    <div className="flex items-start gap-3">
                      <ProductThumbnail
                        src={product.product_image_url}
                        alt={product.product_name}
                        size="md"
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs text-black truncate">
                          {product.product_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {product.product_reference}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product.is_featured && (
                            <Badge
                              variant="outline"
                              className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                            >
                              Vedette
                            </Badge>
                          )}
                          <ProductStatusBadge status={product.product_status} />
                          <StockBadge stock={product.product_stock_real} />
                        </div>
                        {/* Badge produit sourcé avec enseigne/organisation */}
                        {product.is_sourced && (
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {product.enseigne_name ||
                                product.assigned_client_name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Complétude */}
                    {(() => {
                      const completeness = calculateSimpleCompleteness(product);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={cn(
                                completeness === 100
                                  ? 'text-green-600'
                                  : 'text-amber-600'
                              )}
                            >
                              {completeness}% complet
                            </span>
                            {completeness < 100 && (
                              <span className="text-gray-400">Non validé</span>
                            )}
                          </div>
                          <Progress
                            value={completeness}
                            className={cn(
                              'h-1.5',
                              completeness === 100
                                ? '[&>div]:bg-green-500'
                                : '[&>div]:bg-amber-500'
                            )}
                          />
                        </div>
                      );
                    })()}

                    {/* Footer: Stats + Action */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        <span>{product.views_count} vues</span>
                        <span className="mx-1">•</span>
                        <span>{product.selections_count} sél.</span>
                      </div>
                      <Link
                        href={`/canaux-vente/linkme/catalogue/${product.id}`}
                      >
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir détails"
                        />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* VUE LISTE - Catalogue Général */
            <Card>
              <div className="divide-y">
                {filteredCatalogProducts.map(product => {
                  // Calcul du prix client LinkMe
                  const clientPrice =
                    product.product_selling_price_ht &&
                    product.linkme_commission_rate !== null
                      ? product.product_selling_price_ht *
                        (1 + product.linkme_commission_rate / 100)
                      : null;

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-center gap-4 p-4 transition-colors',
                        !product.is_enabled
                          ? 'bg-gray-50 opacity-75'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      {/* Thumbnail */}
                      <ProductThumbnail
                        src={product.product_image_url}
                        alt={product.product_name}
                        size="sm"
                        className="flex-shrink-0"
                      />

                      {/* Info produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-xs text-black truncate">
                            {product.product_name}
                          </h3>
                          {product.is_featured && (
                            <Badge
                              variant="outline"
                              className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                            >
                              Vedette
                            </Badge>
                          )}
                          <ProductStatusBadge status={product.product_status} />
                          <StockBadge stock={product.product_stock_real} />
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 font-mono">
                            {product.product_reference}
                          </p>
                          {/* Badge produit sourcé avec enseigne/organisation */}
                          {product.is_sourced && (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {product.enseigne_name ||
                                product.assigned_client_name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Prix d'achat HT */}
                      <div className="hidden md:block text-right min-w-[70px]">
                        <p className="text-[10px] text-gray-400">Achat HT</p>
                        <p className="text-xs text-gray-600">
                          {formatPrice(product.product_price_ht)}
                        </p>
                      </div>

                      {/* Prix de vente HT (LinkMe) */}
                      <div className="hidden md:block text-right min-w-[70px]">
                        <p className="text-[10px] text-gray-400">Vente HT</p>
                        {product.product_selling_price_ht ? (
                          <p className="text-xs font-medium text-blue-600">
                            {formatPrice(product.product_selling_price_ht)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Commission LinkMe */}
                      <div className="hidden lg:block text-right min-w-[50px]">
                        <p className="text-[10px] text-gray-400">Comm.</p>
                        {product.linkme_commission_rate !== null ? (
                          <p className="text-xs text-purple-600">
                            {product.linkme_commission_rate}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Prix client LinkMe (calculé) */}
                      <div className="hidden lg:block text-right min-w-[80px]">
                        <p className="text-[10px] text-gray-400">Prix Client</p>
                        {clientPrice ? (
                          <p className="text-xs font-medium text-green-600">
                            {formatPrice(clientPrice)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Marge de sécurité (buffer_rate) */}
                      <div className="hidden xl:block text-right min-w-[55px]">
                        <p className="text-[10px] text-gray-400">Marge sécu</p>
                        {product.buffer_rate !== null ? (
                          <p className="text-xs text-amber-600">
                            {(product.buffer_rate * 100).toFixed(0)}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Marge suggérée */}
                      <div className="hidden xl:block text-right min-w-[55px]">
                        <p className="text-[10px] text-gray-400">Marge sugg.</p>
                        {product.suggested_margin_rate !== null ? (
                          <p className="text-xs font-medium text-emerald-600">
                            {product.suggested_margin_rate}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Lien détail */}
                      <Link
                        href={`/canaux-vente/linkme/catalogue/${product.id}`}
                      >
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir détails"
                        />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          )
        ) : activeTab === 'sourced' ? (
          /* ========== ONGLET PRODUITS SUR MESURE ========== */
          /* Même rendu que Catalogue Général (type LinkMeCatalogProduct) */
          filteredSourcingProducts.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50/50">
              <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                Aucun produit sur mesure
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Les produits sourcés pour une enseigne ou organisation
                apparaîtront ici
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* VUE GRILLE - Produits Sur Mesure (identique à Catalogue Général) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSourcingProducts.map(product => (
                <Card
                  key={product.id}
                  className={cn(
                    'border-2 transition-all duration-150',
                    !product.is_enabled
                      ? 'border-gray-200 bg-gray-50 opacity-75'
                      : 'border-amber-200 hover:border-amber-300'
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Thumbnail + Info */}
                    <div className="flex items-start gap-3">
                      <ProductThumbnail
                        src={product.product_image_url}
                        alt={product.product_name}
                        size="md"
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs text-black truncate">
                          {product.product_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {product.product_reference}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product.is_featured && (
                            <Badge
                              variant="outline"
                              className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                            >
                              Vedette
                            </Badge>
                          )}
                          <ProductStatusBadge status={product.product_status} />
                          <StockBadge stock={product.product_stock_real} />
                        </div>
                        {/* Badge produit sur mesure avec enseigne/organisation */}
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {product.enseigne_name ||
                              product.assigned_client_name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Complétude */}
                    {(() => {
                      const completeness = calculateSimpleCompleteness(product);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={cn(
                                completeness === 100
                                  ? 'text-green-600'
                                  : 'text-amber-600'
                              )}
                            >
                              {completeness}% complet
                            </span>
                            {completeness < 100 && (
                              <span className="text-gray-400">Non validé</span>
                            )}
                          </div>
                          <Progress
                            value={completeness}
                            className={cn(
                              'h-1.5',
                              completeness === 100
                                ? '[&>div]:bg-green-500'
                                : '[&>div]:bg-amber-500'
                            )}
                          />
                        </div>
                      );
                    })()}

                    {/* Footer: Stats + Action */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        <span>{product.views_count} vues</span>
                        <span className="mx-1">•</span>
                        <span>{product.selections_count} sél.</span>
                      </div>
                      <Link
                        href={`/canaux-vente/linkme/catalogue/${product.id}`}
                      >
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir détails"
                        />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* VUE LISTE - Produits Sur Mesure (identique à Catalogue Général) */
            <Card>
              <div className="divide-y">
                {filteredSourcingProducts.map(product => {
                  // Calcul du prix client LinkMe
                  const clientPrice =
                    product.product_selling_price_ht &&
                    product.linkme_commission_rate !== null
                      ? product.product_selling_price_ht *
                        (1 + product.linkme_commission_rate / 100)
                      : null;

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-center gap-4 p-4 transition-colors',
                        !product.is_enabled
                          ? 'bg-gray-50 opacity-75'
                          : 'hover:bg-amber-50/30'
                      )}
                    >
                      {/* Thumbnail */}
                      <ProductThumbnail
                        src={product.product_image_url}
                        alt={product.product_name}
                        size="sm"
                        className="flex-shrink-0"
                      />

                      {/* Info produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-xs text-black truncate">
                            {product.product_name}
                          </h3>
                          {product.is_featured && (
                            <Badge
                              variant="outline"
                              className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                            >
                              Vedette
                            </Badge>
                          )}
                          <ProductStatusBadge status={product.product_status} />
                          <StockBadge stock={product.product_stock_real} />
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 font-mono">
                            {product.product_reference}
                          </p>
                          {/* Badge produit sur mesure avec enseigne/organisation */}
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {product.enseigne_name ||
                              product.assigned_client_name}
                          </Badge>
                        </div>
                      </div>

                      {/* Prix d'achat HT */}
                      <div className="hidden md:block text-right min-w-[70px]">
                        <p className="text-[10px] text-gray-400">Achat HT</p>
                        <p className="text-xs text-gray-600">
                          {formatPrice(product.product_price_ht)}
                        </p>
                      </div>

                      {/* Prix de vente HT (LinkMe) */}
                      <div className="hidden md:block text-right min-w-[70px]">
                        <p className="text-[10px] text-gray-400">Vente HT</p>
                        {product.product_selling_price_ht ? (
                          <p className="text-xs font-medium text-blue-600">
                            {formatPrice(product.product_selling_price_ht)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Commission LinkMe */}
                      <div className="hidden lg:block text-right min-w-[50px]">
                        <p className="text-[10px] text-gray-400">Comm.</p>
                        {product.linkme_commission_rate !== null ? (
                          <p className="text-xs text-purple-600">
                            {product.linkme_commission_rate}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Prix client LinkMe (calculé) */}
                      <div className="hidden lg:block text-right min-w-[80px]">
                        <p className="text-[10px] text-gray-400">Prix Client</p>
                        {clientPrice ? (
                          <p className="text-xs font-medium text-green-600">
                            {formatPrice(clientPrice)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Marge de sécurité (buffer_rate) */}
                      <div className="hidden xl:block text-right min-w-[55px]">
                        <p className="text-[10px] text-gray-400">Marge sécu</p>
                        {product.buffer_rate !== null ? (
                          <p className="text-xs text-amber-600">
                            {(product.buffer_rate * 100).toFixed(0)}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Marge suggérée */}
                      <div className="hidden xl:block text-right min-w-[55px]">
                        <p className="text-[10px] text-gray-400">Marge sugg.</p>
                        {product.suggested_margin_rate !== null ? (
                          <p className="text-xs font-medium text-emerald-600">
                            {product.suggested_margin_rate}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>

                      {/* Lien détail */}
                      <Link
                        href={`/canaux-vente/linkme/catalogue/${product.id}`}
                      >
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir détails"
                        />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          )
        ) : /* ========== ONGLET PRODUITS DES AFFILIÉS ========== */
        filteredAffiliateProducts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-violet-300 rounded-lg bg-violet-50/50">
            <UserPlus className="h-16 w-16 text-violet-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Aucun produit créé par des affiliés
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Les produits créés par les affiliés apparaîtront ici une fois
              ajoutés au catalogue
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* VUE GRILLE - Produits Affiliés */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAffiliateProducts.map(product => (
              <Card
                key={product.id}
                className={cn(
                  'border-2 transition-all duration-150',
                  !product.is_enabled
                    ? 'border-gray-200 bg-gray-50 opacity-75'
                    : 'border-violet-200 hover:border-violet-300'
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: Thumbnail + Info */}
                  <div className="flex items-start gap-3">
                    <ProductThumbnail
                      src={product.product_image_url}
                      alt={product.product_name}
                      size="md"
                      className="flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs text-black truncate">
                        {product.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {product.product_reference}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {product.is_featured && (
                          <Badge
                            variant="outline"
                            className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                          >
                            Vedette
                          </Badge>
                        )}
                        <ProductStatusBadge status={product.product_status} />
                        <StockBadge stock={product.product_stock_real} />
                      </div>
                      {/* Badge produit affilié */}
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs border-violet-500 text-violet-700 bg-violet-50"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Créé par affilié
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Complétude */}
                  {(() => {
                    const completeness = calculateSimpleCompleteness(product);
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={cn(
                              completeness === 100
                                ? 'text-green-600'
                                : 'text-amber-600'
                            )}
                          >
                            {completeness}% complet
                          </span>
                          {completeness < 100 && (
                            <span className="text-gray-400">Non validé</span>
                          )}
                        </div>
                        <Progress
                          value={completeness}
                          className={cn(
                            'h-1.5',
                            completeness === 100
                              ? '[&>div]:bg-green-500'
                              : '[&>div]:bg-amber-500'
                          )}
                        />
                      </div>
                    );
                  })()}

                  {/* Footer: Stats + Action */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      <span>{product.views_count} vues</span>
                      <span className="mx-1">•</span>
                      <span>{product.selections_count} sél.</span>
                    </div>
                    <Link href={`/canaux-vente/linkme/catalogue/${product.id}`}>
                      <IconButton
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        label="Voir détails"
                      />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* VUE LISTE - Produits Affiliés */
          <Card>
            <div className="divide-y">
              {filteredAffiliateProducts.map(product => {
                const clientPrice =
                  product.product_selling_price_ht &&
                  product.linkme_commission_rate !== null
                    ? product.product_selling_price_ht *
                      (1 + product.linkme_commission_rate / 100)
                    : null;

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'flex items-center gap-4 p-4 transition-colors',
                      !product.is_enabled
                        ? 'bg-gray-50 opacity-75'
                        : 'hover:bg-violet-50/30'
                    )}
                  >
                    {/* Thumbnail */}
                    <ProductThumbnail
                      src={product.product_image_url}
                      alt={product.product_name}
                      size="sm"
                      className="flex-shrink-0"
                    />

                    {/* Info produit */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-xs text-black truncate">
                          {product.product_name}
                        </h3>
                        {product.is_featured && (
                          <Badge
                            variant="outline"
                            className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                          >
                            Vedette
                          </Badge>
                        )}
                        <ProductStatusBadge status={product.product_status} />
                        <StockBadge stock={product.product_stock_real} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-mono">
                          {product.product_reference}
                        </p>
                        {/* Badge produit affilié */}
                        <Badge
                          variant="outline"
                          className="text-xs border-violet-500 text-violet-700 bg-violet-50"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Créé par affilié
                        </Badge>
                      </div>
                    </div>

                    {/* Prix d'achat HT */}
                    <div className="hidden md:block text-right min-w-[70px]">
                      <p className="text-[10px] text-gray-400">Achat HT</p>
                      <p className="text-xs text-gray-600">
                        {formatPrice(product.product_price_ht)}
                      </p>
                    </div>

                    {/* Prix de vente HT (LinkMe) */}
                    <div className="hidden md:block text-right min-w-[70px]">
                      <p className="text-[10px] text-gray-400">Vente HT</p>
                      {product.product_selling_price_ht ? (
                        <p className="text-xs font-medium text-blue-600">
                          {formatPrice(product.product_selling_price_ht)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </div>

                    {/* Commission Vérone (produit affilié) */}
                    <div className="hidden lg:block text-right min-w-[70px]">
                      <p className="text-[10px] text-gray-400">Comm. Vérone</p>
                      {product.affiliate_commission_rate !== null ? (
                        <p className="text-xs text-purple-600">
                          {product.affiliate_commission_rate}%
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </div>

                    {/* Payout affilié HT (encaissement) */}
                    <div className="hidden lg:block text-right min-w-[80px]">
                      <p className="text-[10px] text-gray-400">Payout HT</p>
                      {product.affiliate_payout_ht !== null ? (
                        <p className="text-xs font-semibold text-green-600">
                          {formatPrice(product.affiliate_payout_ht)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </div>

                    {/* Lien détail */}
                    <Link href={`/canaux-vente/linkme/catalogue/${product.id}`}>
                      <IconButton
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        label="Voir détails"
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Modal Ajout Produits - UniversalProductSelectorV2 */}
      <UniversalProductSelectorV2
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelect={handleAddProducts}
        mode="multi"
        title="Ajouter des produits au catalogue LinkMe"
        description="Sélectionnez les produits à rendre disponibles pour les affiliés"
        excludeProductIds={catalogProductIds}
        showImages
      />
    </div>
  );
}
