'use client';

/**
 * UniversalProductSelector V2 - Composant professionnel 2025
 *
 * Design moderne avec layout 2 colonnes (dual-pane selector pattern)
 * - Colonne gauche: Produits disponibles avec filtres hiérarchiques
 * - Colonne droite: Produits sélectionnés avec actions
 *
 * Features:
 * - Filtres hiérarchiques Famille → Catégorie → Sous-catégorie (cascade)
 * - Micro-interactions fluides (hover, scale, shadow)
 * - Skeleton loading professionnels
 * - Empty states avec illustrations
 * - Responsive mobile (tabs sur <768px)
 * - Design System V2 colors
 *
 * @module UniversalProductSelectorV2
 */

import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

import {
  Search,
  X,
  Check,
  Package,
  Plus,
  Trash2,
  Filter,
  Layers,
  Tag,
  RotateCcw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@verone/utils';
import { ProductThumbnail } from '@/shared/modules/products/components/images/ProductThumbnail';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type de produit retourné par les queries Supabase
 */
export interface ProductData {
  id: string;
  name: string;
  sku: string | null;
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  creation_mode: 'complete' | 'sourcing';
  sourcing_type?: string;
  supplier_id: string | null;
  subcategory_id?: string | null;
  stock_real?: number;
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
  product_images?: Array<{ public_url: string; is_primary: boolean }>;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name?: string;
    has_different_trade_name?: boolean;
  } | null;
  subcategory?: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
      family?: {
        id: string;
        name: string;
        slug: string;
      } | null;
    } | null;
  } | null;
  variant_attributes?: {
    color?: string;
    color_name?: string;
    material?: string;
    size?: string;
    pattern?: string;
    [key: string]: any; // Autres attributs personnalisés
  } | null;
}

/**
 * Produit sélectionné avec métadonnées
 */
export interface SelectedProduct extends ProductData {
  quantity?: number;
  unit_price?: number;
  discount_percentage?: number;
  notes?: string;
}

/**
 * Mode de sélection
 */
export type SelectionMode = 'single' | 'multi';

/**
 * Contexte d'utilisation
 */
export type SelectionContext =
  | 'collections'
  | 'orders'
  | 'consultations'
  | 'variants'
  | 'samples';

/**
 * Props du composant UniversalProductSelectorV2
 */
export interface UniversalProductSelectorV2Props {
  open: boolean;
  onClose: () => void;
  onSelect: (products: SelectedProduct[]) => void | Promise<void>;
  mode?: SelectionMode;
  context?: SelectionContext;
  title?: string;
  description?: string;
  selectedProducts?: SelectedProduct[];
  excludeProductIds?: string[];
  showQuantity?: boolean;
  showPricing?: boolean;
  showImages?: boolean;
  searchDebounce?: number;
  className?: string;
}

// Types pour filtres hiérarchiques
interface Family {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  family_id: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
}

// ============================================================================
// HOOK - useHierarchicalFilters
// ============================================================================

/**
 * Hook pour gérer les filtres hiérarchiques en cascade
 * Famille → Catégorie → Sous-catégorie
 */
function useHierarchicalFilters() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Charger toutes les familles au mount
  useEffect(() => {
    loadFamilies();
  }, []);

  // Charger catégories quand famille change
  useEffect(() => {
    if (selectedFamilyId) {
      loadCategories(selectedFamilyId);
    } else {
      setCategories([]);
      setSelectedCategoryId(null);
    }
  }, [selectedFamilyId]);

  // Charger sous-catégories quand catégorie change
  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId(null);
    }
  }, [selectedCategoryId]);

  const loadFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const loadCategories = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, family_id')
        .eq('family_id', familyId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const resetFilters = () => {
    setSelectedFamilyId(null);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
  };

  return {
    families,
    categories,
    subcategories,
    selectedFamilyId,
    selectedCategoryId,
    selectedSubcategoryId,
    setSelectedFamilyId,
    setSelectedCategoryId,
    setSelectedSubcategoryId,
    resetFilters,
    loading,
  };
}

// ============================================================================
// HOOK - useProductSearch
// ============================================================================

interface ProductSearchFilters {
  familyId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  creationMode?: 'complete' | 'sourcing' | null;
  sourcingType?: string | null;
}

