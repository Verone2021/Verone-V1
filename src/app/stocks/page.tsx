'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  BarChart3,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Grid3x3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ButtonV2 } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockDashboard } from '@/hooks/use-stock-dashboard';
import { formatPrice } from '@/lib/utils';
import { StockKPICard } from '@/components/ui-v2/stock/StockKPICard';
import { ChannelFilter } from '@/components/ui-v2/stock';

export default function StocksDashboardPage() {
  const router = useRouter();
  const { metrics, loading, error, refetch } = useStockDashboard();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );

  // Extraction des métriques avec fallbacks
  const overview = metrics?.overview || {
    total_value: 0,
    products_in_stock: 0,
    products_out_of_stock: 0,
    products_below_min: 0,
    total_products: 0,
    total_quantity: 0,
    total_available: 0,
  };

  const movements = metrics?.movements || {
    last_7_days: {
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
      adjustments: { count: 0, quantity: 0 },
    },
    today: { entries: 0, exits: 0, adjustments: 0 },
    total_movements: 0,
  };

  const lowStockProducts = metrics?.low_stock_products || [];
  const recentMovements = metrics?.recent_movements || [];
  const incomingOrders = metrics?.incoming_orders || [];
  const outgoingOrders = metrics?.outgoing_orders || [];

  const totalAlerts =
    overview.products_out_of_stock + overview.products_below_min;

  // Auto-refetch mouvements au changement canal
  useEffect(() => {
    if (!loading && selectedChannelId !== null) {
      refetch();
    }
  }, [selectedChannelId]);

  // Handler pour ouvrir les détails de commande (modal)
  const handleOrderClick = (
    orderId: string,
    orderType: 'purchase' | 'sales'
  ) => {
    if (orderType === 'purchase') {
      router.push(`/commandes/fournisseurs/${orderId}`);
    } else {
      router.push(`/commandes/clients/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Ultra-Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Stocks</h2>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="text-xs">Actualiser</span>
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Navigation - TOUJOURS VISIBLE EN HAUT */}
        <Card className="border-gray-300 rounded-[10px] shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            {/* Section Pages Stock */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pages Stock
              </p>
              <div className="flex gap-2 flex-wrap">
                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/inventaire')}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  <span className="text-xs">Inventaire</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/mouvements')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <span className="text-xs">Mouvements</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/alertes')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-xs">Alertes</span>
                  {totalAlerts > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 px-1.5 text-xs"
                    >
                      {totalAlerts}
                    </Badge>
                  )}
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/entrees')}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  <span className="text-xs">Entrées</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/sorties')}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  <span className="text-xs">Sorties</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/previsionnel')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="text-xs">Prévisionnels</span>
                  <Badge
                    variant="outline"
                    className="ml-2 h-5 px-1.5 text-[10px] border-blue-400 text-blue-600"
                  >
                    NEW
                  </Badge>
                </ButtonV2>
              </div>
            </div>

            {/* Section Pages Connexes */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pages Connexes
              </p>
              <div className="flex gap-4 flex-wrap items-center text-sm">
                <Link
                  href="/produits/catalogue"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Catalogue</span>
                </Link>

                <Link
                  href="/commandes/fournisseurs"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Commandes Fournisseurs</span>
                </Link>

                <Link
                  href="/commandes/clients"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Commandes Clients</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtre Canal Vente */}
        <Card className="border-gray-300 rounded-[10px] shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Filtre canal :
              </span>
              <ChannelFilter
                selectedChannel={selectedChannelId}
                onChannelChange={setSelectedChannelId}
                showAllOption={true}
                placeholder="Tous les canaux"
              />
            </div>
          </CardContent>
        </Card>

        {/* KPIs Compacts - 4 Cards Design System V2 (Height 80px) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* KPI 1: Stock Réel */}
          <StockKPICard
            title="Stock Réel"
            value={overview.total_quantity}
            icon={Package}
            variant="success"
            subtitle={`${overview.products_in_stock} produits en stock`}
          />

          {/* KPI 2: Stock Disponible */}
          <StockKPICard
            title="Disponible"
            value={overview.total_available || 0}
            icon={CheckCircle}
            variant="info"
            subtitle="Réel - Réservé"
          />

          {/* KPI 3: Alertes Stock */}
          <StockKPICard
            title="Alertes"
            value={totalAlerts}
            icon={AlertTriangle}
            variant={
              totalAlerts > 5
                ? 'danger'
                : totalAlerts > 0
                  ? 'warning'
                  : 'success'
            }
            subtitle={
              totalAlerts > 0
                ? `${totalAlerts} actions requises`
                : 'Aucune alerte'
            }
          />

          {/* KPI 4: Valeur Stock */}
          <StockKPICard
            title="Valeur Stock"
            value={new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(overview.total_value || 0)}
            icon={BarChart3}
            variant="default"
            subtitle="HT"
          />
        </div>

        {/* Section STOCK RÉEL - Border Accent Vert Gauche + Background Vert Subtil */}
        <Card className="border-l-4 border-green-500 bg-green-50 rounded-[10px] shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Mouvements Effectués
              </Badge>
              <CardTitle className="text-xl text-black">✓ STOCK RÉEL</CardTitle>
            </div>
            <CardDescription className="text-gray-700 font-medium">
              Inventaire actuel et mouvements confirmés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Widget: Alertes Stock Faible */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base">
                  Alertes Stock Faible
                </CardTitle>
                <CardDescription className="text-xs">
                  Produits nécessitant réapprovisionnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucune alerte stock actuellement
                      </p>
                    </div>
                  ) : (
                    <>
                      {lowStockProducts.slice(0, 3).map(product => (
                        <div
                          key={product.id}
                          className="flex items-start justify-between border-b border-gray-100 pb-2 last:border-0"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {/* Image Produit */}
                            {product.product_image_url ? (
                              <Image
                                src={product.product_image_url}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            {/* Info Produit */}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/produits/catalogue/${product.id}`}
                                className="text-sm font-medium text-black hover:text-blue-600 hover:underline transition-colors block truncate"
                              >
                                {product.name}
                              </Link>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {product.sku}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2 ml-4 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className="border-orange-300 text-orange-600 text-xs"
                            >
                              {product.stock_quantity} réel
                            </Badge>
                            {Math.abs(product.stock_forecasted_out || 0) >
                              0 && (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-600 text-xs"
                              >
                                {Math.abs(product.stock_forecasted_out)} réservé
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/alertes')}
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs mt-2"
                      >
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        Voir toutes les alertes ({totalAlerts})
                      </ButtonV2>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
