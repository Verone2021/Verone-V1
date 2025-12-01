'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Eye,
  EyeOff,
  Star,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Switch } from '@verone/ui';
import { cn } from '@verone/utils';
import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { UniversalProductSelectorV2, type SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useAddProductsToCatalog,
  useToggleProductEnabled,
  useToggleProductShowcase,
  useToggleProductFeatured,
  type LinkMeCatalogProduct,
} from '../hooks/use-linkme-catalog';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled' | 'showcase'>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');

  // State: Modal ajout produits
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Hooks
  const { data: catalogProducts, isLoading: catalogLoading } = useLinkMeCatalogProducts();
  const addProductsMutation = useAddProductsToCatalog();
  const toggleEnabledMutation = useToggleProductEnabled();
  const toggleShowcaseMutation = useToggleProductShowcase();
  const toggleFeaturedMutation = useToggleProductFeatured();

  // Produits déjà dans le catalogue (IDs) - pour exclure du sélecteur
  const catalogProductIds = useMemo(() => {
    return (catalogProducts?.map(p => p.product_id) || []);
  }, [catalogProducts]);

  // Extraction familles uniques
  const families = useMemo(() => {
    const unique = new Set(
      (catalogProducts || []).map(p => p.product_family_name).filter(Boolean) as string[]
    );
    return Array.from(unique).sort();
  }, [catalogProducts]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    return (catalogProducts || []).filter(product => {
      // Recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = product.product_name.toLowerCase().includes(search);
        const matchRef = product.product_reference.toLowerCase().includes(search);
        if (!matchName && !matchRef) return false;
      }

      // Statut
      if (statusFilter === 'enabled' && !product.is_enabled) return false;
      if (statusFilter === 'disabled' && product.is_enabled) return false;
      if (statusFilter === 'showcase' && !product.is_public_showcase) return false;

      // Famille
      if (familyFilter !== 'all' && product.product_family_name !== familyFilter) {
        return false;
      }

      return true;
    });
  }, [catalogProducts, searchTerm, statusFilter, familyFilter]);

  // Stats
  const stats = useMemo(() => {
    const products = catalogProducts || [];
    return {
      total: products.length,
      enabled: products.filter(p => p.is_enabled).length,
      showcase: products.filter(p => p.is_public_showcase).length,
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

  const handleToggleShowcase = async (product: LinkMeCatalogProduct) => {
    try {
      await toggleShowcaseMutation.mutateAsync({
        catalogProductId: product.id,
        isPublicShowcase: !product.is_public_showcase,
      });
      toast.success(
        product.is_public_showcase
          ? 'Produit retiré de la vitrine'
          : 'Produit ajouté à la vitrine'
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
      toast.error('Erreur lors de l\'ajout des produits');
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
        <div className="grid grid-cols-4 gap-4">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.showcase}</p>
                  <p className="text-sm text-gray-500">En vitrine</p>
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
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="enabled">Actifs uniquement</SelectItem>
                  <SelectItem value="disabled">Désactivés</SelectItem>
                  <SelectItem value="showcase">En vitrine</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Famille */}
              <Select value={familyFilter} onValueChange={setFamilyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Famille" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes familles</SelectItem>
                  {families.map(family => (
                    <SelectItem key={family} value={family}>
                      {family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} affiché{filteredProducts.length > 1 ? 's' : ''}
              </p>
              {(searchTerm || statusFilter !== 'all' || familyFilter !== 'all') && (
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setFamilyFilter('all');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser filtres
                </ButtonV2>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grille produits */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucun produit dans le catalogue</p>
            <p className="text-sm text-gray-500 mt-1">
              Cliquez sur "Ajouter des produits" pour commencer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={cn(
                  'border-2 transition-all duration-150',
                  !product.is_enabled
                    ? 'border-gray-200 bg-gray-50 opacity-75'
                    : product.is_public_showcase
                    ? 'border-purple-300 bg-purple-50/30'
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
                      <h3 className="font-semibold text-sm text-black line-clamp-2">
                        {product.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {product.product_reference}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {product.is_featured && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50">
                            Vedette
                          </Badge>
                        )}
                        {product.is_public_showcase && (
                          <Badge variant="outline" className="text-xs border-purple-500 text-purple-700 bg-purple-50">
                            Vitrine
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prix et Marge */}
                  <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div>
                      <p className="text-xs text-gray-500">Prix HT</p>
                      <p className="text-sm font-semibold">
                        {product.product_price_ht?.toFixed(2) ?? '0.00'} €
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Marge affilié</p>
                      <p className="text-sm font-semibold text-purple-600">
                        {product.min_margin_rate}% - {product.max_margin_rate}%
                      </p>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-2 border-t">
                    {/* Toggle Actif */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.is_enabled ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">Actif (affiliés)</span>
                      </div>
                      <Switch
                        checked={product.is_enabled}
                        onCheckedChange={() => handleToggleEnabled(product)}
                        disabled={toggleEnabledMutation.isPending}
                      />
                    </div>

                    {/* Toggle Vitrine */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.is_public_showcase ? (
                          <Eye className="h-4 w-4 text-purple-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">Vitrine publique</span>
                      </div>
                      <Switch
                        checked={product.is_public_showcase}
                        onCheckedChange={() => handleToggleShowcase(product)}
                        disabled={toggleShowcaseMutation.isPending || !product.is_enabled}
                      />
                    </div>

                    {/* Toggle Vedette */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className={cn(
                          'h-4 w-4',
                          product.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'
                        )} />
                        <span className="text-sm">Produit vedette</span>
                      </div>
                      <Switch
                        checked={product.is_featured}
                        onCheckedChange={() => handleToggleFeatured(product)}
                        disabled={toggleFeaturedMutation.isPending || !product.is_enabled}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>{product.views_count} vues</span>
                    <span>{product.selections_count} sélections</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
