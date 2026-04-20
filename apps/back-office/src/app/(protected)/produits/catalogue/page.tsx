'use client';

import type { Product } from '@verone/categories';
import { CategoryHierarchyModal } from '@verone/categories/components/modals/CategorizeModal';
import { ProductPhotosModal } from '@verone/products/components/modals';
import {
  CommandPaletteSearch as CommandPalette,
  type SearchItem,
} from '@verone/ui-business/components/utils/CommandPaletteSearch';
import { toast } from 'sonner';

import { useCataloguePage } from './use-catalogue-page';
import { CatalogueHeader } from './CatalogueHeader';
import { CatalogueTabs } from './CatalogueTabs';
import { CatalogueToolbar } from './CatalogueToolbar';
import { CatalogueResultsInfo } from './CatalogueResultsInfo';
import { CatalogueGridView } from './CatalogueGridView';
import { CatalogueListView } from './CatalogueListView';
import { CatalogueEmptyState } from './CatalogueEmptyState';
import { CataloguePagination } from './CataloguePagination';
import { QuickEditSupplierDialog } from './modals/QuickEditSupplierDialog';
import { QuickEditPriceDialog } from './modals/QuickEditPriceDialog';
import { QuickEditWeightDialog } from './modals/QuickEditWeightDialog';
import { QuickEditDimensionsDialog } from './modals/QuickEditDimensionsDialog';

