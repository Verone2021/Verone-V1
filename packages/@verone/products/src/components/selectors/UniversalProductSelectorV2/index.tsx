/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

/**
 * UniversalProductSelector V2 - Composant professionnel 2025
 *
 * Design moderne avec layout 2 colonnes (dual-pane selector pattern)
 * - Colonne gauche: Produits disponibles avec filtres hiérarchiques
 * - Colonne droite: Produits sélectionnés avec actions
 *
 * @module UniversalProductSelectorV2
 */

import { useState, useEffect, useCallback } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Check, Search, X } from 'lucide-react';

import type {
  ProductData,
  SelectedProduct,
  UniversalProductSelectorV2Props,
} from './types';
import { useHierarchicalFilters } from './useHierarchicalFilters';
import { useProductSearch } from './useProductSearch';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { AvailableProductCard } from './AvailableProductCard';
import { EmptyState } from './EmptyState';
import { FilterPanel } from './FilterPanel';
import { SelectedPanel } from './SelectedPanel';
import { ProductGridView } from './ProductGridView';

// Re-export types for consumers
export type { ProductData, SelectedProduct, UniversalProductSelectorV2Props };
export type { SelectionMode, SelectionContext } from './types';

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
  supplierId,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      supplierId: supplierId,
      productStatus: context === 'consultations' ? 'active' : null,
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
      console.warn('🔥 handleAddProduct appelé:', product.name, product.id);
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
  // RENDER - Main Layout
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn('max-w-6xl h-[85vh] flex flex-col', className)}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {title ?? getDefaultTitle()}
          </DialogTitle>
          <DialogDescription>
            {description ?? getDefaultDescription()}
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
              type="button"
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
            <FilterPanel
              families={hierarchicalFilters.families}
              categories={hierarchicalFilters.categories}
              subcategories={hierarchicalFilters.subcategories}
              selectedFamilyId={hierarchicalFilters.selectedFamilyId}
              selectedCategoryId={hierarchicalFilters.selectedCategoryId}
              selectedSubcategoryId={hierarchicalFilters.selectedSubcategoryId}
              onFamilyChange={hierarchicalFilters.setSelectedFamilyId}
              onCategoryChange={hierarchicalFilters.setSelectedCategoryId}
              onSubcategoryChange={hierarchicalFilters.setSelectedSubcategoryId}
              sourcingFilter={sourcingFilter}
              creationModeFilter={creationModeFilter}
              onSourcingFilterChange={setSourcingFilter}
              onCreationModeFilterChange={setCreationModeFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Liste produits disponibles */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">
                Produits disponibles ({products.length})
              </h3>
              <div className="flex-1 overflow-y-auto pr-4 min-h-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
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
                ) : viewMode === 'grid' ? (
                  /* Vue Grille - images grandes */
                  <ProductGridView
                    products={products}
                    showImages={showImages}
                    onAdd={handleAddProduct}
                  />
                ) : (
                  /* Vue Liste - images moyennes */
                  <div className="space-y-2">
                    {products.map(product => (
                      <AvailableProductCard
                        key={product.id}
                        product={product}
                        showImages={showImages}
                        onAdd={handleAddProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE - Produits sélectionnés */}
          <SelectedPanel
            localSelectedProducts={localSelectedProducts}
            showImages={showImages}
            showQuantity={showQuantity}
            onRemove={handleRemoveProduct}
            onUpdateQuantity={handleUpdateQuantity}
            onClearAll={() => setLocalSelectedProducts([])}
          />
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
