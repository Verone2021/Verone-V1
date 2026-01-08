'use client';

/**
 * Page Statistiques Produits
 *
 * Affiche TOUS les produits vendus avec statistiques complètes :
 * - KPIs globaux (produits, quantités, CA, commissions)
 * - Tableau paginé avec recherche et tri
 * - Valeurs HT et TTC avec TVA
 *
 * @module StatistiquesProduits
 * @since 2026-01-08
 */

import Link from 'next/link';

import {
  Card,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react';
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { ProductStatsTable } from '@/components/analytics/ProductStatsTable';
import { useAllProductsStats } from '@/lib/hooks/use-all-products-stats';

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ============================================
// PAGE
// ============================================

export default function StatistiquesProduits(): JSX.Element {
  const { data, isLoading, error, refetch } = useAllProductsStats();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/analytics"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[#7E84C0] to-[#3976BB] rounded-lg shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#183559]">
                Statistiques Produits
              </h1>
              <p className="text-gray-500 text-sm">
                Historique complet de vos ventes
              </p>
            </div>
          </div>

          <button
            onClick={() => void refetch()}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <Card className="p-3 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Erreur de chargement
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => void refetch()}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* 4 KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Produits vendus */}
          <Card className="p-4 border-l-4 border-[#7E84C0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#7E84C0]/10 rounded-lg">
                <Package className="h-4 w-4 text-[#7E84C0]" />
              </div>
              <span className="text-sm text-gray-600">Produits</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-16" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#7E84C0]">
                  {data?.totals.productsCount ?? 0}
                </p>
                <p className="text-xs text-gray-500">produits différents</p>
              </>
            )}
          </Card>

          {/* Quantité totale */}
          <Card className="p-4 border-l-4 border-[#3976BB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-[#3976BB]" />
              </div>
              <span className="text-sm text-gray-600">Quantité</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#3976BB]">
                  {(data?.totals.totalQuantity ?? 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500">unités vendues</p>
              </>
            )}
          </Card>

          {/* CA Total TTC */}
          <Card className="p-4 border-l-4 border-[#183559]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#183559]/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-[#183559]" />
              </div>
              <span className="text-sm text-gray-600">CA Total TTC</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-28" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#183559]">
                  {formatCurrency(data?.totals.totalRevenueTTC ?? 0)}
                </p>
                <p className="text-xs text-gray-500">
                  HT: {formatCurrency(data?.totals.totalRevenueHT ?? 0)}
                </p>
              </>
            )}
          </Card>

          {/* Commissions TTC */}
          <Card className="p-4 border-l-4 border-[#5DBEBB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
                <Wallet className="h-4 w-4 text-[#5DBEBB]" />
              </div>
              <span className="text-sm text-gray-600">Commissions TTC</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-28" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#5DBEBB]">
                  {formatCurrency(data?.totals.totalCommissionTTC ?? 0)}
                </p>
                <p className="text-xs text-gray-500">
                  HT: {formatCurrency(data?.totals.totalCommissionHT ?? 0)}
                </p>
              </>
            )}
          </Card>
        </section>

        {/* Tableau des produits avec onglets */}
        <section>
          <Card className="p-4">
            <TabGroup>
              <TabList className="mb-4">
                <Tab>Produits Catalogue</Tab>
                <Tab>Produits Revendeur</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <ProductStatsTable
                    products={
                      data?.products.filter(
                        p => p.commissionType === 'catalogue'
                      ) ?? []
                    }
                    isLoading={isLoading}
                    isRevendeur={false}
                  />
                </TabPanel>
                <TabPanel>
                  <ProductStatsTable
                    products={
                      data?.products.filter(
                        p => p.commissionType === 'revendeur'
                      ) ?? []
                    }
                    isLoading={isLoading}
                    isRevendeur
                  />
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-6">
          <p>
            Les données incluent tous les produits vendus depuis le début.
            Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
