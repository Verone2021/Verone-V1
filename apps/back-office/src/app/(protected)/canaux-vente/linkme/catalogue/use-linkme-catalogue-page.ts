'use client';

import { useState, useMemo, useCallback } from 'react';

import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useAddProductsToCatalog,
  useToggleProductEnabled,
  useToggleProductFeatured,
  type LinkMeCatalogProduct,
  type AddProductWithPricing,
} from '../hooks/use-linkme-catalog';
import { usePendingApprovalsCount } from '../hooks/use-product-approvals';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';

// Helper partagé pour les 3 onglets de filtrage
function filterProducts(
  products: LinkMeCatalogProduct[],
  filters: {
    searchTerm: string;
    statusFilter: 'all' | 'enabled' | 'disabled';
    subcategoryFilter: string | undefined;
  }
): LinkMeCatalogProduct[] {
  return products.filter(product => {
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      const matchName = product.product_name.toLowerCase().includes(search);
      const matchRef = product.product_reference.toLowerCase().includes(search);
      if (!matchName && !matchRef) return false;
    }

    if (filters.statusFilter === 'enabled' && !product.is_enabled) return false;
    if (filters.statusFilter === 'disabled' && product.is_enabled) return false;

    if (
      filters.subcategoryFilter &&
      product.subcategory_id !== filters.subcategoryFilter
    ) {
      return false;
    }

    return true;
  });
}

export function useLinkMeCataloguePage() {
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
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<SelectedProduct[]>([]);
  const [pricingConfig, setPricingConfig] = useState<
    Record<string, { customPriceHt: string; commissionRate: string }>
  >({});

  // State: Onglet actif
  const [activeTab, setActiveTab] = useState<
    'general' | 'sourced' | 'affiliate'
  >('general');

  // Hooks React Query
  const { data: allCatalogProducts, isLoading: catalogLoading } =
    useLinkMeCatalogProducts();
  const addProductsMutation = useAddProductsToCatalog();
  const toggleEnabledMutation = useToggleProductEnabled();
  const toggleFeaturedMutation = useToggleProductFeatured();
  const { data: pendingCount = 0 } = usePendingApprovalsCount();

  // Séparer les produits par type
  const generalCatalogProducts = useMemo(
    () =>
      (allCatalogProducts ?? []).filter(
        p => !p.is_sourced && !p.created_by_affiliate
      ),
    [allCatalogProducts]
  );
  const sourcingProducts = useMemo(
    () =>
      (allCatalogProducts ?? []).filter(
        p => p.is_sourced && !p.created_by_affiliate
      ),
    [allCatalogProducts]
  );
  const affiliateProducts = useMemo(
    () =>
      (allCatalogProducts ?? []).filter(p => p.created_by_affiliate !== null),
    [allCatalogProducts]
  );

  // Produits déjà dans le catalogue (IDs) - pour exclure du sélecteur
  const catalogProductIds = useMemo(
    () => allCatalogProducts?.map(p => p.product_id) ?? [],
    [allCatalogProducts]
  );

  // Filtres partagés
  const filters = useMemo(
    () => ({ searchTerm, statusFilter, subcategoryFilter }),
    [searchTerm, statusFilter, subcategoryFilter]
  );

  // Produits filtrés par onglet (via helper dédupliqué)
  const filteredCatalogProducts = useMemo(
    () => filterProducts(generalCatalogProducts, filters),
    [generalCatalogProducts, filters]
  );
  const filteredSourcingProducts = useMemo(
    () => filterProducts(sourcingProducts, filters),
    [sourcingProducts, filters]
  );
  const filteredAffiliateProducts = useMemo(
    () => filterProducts(affiliateProducts, filters),
    [affiliateProducts, filters]
  );

  // Stats KPI
  const stats = useMemo(() => {
    const allProducts = allCatalogProducts ?? [];
    return {
      total: allProducts.length,
      enabled: allProducts.filter(p => p.is_enabled).length,
      featured: allProducts.filter(p => p.is_featured).length,
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

  // Handlers (préfixés _ = intentionnellement non utilisés dans le JSX principal)
  const _handleToggleEnabled = async (product: LinkMeCatalogProduct) => {
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

  const _handleToggleFeatured = async (product: LinkMeCatalogProduct) => {
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

  // Étape 1: sélection produits → ouvre dialog prix
  const handleProductsSelected = useCallback((products: SelectedProduct[]) => {
    if (products.length === 0) return;

    setPendingProducts(products);
    const initialConfig: Record<
      string,
      { customPriceHt: string; commissionRate: string }
    > = {};
    for (const p of products) {
      initialConfig[p.id] = { customPriceHt: '', commissionRate: '0' };
    }
    setPricingConfig(initialConfig);
    setIsAddModalOpen(false);
    setIsPricingModalOpen(true);
  }, []);

  // Vérifie si tous les prix sont valides
  const allPricesValid = useMemo(() => {
    return pendingProducts.every(p => {
      const config = pricingConfig[p.id];
      if (!config) return false;
      const price = parseFloat(config.customPriceHt);
      return !isNaN(price) && price > 0;
    });
  }, [pendingProducts, pricingConfig]);

  // Étape 2: confirmation prix → insertion
  const handleConfirmAddProducts = useCallback(async () => {
    const productsWithPricing: AddProductWithPricing[] = pendingProducts.map(
      p => ({
        productId: p.id,
        customPriceHt: parseFloat(pricingConfig[p.id]?.customPriceHt ?? '0'),
        commissionRate: parseFloat(pricingConfig[p.id]?.commissionRate ?? '0'),
      })
    );

    try {
      await addProductsMutation.mutateAsync(productsWithPricing);
      toast.success(
        `${pendingProducts.length} produit(s) ajouté(s) au catalogue`
      );
      setIsPricingModalOpen(false);
      setPendingProducts([]);
      setPricingConfig({});
    } catch {
      toast.error("Erreur lors de l'ajout des produits");
    }
  }, [pendingProducts, pricingConfig, addProductsMutation]);

  return {
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    viewMode,
    setViewMode,
    isAddModalOpen,
    setIsAddModalOpen,
    isPricingModalOpen,
    setIsPricingModalOpen,
    pendingProducts,
    setPendingProducts,
    pricingConfig,
    setPricingConfig,
    activeTab,
    setActiveTab,
    // Data
    catalogLoading,
    catalogProductIds,
    filteredCatalogProducts,
    filteredSourcingProducts,
    filteredAffiliateProducts,
    stats,
    pendingCount,
    // Mutations
    addProductsMutation,
    // Computed
    allPricesValid,
    // Handlers
    handleProductsSelected,
    handleConfirmAddProducts,
    _handleToggleEnabled,
    _handleToggleFeatured,
  };
}
