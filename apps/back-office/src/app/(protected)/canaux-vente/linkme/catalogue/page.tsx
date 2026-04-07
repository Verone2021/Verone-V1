'use client';

import { Card } from '@verone/ui';
import { Loader2, Package, Users, UserPlus } from 'lucide-react';

import { CatalogueFilters } from './CatalogueFilters';
import { CatalogueHeader } from './CatalogueHeader';
import { CatalogueStats } from './CatalogueStats';
import { CatalogueTabs } from './CatalogueTabs';
import { AddProductsModal } from './modals/AddProductsModal';
import { PricingConfigModal } from './modals/PricingConfigModal';
import { ProductCard } from './ProductCard';
import { ProductRow } from './ProductRow';
import { useLinkMeCataloguePage } from './use-linkme-catalogue-page';

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
  const {
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
    catalogLoading,
    catalogProductIds,
    filteredCatalogProducts,
    filteredSourcingProducts,
    filteredAffiliateProducts,
    stats,
    pendingCount,
    addProductsMutation,
    allPricesValid,
    handleProductsSelected,
    handleConfirmAddProducts,
  } = useLinkMeCataloguePage();

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

  const filteredProducts =
    activeTab === 'general'
      ? filteredCatalogProducts
      : activeTab === 'sourced'
        ? filteredSourcingProducts
        : filteredAffiliateProducts;

  const emptyState =
    filteredProducts.length === 0 ? (
      activeTab === 'general' ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Aucun produit dans le catalogue
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur &quot;Ajouter des produits&quot; pour commencer
          </p>
        </div>
      ) : activeTab === 'sourced' ? (
        <div className="text-center py-24 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50/50">
          <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucun produit sur mesure</p>
          <p className="text-sm text-gray-500 mt-1">
            Les produits sourcés pour une enseigne ou organisation apparaîtront
            ici
          </p>
        </div>
      ) : (
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
      )
    ) : null;

  return (
    <div className="flex flex-col h-full">
      <CatalogueHeader onAddProducts={() => setIsAddModalOpen(true)} />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        <CatalogueStats stats={stats} />

        <CatalogueTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          pendingCount={pendingCount}
        />

        <CatalogueFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          subcategoryFilter={subcategoryFilter}
          onSubcategoryChange={setSubcategoryFilter}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeTab={activeTab}
          filteredCounts={{
            general: filteredCatalogProducts.length,
            sourced: filteredSourcingProducts.length,
            affiliate: filteredAffiliateProducts.length,
          }}
          onResetFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setSubcategoryFilter(undefined);
          }}
        />

        {/* Rendu conditionnel: état vide ou grille/liste */}
        {emptyState ??
          (viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={activeTab}
                />
              ))}
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {filteredProducts.map(product => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    variant={activeTab}
                  />
                ))}
              </div>
            </Card>
          ))}
      </div>

      <AddProductsModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelect={handleProductsSelected}
        excludeProductIds={catalogProductIds}
      />

      <PricingConfigModal
        open={isPricingModalOpen}
        onClose={() => {
          setIsPricingModalOpen(false);
          setPendingProducts([]);
          setPricingConfig({});
        }}
        pendingProducts={pendingProducts}
        pricingConfig={pricingConfig}
        onPricingConfigChange={setPricingConfig}
        allPricesValid={allPricesValid}
        addProductsMutation={addProductsMutation}
        onConfirm={handleConfirmAddProducts}
        onCancel={() => {
          setIsPricingModalOpen(false);
          setPendingProducts([]);
          setPricingConfig({});
        }}
      />
    </div>
  );
}
