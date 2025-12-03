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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
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
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useAddProductsToCatalog,
  useToggleProductEnabled,
  useToggleProductFeatured,
  type LinkMeCatalogProduct,
} from '../hooks/use-linkme-catalog';
import { calculateSimpleCompleteness } from '../types';

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

  // Hooks
  const { data: catalogProducts, isLoading: catalogLoading } =
    useLinkMeCatalogProducts();
  const addProductsMutation = useAddProductsToCatalog();
  const toggleEnabledMutation = useToggleProductEnabled();
  const toggleFeaturedMutation = useToggleProductFeatured();

  // Produits déjà dans le catalogue (IDs) - pour exclure du sélecteur
  const catalogProductIds = useMemo(() => {
    return catalogProducts?.map(p => p.product_id) || [];
  }, [catalogProducts]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    return (catalogProducts || []).filter(product => {
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
  }, [catalogProducts, searchTerm, statusFilter, subcategoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const products = catalogProducts || [];
    return {
      total: products.length,
      enabled: products.filter(p => p.is_enabled).length,
      featured: products.filter(p => p.is_featured).length,
    };
  }, [catalogProducts]);

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

        {/* Filtres */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Filtre Statut */}
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="enabled">Actifs uniquement</SelectItem>
                  <SelectItem value="disabled">Désactivés</SelectItem>
                </SelectContent>
              </Select>

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
                {filteredProducts.length} produit
                {filteredProducts.length > 1 ? 's' : ''} affiché
                {filteredProducts.length > 1 ? 's' : ''}
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

        {/* Produits */}
        {filteredProducts.length === 0 ? (
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
          /* VUE GRILLE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
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
                      <div className="flex items-center gap-2 mt-1">
                        {product.is_featured && (
                          <Badge
                            variant="outline"
                            className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                          >
                            Vedette
                          </Badge>
                        )}
                        {product.is_enabled ? (
                          <Badge variant="success" className="text-xs">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactif
                          </Badge>
                        )}
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
          /* VUE LISTE */
          <Card>
            <div className="divide-y">
              {filteredProducts.map(product => (
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
                    <div className="flex items-center gap-2">
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
                      {product.is_enabled ? (
                        <Badge variant="success" className="text-xs">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactif
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {product.product_reference}
                    </p>
                  </div>

                  {/* Complétude compacte */}
                  <div className="hidden md:flex items-center gap-2 min-w-[100px]">
                    {(() => {
                      const completeness = calculateSimpleCompleteness(product);
                      return (
                        <>
                          <Progress
                            value={completeness}
                            className={cn(
                              'h-1.5 w-16',
                              completeness === 100
                                ? '[&>div]:bg-green-500'
                                : '[&>div]:bg-amber-500'
                            )}
                          />
                          <span
                            className={cn(
                              'text-xs',
                              completeness === 100
                                ? 'text-green-600'
                                : 'text-amber-600'
                            )}
                          >
                            {completeness}%
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Stats compactes */}
                  <div className="text-xs text-gray-500 hidden lg:block">
                    <span>{product.views_count} vues</span>
                    <span className="mx-1">•</span>
                    <span>{product.selections_count} sél.</span>
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
              ))}
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
