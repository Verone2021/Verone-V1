'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { useCatalogue } from '@verone/categories';
import { useToast } from '@verone/common';
import { ProductStockHistoryModal } from '@verone/products';
import {
  GeneralStockMovementModal,
  StockMovementModal,
  StockSummaryCard,
  useStock,
} from '@verone/stock';
import { AlertTriangle, Boxes, Clock, Package } from 'lucide-react';

import { StocksAlertsBanner } from './_components/StocksAlertsBanner';
import { StocksFiltersBar } from './_components/StocksFiltersBar';
import { StocksPageHeader } from './_components/StocksPageHeader';
import { StocksProductTable } from './_components/StocksProductTable';
import { DEFAULT_FILTERS, MIN_STOCK_LEVEL } from './_components/types';
import type { ProductWithStock, StockFilters } from './_components/types';

export default function CatalogueStocksPage() {
  const [filters, setFilters] = useState<StockFilters>(DEFAULT_FILTERS);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithStock | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showGeneralMovementModal, setShowGeneralMovementModal] =
    useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<ProductWithStock | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();
  const {
    products,
    loading: productsLoading,
    loadCatalogueData,
  } = useCatalogue();
  const {
    stockData,
    summary,
    loading: stockLoading,
    fetchAllStock,
    getStockAlerts,
  } = useStock();

  useEffect(() => {
    let stale = false;
    void loadCatalogueData().catch(error => {
      if (!stale)
        console.error('[CatalogueStocks] loadCatalogueData failed:', error);
    });
    void fetchAllStock().catch(error => {
      if (!stale)
        console.error('[CatalogueStocks] fetchAllStock failed:', error);
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedProducts = useMemo<ProductWithStock[]>(() => {
    if (!products || !stockData) return [];
    return products.map(product => {
      const stock = stockData.find(s => s.product_id === product.id);
      return {
        ...product,
        stock_real: stock?.stock_real ?? 0,
        stock_forecasted_in: stock?.stock_forecasted_in ?? 0,
        stock_forecasted_out: stock?.stock_forecasted_out ?? 0,
        stock_available: stock?.stock_available ?? 0,
        stock_total_forecasted: stock?.stock_total_forecasted ?? 0,
        last_movement_at: stock?.last_movement_at,
      };
    });
  }, [products, stockData]);

  const filteredProducts = useMemo(() => {
    let filtered = enrichedProducts;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search)
      );
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => {
        switch (filters.status) {
          case 'out_of_stock':
            return p.stock_real <= 0;
          case 'low_stock':
            return p.stock_real > 0 && p.stock_real <= MIN_STOCK_LEVEL;
          case 'in_stock':
            return p.stock_real > MIN_STOCK_LEVEL;
          case 'forecasted_shortage':
            return p.stock_available <= MIN_STOCK_LEVEL;
          default:
            return true;
        }
      });
    }
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      const aComp: string | number =
        typeof aVal === 'string'
          ? aVal.toLowerCase()
          : typeof aVal === 'number'
            ? aVal
            : 0;
      const bComp: string | number =
        typeof bVal === 'string'
          ? bVal.toLowerCase()
          : typeof bVal === 'number'
            ? bVal
            : 0;
      if (aComp < bComp) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aComp > bComp) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [enrichedProducts, filters]);

  const stockAlerts = useMemo(() => getStockAlerts(), [getStockAlerts]);
  const loading = productsLoading || stockLoading;

  const handleRefresh = () => {
    void Promise.all([loadCatalogueData(), fetchAllStock()])
      .then(() => {
        toast({
          title: 'Données actualisées',
          description: 'Le stock a été rechargé avec succès',
        });
      })
      .catch(error => {
        console.error('[CatalogueStocks] handleRefresh failed:', error);
      });
  };

  const handleMovementSuccess = () => {
    void fetchAllStock().catch(error =>
      console.error('[CatalogueStocks] fetchAllStock (movement) failed:', error)
    );
    setSelectedProduct(null);
    setShowMovementModal(false);
  };

  const handleGeneralMovementSuccess = () => {
    void fetchAllStock().catch(error =>
      console.error('[CatalogueStocks] fetchAllStock (general) failed:', error)
    );
    setShowGeneralMovementModal(false);
  };

  return (
    <div className="space-y-6">
      <StocksPageHeader
        loading={loading}
        onRefresh={handleRefresh}
        onNewMovement={() => setShowGeneralMovementModal(true)}
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StockSummaryCard
            title="Produits en stock"
            value={summary.total_products}
            icon={Package}
            color="blue"
          />
          <StockSummaryCard
            title="Stock physique total"
            value={summary.total_real}
            icon={Boxes}
            color="green"
          />
          <StockSummaryCard
            title="Alertes stock faible"
            value={summary.low_stock_count}
            icon={AlertTriangle}
            color="orange"
          />
          <StockSummaryCard
            title="Ruptures prévues"
            value={summary.forecasted_shortage_count}
            icon={Clock}
            color="red"
          />
        </div>
      )}

      <StocksAlertsBanner alerts={stockAlerts} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="real">Stock Physique</TabsTrigger>
          <TabsTrigger value="forecasted">Stock Prévisionnel</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StocksFiltersBar filters={filters} onFiltersChange={setFilters} />
          <StocksProductTable
            products={filteredProducts}
            loading={loading}
            onAddMovement={product => {
              setSelectedProduct(product);
              setShowMovementModal(true);
            }}
            onShowHistory={product => {
              setSelectedProductForHistory(product);
              setShowHistoryModal(true);
            }}
          />
        </TabsContent>

        <TabsContent value="real">
          <Card>
            <CardHeader>
              <CardTitle>Stock Physique</CardTitle>
              <CardDescription>
                Stock réellement présent en entrepôt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Vue détaillée du stock physique en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasted">
          <Card>
            <CardHeader>
              <CardTitle>Stock Prévisionnel</CardTitle>
              <CardDescription>
                Prévisions d&apos;entrées et sorties basées sur les commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Vue prévisionnelle en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
              <CardDescription>
                Tous les mouvements de stock avec traçabilité complète
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Historique des mouvements en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          isOpen={showMovementModal}
          onClose={() => {
            setShowMovementModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleMovementSuccess}
        />
      )}

      <GeneralStockMovementModal
        isOpen={showGeneralMovementModal}
        onClose={() => setShowGeneralMovementModal(false)}
        onSuccess={handleGeneralMovementSuccess}
      />

      <ProductStockHistoryModal
        product={selectedProductForHistory}
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedProductForHistory(null);
        }}
      />
    </div>
  );
}
