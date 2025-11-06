'use client';

/**
 * Page Stock Prévisionnel - Impact Futur Commandes
 *
 * Affiche l'impact des commandes en cours (fournisseurs + clients) sur les stocks futurs.
 * Réutilise hook use-stock-dashboard et composant ForecastSummaryWidget.
 *
 * @created Phase 3.5 - 2025-11-02
 * @route /stocks/previsionnel
 */

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  ShoppingCart,
  Truck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useStockDashboard } from '@/shared/modules/stock/hooks';
import { OrderItemsTable } from '@/components/business/order-items-table';
import { StockKPICard } from '@/components/ui-v2/stock/StockKPICard';

export default function StockPrevisionnelPage() {
  const router = useRouter();
  const { metrics, loading, error, refetch } = useStockDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Skeleton loading */}
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Erreur de chargement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <ButtonV2 onClick={() => refetch()} variant="outline">
                Réessayer
              </ButtonV2>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const overview = metrics?.overview;
  const incomingOrders = metrics?.incoming_orders || [];
  const outgoingOrders = metrics?.outgoing_orders || [];

  // Calculer stock disponible futur
  const stockRealTotal = overview?.total_quantity || 0;
  const forecastIn = overview?.total_forecasted_in || 0;
  const forecastOut = Math.abs(overview?.total_forecasted_out || 0);
  const stockFutur = stockRealTotal - forecastOut + forecastIn;

  // Compter commandes en attente
  const nbCommandesFournisseurs = incomingOrders.length;
  const nbCommandesClients = outgoingOrders.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">
        {/* Header avec Navigation */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stocks')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </ButtonV2>
              <h1 className="text-3xl font-bold text-black">
                Stock Prévisionnel
              </h1>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                <Clock className="h-3 w-3 mr-1" />
                Commandes En Cours
              </Badge>
            </div>
            <p className="text-gray-600 text-sm ml-14">
              Impact futur des commandes confirmées sur les stocks •{' '}
              <span className="font-semibold">INFORMATIF uniquement</span>
            </p>
          </div>
        </div>

        {/* 4 KPI Cards Prévisionnels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Entrées Prévues */}
          <StockKPICard
            title="Entrées Prévues"
            value={`+${forecastIn}`}
            subtitle="unités attendues"
            icon={TrendingUp}
            variant="success"
          />

          {/* KPI 2: Sorties Prévues */}
          <StockKPICard
            title="Sorties Prévues"
            value={`-${forecastOut}`}
            subtitle="unités planifiées"
            icon={TrendingDown}
            variant="danger"
          />

          {/* KPI 3: Stock Disponible Futur */}
          <StockKPICard
            title="Stock Futur"
            value={stockFutur.toString()}
            subtitle="unités après commandes"
            icon={Package}
            variant="default"
          />

          {/* KPI 4: Total Commandes */}
          <StockKPICard
            title="Commandes en attente"
            value={(nbCommandesFournisseurs + nbCommandesClients).toString()}
            subtitle="commandes actives"
            icon={Clock}
            variant="default"
          />
        </div>

        {/* Cartes Expansibles Commandes */}
        <Card className="border-l-4 border-blue-500 bg-blue-50 rounded-[10px] shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-black">
              📊 Détail des Commandes
            </CardTitle>
            <CardDescription className="text-gray-700">
              Cliquez sur une commande pour voir les produits concernés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="in" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Entrées Prévues ({nbCommandesFournisseurs})
                </TabsTrigger>
                <TabsTrigger value="out" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Sorties Prévues ({nbCommandesClients})
                </TabsTrigger>
              </TabsList>

              {/* Tab Entrées Prévues (Commandes Fournisseurs) */}
              <TabsContent value="in" className="mt-4">
                {incomingOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucune commande fournisseur en cours</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {incomingOrders.map(order => (
                      <AccordionItem
                        key={order.id}
                        value={order.id}
                        className="border border-gray-200 rounded-lg px-4 bg-white"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Truck className="h-5 w-5 text-green-600" />
                              <div className="text-left">
                                <p className="font-semibold text-black">
                                  {order.order_number || `Commande #${order.id.slice(0, 8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.supplier_name || 'Fournisseur'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                +{order.total_quantity} unités
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <OrderItemsTable orderId={order.id} orderType="purchase" />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>

              {/* Tab Sorties Prévues (Commandes Clients) */}
              <TabsContent value="out" className="mt-4">
                {outgoingOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucune commande client en cours</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {outgoingOrders.map(order => (
                      <AccordionItem
                        key={order.id}
                        value={order.id}
                        className="border border-gray-200 rounded-lg px-4 bg-white"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="h-5 w-5 text-red-600" />
                              <div className="text-left">
                                <p className="font-semibold text-black">
                                  {order.order_number || `Commande #${order.id.slice(0, 8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.client_name || 'Client'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-100 text-red-700 border-red-300">
                                -{order.total_quantity} unités
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <OrderItemsTable orderId={order.id} orderType="sales" />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Box Explicative */}
        <Card className="border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  ℹ️ À propos du Stock Prévisionnel
                </p>
                <p>
                  Les données affichées sont{' '}
                  <span className="font-semibold">informatives uniquement</span>{' '}
                  et basées sur les commandes confirmées. Le stock prévisionnel
                  n'affecte PAS le stock réel jusqu'à la réception/expédition
                  effective.
                </p>
                <ul className="list-disc list-inside space-y-0.5 mt-2 text-gray-600">
                  <li>
                    <span className="font-medium">Entrées prévues</span>:
                    Commandes fournisseurs en cours (draft, sent, confirmed,
                    partially_received)
                  </li>
                  <li>
                    <span className="font-medium">Sorties prévues</span>:
                    Commandes clients confirmées (confirmed, partially_shipped)
                  </li>
                  <li>
                    <span className="font-medium">Stock futur</span>: Estimation
                    après traitement de toutes les commandes en cours
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
