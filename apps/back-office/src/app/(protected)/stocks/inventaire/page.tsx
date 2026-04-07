'use client';

import { ProductHistoryModal } from '@verone/products';
import { InventoryAdjustmentModal, StockReportsModal } from '@verone/stock';
import { formatPrice } from '@verone/utils';
import { Package, TrendingUp, BarChart3, Calendar } from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock';

import { InventaireFilters } from './InventaireFilters';
import { InventaireHeader } from './InventaireHeader';
import { InventaireTable } from './InventaireTable';
import { useInventairePage } from './use-inventaire-page';

export default function InventairePage() {
  const {
    filters,
    setFilters,
    showOnlyWithStock,
    setShowOnlyWithStock,
    quickDateFilter,
    stockLevelFilter,
    setStockLevelFilter,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isReportsModalOpen,
    setIsReportsModalOpen,
    isAdjustmentModalOpen,
    setIsAdjustmentModalOpen,
    selectedProduct,
    inventory,
    stats,
    loading,
    fetchInventory,
    activeFiltersCount,
    filteredInventory,
    handleRefresh,
    handleExport,
    handleSearch,
    handleApplyFilters,
    handleQuickDateFilter,
    handleResetFilters,
    openHistoryModal,
    openAdjustmentModal,
  } = useInventairePage();

  return (
    <div className="min-h-screen bg-gray-50">
      <InventaireHeader
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onOpenReports={() => setIsReportsModalOpen(true)}
      />

      <div className="w-full px-4 py-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StockKPICard
            title="Produits Actifs"
            value={stats.products_with_activity}
            icon={Package}
            variant="success"
            subtitle={`sur ${stats.total_products}`}
          />
          <StockKPICard
            title="Mouvements"
            value={stats.total_movements}
            icon={TrendingUp}
            variant="info"
            subtitle="totaux"
          />
          <StockKPICard
            title="Valeur Stock"
            value={formatPrice(stats.total_stock_value)}
            icon={BarChart3}
            variant="default"
            subtitle="valorisation"
          />
          <StockKPICard
            title="Dernière MAJ"
            value={new Date().toLocaleDateString('fr-FR')}
            icon={Calendar}
            variant="info"
            subtitle={new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>

        <InventaireFilters
          filters={filters}
          setFilters={setFilters}
          showOnlyWithStock={showOnlyWithStock}
          setShowOnlyWithStock={setShowOnlyWithStock}
          quickDateFilter={quickDateFilter}
          stockLevelFilter={stockLevelFilter}
          setStockLevelFilter={setStockLevelFilter}
          activeFiltersCount={activeFiltersCount}
          onSearch={handleSearch}
          onApplyFilters={handleApplyFilters}
          onQuickDateFilter={handleQuickDateFilter}
          onResetFilters={handleResetFilters}
        />

        <InventaireTable
          inventory={inventory}
          filteredInventory={filteredInventory}
          stats={stats}
          loading={loading}
          showOnlyWithStock={showOnlyWithStock}
          onOpenHistory={openHistoryModal}
          onOpenAdjustment={openAdjustmentModal}
        />
      </div>

      <InventoryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => {
          void fetchInventory().catch(error => {
            console.error(
              '[Inventaire] onSuccess fetchInventory failed:',
              error
            );
          });
        }}
        product={selectedProduct}
      />

      <ProductHistoryModal
        product={selectedProduct}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <StockReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </div>
  );
}