function useProductSearch(
  searchQuery: string,
  filters: ProductSearchFilters,
  excludeIds: string[] = [],
  debounceMs: number = 250
) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    filters.familyId,
    filters.categoryId,
    filters.subcategoryId,
    filters.creationMode,
    filters.sourcingType,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          product_status,
          creation_mode,
          sourcing_type,
          supplier_id,
          subcategory_id,
          stock_real,
          created_at,
          updated_at,
          product_images!left (
            public_url,
            is_primary
          ),
          supplier:organisations!supplier_id (
            id,
            legal_name,
            trade_name,
            has_different_trade_name
          ),
          subcategory:subcategories!subcategory_id (
            id,
            name,
            slug,
            category:categories (
              id,
              name,
              slug,
              family:families (
                id,
                name,
                slug
              )
            )
          )
        `
        )
        .order('name', { ascending: true });

      // Filtre par création mode
      if (filters.creationMode) {
        query = query.eq('creation_mode', filters.creationMode);
      }

      // Filtre par sourcing_type
      if (filters.sourcingType) {
        query = query.eq('sourcing_type', filters.sourcingType);
      }

      // Filtre par sous-catégorie (plus spécifique)
      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }
      // Sinon filtre par catégorie (via subcategories)
      else if (filters.categoryId) {
        const { data: subcats } = await supabase
          .from('subcategories')
          .select('id')
          .eq('category_id', filters.categoryId);

        if (subcats && subcats.length > 0) {
          const subcatIds = subcats.map(s => s.id);
          query = query.in('subcategory_id', subcatIds);
        }
      }
      // Sinon filtre par famille (via categories → subcategories)
      else if (filters.familyId) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id')
          .eq('family_id', filters.familyId);

        if (cats && cats.length > 0) {
          const catIds = cats.map(c => c.id);
          const { data: subcats } = await supabase
            .from('subcategories')
            .select('id')
            .in('category_id', catIds);

          if (subcats && subcats.length > 0) {
            const subcatIds = subcats.map(s => s.id);
            query = query.in('subcategory_id', subcatIds);
          }
        }
      }

      // Recherche texte (ILIKE)
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
        );
      }

      const { data, error: rpcError } = await query.limit(100);

      if (rpcError) throw rpcError;

      const transformedData: ProductData[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        product_status: item.product_status,
        creation_mode: item.creation_mode,
        sourcing_type: item.sourcing_type,
        supplier_id: item.supplier_id,
        subcategory_id: item.subcategory_id,
        stock_real: item.stock_real,
        created_at: item.created_at,
        updated_at: item.updated_at,
        archived_at: item.archived_at,
        product_images: item.product_images || [],
        supplier: item.supplier || null,
        subcategory: item.subcategory || null,
      }));

      const filteredData = transformedData.filter(
        p => !excludeIds.includes(p.id)
      );

      setProducts(filteredData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des produits';
      setError(message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

// ============================================================================
// COMPOSANT - ProductCardSkeleton
// ============================================================================

function ProductCardSkeleton() {
  return (
    <div className="flex gap-2 p-3 border border-gray-100 rounded-lg animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-9 h-9 bg-gray-200 rounded-full" />
    </div>
  );
}

// ============================================================================
// COMPOSANT - EmptyState
// ============================================================================

interface EmptyStateProps {
  type: 'no-results' | 'no-selection';
  searchQuery?: string;
  onReset?: () => void;
}

function EmptyState({ type, searchQuery, onReset }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Aucun produit trouvé
        </h3>
        <p className="text-sm text-[#6c7293] mb-4 max-w-sm">
          {searchQuery
            ? `Aucun résultat pour "${searchQuery}". Essayez de modifier votre recherche.`
            : 'Essayez de modifier vos filtres ou votre recherche'}
        </p>
        {onReset && (
          <ButtonV2 variant="outline" onClick={onReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </ButtonV2>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-[#844fc1]/10 rounded-full flex items-center justify-center mb-4">
        <Plus className="h-10 w-10 text-[#844fc1]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Aucun produit sélectionné
      </h3>
      <p className="text-sm text-[#6c7293] max-w-sm">
        Ajoutez des produits depuis la colonne de gauche
      </p>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL - UniversalProductSelectorV2
// ============================================================================

export function UniversalProductSelectorV2({
  open,
  onClose,
  onSelect,
  mode = 'multi',
  context = 'collections',
  title,
  description,
  selectedProducts = [],
  excludeProductIds = [],
  showQuantity = false,
  showPricing = false,
  showImages = true,
  searchDebounce = 250,
  className,
}: UniversalProductSelectorV2Props) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedProducts, setLocalSelectedProducts] =
    useState<SelectedProduct[]>(selectedProducts);
  const [sourcingFilter, setSourcingFilter] = useState<
    'interne' | 'externe' | null
  >(null);
  const [creationModeFilter, setCreationModeFilter] = useState<
    'complete' | 'sourcing' | null
  >(null);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const hierarchicalFilters = useHierarchicalFilters();

  const { products, loading, error } = useProductSearch(
    searchQuery,
    {
      familyId: hierarchicalFilters.selectedFamilyId,
      categoryId: hierarchicalFilters.selectedCategoryId,
      subcategoryId: hierarchicalFilters.selectedSubcategoryId,
      creationMode: creationModeFilter,
      sourcingType: sourcingFilter,
    },
    [...excludeProductIds, ...localSelectedProducts.map(p => p.id)],
    searchDebounce
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (open) {
      setLocalSelectedProducts(selectedProducts);
      setSearchQuery('');
      hierarchicalFilters.resetFilters();
      setSourcingFilter(null);
      setCreationModeFilter(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddProduct = useCallback(
    (product: ProductData) => {
      setLocalSelectedProducts(prev => {
        const newProduct: SelectedProduct = {
          ...product,
          quantity: showQuantity ? 1 : undefined,
          unit_price: showPricing ? 0 : undefined,
        };

        if (mode === 'single') {
          return [newProduct];
        } else {
          return [...prev, newProduct];
        }
      });
    },
    [mode, showQuantity, showPricing]
  );

  const handleRemoveProduct = useCallback((productId: string) => {
    setLocalSelectedProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setLocalSelectedProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
        )
      );
    },
    []
  );

  const handleConfirm = async () => {
    await onSelect(localSelectedProducts);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedProducts(selectedProducts);
    onClose();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    hierarchicalFilters.resetFilters();
    setSourcingFilter(null);
    setCreationModeFilter(null);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getPrimaryImage = (product: ProductData): string | null => {
    const images = product.product_images;
    return (
      images?.find(img => img.is_primary)?.public_url ||
      images?.[0]?.public_url ||
      null
    );
  };

  const getDefaultTitle = () => {
    switch (context) {
      case 'collections':
        return 'Ajouter des produits à la collection';
      case 'orders':
        return 'Ajouter des produits à la commande';
      case 'consultations':
        return 'Sélectionner des produits pour la consultation';
      case 'variants':
        return 'Ajouter une variante';
      case 'samples':
        return 'Sélectionner un produit échantillon';
      default:
        return 'Sélectionner des produits';
    }
  };

  const getDefaultDescription = () => {
    switch (context) {
      case 'collections':
        return 'Utilisez les filtres et la recherche pour trouver vos produits';
      case 'orders':
        return 'Recherchez et ajoutez des produits à votre commande';
      case 'consultations':
        return 'Sélectionnez les produits pour cette consultation client';
      default:
        return 'Recherchez et sélectionnez des produits';
    }
  };

  // ============================================================================
  // RENDER - Product Cards
  // ============================================================================

  const AvailableProductCard = ({ product }: { product: ProductData }) => {
    const primaryImage = showImages ? getPrimaryImage(product) : null;
    const supplierName = product.supplier
      ? product.supplier.has_different_trade_name && product.supplier.trade_name
        ? product.supplier.trade_name
        : product.supplier.legal_name
      : null;

    // Construire catégorie complète pour tooltip (hover)
    const categoryPath = product.subcategory?.category?.family
      ? [
          product.subcategory.category.family.name,
          product.subcategory.category?.name,
          product.subcategory?.name,
        ]
          .filter(Boolean)
          .join(' > ')
      : null;

    return (
      <div
        className={cn(
          'group flex gap-2 p-3 border rounded-lg cursor-pointer',
          'transition-all duration-150',
          'border-gray-200 bg-white',
          'hover:border-[#3b86d1] hover:shadow-md hover:scale-[1.01]',
          'active:scale-[0.99]'
        )}
        onClick={() => handleAddProduct(product)}
        title={categoryPath || undefined}
      >
        {/* Image */}
        {showImages && (
          <ProductThumbnail
            src={primaryImage}
            alt={product.name}
            size="sm"
            className="flex-shrink-0"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-sm truncate text-gray-900 leading-tight">
              {product.name}
            </p>
            {product.creation_mode === 'sourcing' && (
              <Badge
                variant="outline"
                className="h-4 text-xs px-1.5 py-0 bg-[#844fc1]/10 border-[#844fc1]/20 text-[#844fc1] flex-shrink-0"
              >
                Sourcing
              </Badge>
            )}
          </div>

          <div className="space-y-0.5">
            {product.sku && (
              <p className="text-xs font-mono text-gray-500 leading-tight">
                {product.sku}
              </p>
            )}
            {supplierName && (
              <p className="text-xs text-[#6c7293] truncate leading-tight">
                {supplierName}
              </p>
            )}
            {/* Catégorie supprimée pour densité, visible au hover via title */}
          </div>
        </div>

        {/* Bouton Add */}
        <button
          onClick={e => {
            e.stopPropagation();
            handleAddProduct(product);
          }}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full',
            'flex items-center justify-center',
            'bg-[#3b86d1] text-white',
            'transition-all duration-150',
            'hover:bg-[#2d6ba8] hover:scale-110',
            'active:scale-95',
            'group-hover:shadow-lg'
          )}
          title="Ajouter ce produit"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const SelectedProductCard = ({
    product,
    index,
  }: {
    product: SelectedProduct;
    index: number;
  }) => {
    const primaryImage = showImages ? getPrimaryImage(product) : null;

    return (
      <div
        className={cn(
          'group flex gap-2 p-3 border rounded-lg',
          'transition-all duration-150',
          'border-[#38ce3c] bg-[#38ce3c]/5'
        )}
      >
        {/* Badge Position */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#844fc1] text-white flex items-center justify-center font-bold text-xs">
          {index + 1}
        </div>

        {/* Image */}
        {showImages && (
          <ProductThumbnail
            src={primaryImage}
            alt={product.name}
            size="sm"
            className="flex-shrink-0"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-gray-900 mb-0.5 leading-tight">
            {product.name}
          </p>
          <div className="space-y-0.5">
            {product.sku && (
              <p className="text-xs font-mono text-gray-500 leading-tight">
                {product.sku}
              </p>
            )}
            {showQuantity && product.quantity && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-[#6c7293]">Quantité:</Label>
                <Input
                  type="number"
                  min="1"
                  value={product.quantity}
                  onChange={e =>
                    handleUpdateQuantity(
                      product.id,
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-16 h-7 text-xs"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bouton Remove */}
        <button
          onClick={() => handleRemoveProduct(product.id)}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full',
            'flex items-center justify-center',
            'bg-red-50 text-red-600',
            'transition-all duration-150',
            'hover:bg-red-600 hover:text-white hover:scale-110',
            'active:scale-95'
          )}
          title="Retirer ce produit"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // ============================================================================
  // RENDER - Main Layout
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn('max-w-6xl h-[85vh] flex flex-col', className)}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {title || getDefaultTitle()}
          </DialogTitle>
          <DialogDescription>
            {description || getDefaultDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar (sticky) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 border-2 focus:border-[#3b86d1]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid md:grid-cols-[55%_45%] gap-6 flex-1 overflow-hidden">
          {/* COLONNE GAUCHE - Produits disponibles */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Filtres hiérarchiques - Optimisé compact */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[#6c7293]" />
                <Label className="text-xs font-semibold text-gray-700">
                  Filtres
                </Label>
              </div>

              {/* Selects en ligne avec flex-wrap pour layout horizontal compact */}
              <div className="flex flex-wrap gap-2">
                {/* Filtre Famille */}
                <Select
                  value={hierarchicalFilters.selectedFamilyId || 'all'}
                  onValueChange={value =>
                    hierarchicalFilters.setSelectedFamilyId(
                      value === 'all' ? null : value
                    )
                  }
                >
                  <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors">
                    <Package className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
                    <SelectValue placeholder="Famille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">
                      Toutes
                    </SelectItem>
                    {hierarchicalFilters.families.map(family => (
                      <SelectItem
                        key={family.id}
                        value={family.id}
                        className="text-sm"
                      >
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtre Catégorie */}
                <Select
                  value={hierarchicalFilters.selectedCategoryId || 'all'}
                  onValueChange={value =>
                    hierarchicalFilters.setSelectedCategoryId(
                      value === 'all' ? null : value
                    )
                  }
                  disabled={!hierarchicalFilters.selectedFamilyId}
                >
                  <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors disabled:opacity-50">
                    <Layers className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">
                      Toutes
                    </SelectItem>
                    {hierarchicalFilters.categories.map(category => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="text-sm"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtre Sous-catégorie */}
                <Select
                  value={hierarchicalFilters.selectedSubcategoryId || 'all'}
                  onValueChange={value =>
                    hierarchicalFilters.setSelectedSubcategoryId(
                      value === 'all' ? null : value
                    )
                  }
                  disabled={!hierarchicalFilters.selectedCategoryId}
                >
                  <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors disabled:opacity-50">
                    <Tag className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
                    <SelectValue placeholder="Sous-cat." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">
                      Toutes
                    </SelectItem>
                    {hierarchicalFilters.subcategories.map(subcategory => (
                      <SelectItem
                        key={subcategory.id}
                        value={subcategory.id}
                        className="text-sm"
                      >
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtres secondaires (Badges compacts) */}
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={sourcingFilter === 'interne' ? 'default' : 'outline'}
                  className={cn(
                    'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
                    sourcingFilter === 'interne' &&
                      'bg-[#3b86d1] hover:bg-[#2d6ba8]'
                  )}
                  onClick={() =>
                    setSourcingFilter(
                      sourcingFilter === 'interne' ? null : 'interne'
                    )
                  }
                >
                  Interne
                </Badge>
                <Badge
                  variant={sourcingFilter === 'externe' ? 'default' : 'outline'}
                  className={cn(
                    'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
                    sourcingFilter === 'externe' &&
                      'bg-[#3b86d1] hover:bg-[#2d6ba8]'
                  )}
                  onClick={() =>
                    setSourcingFilter(
                      sourcingFilter === 'externe' ? null : 'externe'
                    )
                  }
                >
                  Externe
                </Badge>
                <Badge
                  variant={
                    creationModeFilter === 'sourcing' ? 'default' : 'outline'
                  }
                  className={cn(
                    'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
                    creationModeFilter === 'sourcing' &&
                      'bg-[#844fc1] hover:bg-[#6d3da0]'
                  )}
                  onClick={() =>
                    setCreationModeFilter(
                      creationModeFilter === 'sourcing' ? null : 'sourcing'
                    )
                  }
                >
                  Sourcing
                </Badge>
              </div>
            </div>

            {/* Liste produits disponibles */}
            <div className="flex-1 overflow-hidden">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">
                Produits disponibles
              </h3>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-2 pr-4">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <ProductCardSkeleton key={i} />
                      ))}
                    </>
                  ) : error ? (
                    <div className="text-center py-8 text-red-600">
                      <p className="text-sm">{error}</p>
                    </div>
                  ) : products.length === 0 ? (
                    <EmptyState
                      type="no-results"
                      searchQuery={searchQuery}
                      onReset={handleResetFilters}
                    />
                  ) : (
                    products.map(product => (
                      <AvailableProductCard
                        key={product.id}
                        product={product}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* COLONNE DROITE - Produits sélectionnés */}
          <div className="flex flex-col gap-4 overflow-hidden border-l-2 border-gray-100 pl-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">
                Sélectionnés ({localSelectedProducts.length})
              </h3>
              {localSelectedProducts.length > 0 && (
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSelectedProducts([])}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Tout retirer
                </ButtonV2>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {localSelectedProducts.length === 0 ? (
                  <EmptyState type="no-selection" />
                ) : (
                  localSelectedProducts.map((product, index) => (
                    <SelectedProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t-2 pt-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-[#6c7293]">
              <span className="font-semibold text-gray-900">
                {localSelectedProducts.length}
              </span>{' '}
              produit
              {localSelectedProducts.length > 1 ? 's' : ''} sélectionné
              {localSelectedProducts.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <ButtonV2 variant="outline" onClick={handleCancel}>
                Annuler
              </ButtonV2>
              <ButtonV2
                onClick={handleConfirm}
                disabled={localSelectedProducts.length === 0}
                className="bg-[#38ce3c] hover:bg-[#2db532] text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmer la sélection
              </ButtonV2>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