export default function CataloguePage() {
  const ctx = useCataloguePage();

  // Early returns for initial load and error
  if (ctx.loading && ctx.products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement du catalogue...</div>
      </div>
    );
  }

  if (ctx.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Erreur: {ctx.error}</div>
      </div>
    );
  }

  const currentProducts =
    ctx.activeTab === 'active'
      ? ctx.products
      : ctx.activeTab === 'incomplete'
        ? ctx.incompleteProducts
        : ctx.archivedProducts;

  const isTabLoading =
    (ctx.activeTab === 'active' && ctx.loading) ||
    (ctx.activeTab === 'incomplete' && ctx.incompleteLoading) ||
    (ctx.activeTab === 'archived' && ctx.archivedLoading);

  return (
    <div className="space-y-6">
      <CatalogueHeader dashboardSLO={ctx.dashboardSLO} />

      <div className="space-y-6">
        <CatalogueTabs
          activeTab={ctx.activeTab}
          total={ctx.total}
          incompleteTotal={ctx.incompleteTotal}
          archivedCount={ctx.archivedProducts.length}
          filters={ctx.filters}
          onTabChange={ctx.setActiveTab}
          onSetIncompletePage={ctx.setIncompletePage}
          syncFiltersToUrl={ctx.syncFiltersToUrl}
        />

        <CatalogueToolbar
          families={ctx.families}
          allCategories={ctx.allCategories.filter(
            (c): c is typeof c & { family_id: string } => c.family_id !== null
          )}
          subcategories={ctx.subcategories}
          products={ctx.products}
          allSuppliers={ctx.allSuppliers}
          filters={ctx.filters}
          searchInput={ctx.searchInput}
          hasActiveFilters={ctx.hasActiveFilters}
          viewMode={ctx.viewMode}
          onViewModeChange={ctx.setViewMode}
          onSearchChange={ctx.handleSearchChange}
          onClearSearch={ctx.handleClearSearch}
          onResetAllFilters={ctx.handleResetAllFilters}
          onResync={ctx.handleResync}
          onFiltersChange={ctx.handleFiltersChange}
        />

        <div className="space-y-4">
          {isTabLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-black opacity-70">Chargement...</div>
            </div>
          ) : (
            <>
              <CatalogueResultsInfo
                activeTab={ctx.activeTab}
                total={ctx.total}
                currentPage={ctx.currentPage}
                totalPages={ctx.totalPages}
                itemsPerPage={ctx.itemsPerPage}
                incompleteTotal={ctx.incompleteTotal}
                incompletePage={ctx.incompletePage}
                incompleteTotalPages={ctx.incompleteTotalPages}
                archivedCount={ctx.archivedProducts.length}
                filters={ctx.filters}
                onApplyFilters={ctx.applyFilters}
              />

              {ctx.viewMode === 'grid' ? (
                <CatalogueGridView
                  products={currentProducts}
                  activeTab={ctx.activeTab}
                  getPrimaryImage={ctx.getPrimaryImage}
                  getIncompletePrimaryImage={ctx.getIncompletePrimaryImage}
                  onQuickEdit={ctx.handleQuickEdit}
                  onArchive={product => {
                    void ctx.handleArchiveProduct(product).catch(error => {
                      console.error(
                        '[Catalogue] handleArchiveProduct failed:',
                        error
                      );
                    });
                  }}
                  onDelete={product => {
                    void ctx.handleDeleteProduct(product).catch(error => {
                      console.error(
                        '[Catalogue] handleDeleteProduct failed:',
                        error
                      );
                    });
                  }}
                />
              ) : (
                <CatalogueListView
                  products={currentProducts}
                  activeTab={ctx.activeTab}
                  getPrimaryImage={ctx.getPrimaryImage}
                  getIncompletePrimaryImage={ctx.getIncompletePrimaryImage}
                  onQuickEdit={ctx.handleQuickEdit}
                />
              )}

              <CatalogueEmptyState
                activeTab={ctx.activeTab}
                isEmpty={currentProducts.length === 0}
              />

              {ctx.activeTab === 'active' && (
                <CataloguePagination
                  currentPage={ctx.currentPage}
                  totalPages={ctx.totalPages}
                  hasNextPage={ctx.hasNextPage}
                  hasPreviousPage={ctx.hasPreviousPage}
                  onNext={ctx.nextPage}
                  onPrevious={ctx.previousPage}
                  onGoTo={ctx.goToPage}
                />
              )}

              {ctx.activeTab === 'incomplete' && (
                <CataloguePagination
                  currentPage={ctx.incompletePage}
                  totalPages={ctx.incompleteTotalPages}
                  hasNextPage={ctx.incompleteHasNextPage}
                  hasPreviousPage={ctx.incompleteHasPreviousPage}
                  onNext={() => ctx.setIncompletePage(p => p + 1)}
                  onPrevious={() => ctx.setIncompletePage(p => p - 1)}
                  onGoTo={ctx.setIncompletePage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick-Edit Dialogs */}
      <QuickEditSupplierDialog
        open={ctx.quickEditTarget?.field === 'supplier'}
        productName={ctx.quickEditTarget?.product.name}
        saving={ctx.quickEditSaving}
        onClose={() => ctx.setQuickEditTarget(null)}
        onSupplierChange={supplierId => {
          void ctx.handleQuickEditSupplier(supplierId).catch(err => {
            console.error('[QuickEdit] Supplier change failed:', err);
          });
        }}
      />

      <QuickEditPriceDialog
        open={ctx.quickEditTarget?.field === 'price'}
        productName={ctx.quickEditTarget?.product.name}
        costPriceCount={ctx.quickEditTarget?.product.cost_price_count}
        costPrice={ctx.quickEditTarget?.product.cost_price}
        saving={ctx.quickEditSaving}
        price={ctx.quickEditPrice}
        onClose={() => ctx.setQuickEditTarget(null)}
        onPriceChange={ctx.setQuickEditPrice}
        onSave={() => {
          void ctx.handleQuickEditPriceSave().catch(err => {
            console.error('[QuickEdit] Price save failed:', err);
          });
        }}
      />

      <QuickEditWeightDialog
        open={ctx.quickEditTarget?.field === 'weight'}
        productName={ctx.quickEditTarget?.product.name}
        saving={ctx.quickEditSaving}
        weight={ctx.quickEditWeight}
        onClose={() => ctx.setQuickEditTarget(null)}
        onWeightChange={ctx.setQuickEditWeight}
        onSave={() => {
          void ctx.handleQuickEditWeightSave().catch(err => {
            console.error('[QuickEdit] Weight save failed:', err);
          });
        }}
      />

      <QuickEditDimensionsDialog
        open={ctx.quickEditTarget?.field === 'dimensions'}
        productName={ctx.quickEditTarget?.product.name}
        saving={ctx.quickEditSaving}
        dimensions={ctx.quickEditDimensions}
        onClose={() => ctx.setQuickEditTarget(null)}
        onDimensionsChange={ctx.setQuickEditDimensions}
        onSave={() => {
          void ctx.handleQuickEditDimensionsSave().catch(err => {
            console.error('[QuickEdit] Dimensions save failed:', err);
          });
        }}
      />

      {/* CategorizeModal (sous-catégorie) */}
      {ctx.quickEditTarget?.field === 'subcategory' && (
        <CategoryHierarchyModal
          isOpen
          onClose={() => ctx.setQuickEditTarget(null)}
          product={
            ctx.quickEditTarget.product as unknown as Parameters<
              typeof CategoryHierarchyModal
            >[0]['product']
          }
          onUpdate={updatedProduct => {
            void ctx
              .handleQuickEditSubcategory(updatedProduct as unknown as Product)
              .catch(err => {
                console.error('[QuickEdit] Subcategory update failed:', err);
              });
          }}
        />
      )}

      {/* ProductPhotosModal */}
      {ctx.quickEditTarget?.field === 'photo' && (
        <ProductPhotosModal
          isOpen
          onClose={() => ctx.setQuickEditTarget(null)}
          productId={ctx.quickEditTarget.product.id}
          productName={ctx.quickEditTarget.product.name}
          productType={
            ctx.quickEditTarget.product.product_status === 'draft'
              ? 'draft'
              : 'product'
          }
          onImagesUpdated={() => {
            if (ctx.activeTab === 'incomplete') {
              void ctx.loadIncompleteProductsRef
                .current({
                  ...ctx.filtersRef.current,
                  page: ctx.incompletePage,
                })
                .then(result => {
                  ctx.setIncompleteProducts(result.products);
                  ctx.setIncompleteTotal(result.total);
                })
                .catch(err => {
                  console.error('[QuickEdit] Refresh incompletes failed:', err);
                });
            }
            toast.success('Photo enregistrée', {
              description: 'La photo du produit a été mise à jour.',
            });
          }}
        />
      )}

      {/* CommandPalette global ⌘K */}
      <CommandPalette
        open={ctx.paletteOpen}
        onOpenChange={ctx.setPaletteOpen}
        onSelect={ctx.handleSearchSelect as (item: SearchItem) => void}
        items={ctx.searchItems}
      />
    </div>
  );
}
