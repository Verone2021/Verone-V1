'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  ShoppingBag,
} from 'lucide-react';

import { useSalesOrders } from '@verone/orders';
import { usePurchaseOrders } from '@verone/orders';

export default function CommandesOverviewPage() {
  const {
    loading: salesLoading,
    orders: salesOrders,
    stats: salesStats,
    fetchOrders: fetchSalesOrders,
    fetchStats: fetchSalesStats,
  } = useSalesOrders();

  const {
    loading: purchaseLoading,
    orders: purchaseOrders,
    stats: purchaseStats,
    fetchOrders: fetchPurchaseOrders,
    fetchStats: fetchPurchaseStats,
  } = usePurchaseOrders();

  useEffect(() => {
    fetchSalesOrders();
    fetchSalesStats();
    fetchPurchaseOrders();
    fetchPurchaseStats();
  }, [
    fetchSalesOrders,
    fetchSalesStats,
    fetchPurchaseOrders,
    fetchPurchaseStats,
  ]);

  const isLoading = salesLoading || purchaseLoading;

  // Statistiques combinées
  const totalOrders =
    (salesStats?.total_orders || 0) + (purchaseStats?.total_orders || 0);
  const totalValue =
    (salesStats?.total_value || 0) + (purchaseStats?.total_value || 0);

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-3xl font-bold text-black">Commandes</h1>
              <p className="text-gray-600">
                Vue d&apos;ensemble des commandes clients et fournisseurs
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href="/commandes/clients">
              <ButtonV2
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Commandes Clients</span>
              </ButtonV2>
            </Link>
            <Link href="/commandes/fournisseurs">
              <ButtonV2 className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Commandes Fournisseurs</span>
              </ButtonV2>
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Chargement des statistiques...</div>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Total Commandes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {totalOrders}
                </div>
                <p className="text-xs text-gray-500">
                  Toutes catégories confondues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Valeur Totale</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(totalValue)}
                </div>
                <p className="text-xs text-gray-500">
                  Chiffre d&apos;affaires + achats
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Ventes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesStats?.total_value || 0)}
                </div>
                <p className="text-xs text-gray-500">
                  {salesStats?.total_orders || 0} commandes clients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Achats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(purchaseStats?.total_value || 0)}
                </div>
                <p className="text-xs text-gray-500">
                  {purchaseStats?.total_orders || 0} commandes fournisseurs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sections détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commandes Clients */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Commandes Clients</CardTitle>
                  </div>
                  <Link href="/commandes/clients">
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <span>Voir tout</span>
                      <ArrowRight className="h-4 w-4" />
                    </ButtonV2>
                  </Link>
                </div>
                <CardDescription>Ventes et expéditions clients</CardDescription>
              </CardHeader>
              <CardContent>
                {salesStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          {salesStats.delivered_orders}
                        </div>
                        <div className="text-xs text-green-600">Livrées</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">
                          {salesStats.pending_orders}
                        </div>
                        <div className="text-xs text-blue-600">En cours</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">
                          {salesStats.shipped_orders}
                        </div>
                        <div className="text-xs text-black">Expédiées</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-700">
                          {salesStats.cancelled_orders}
                        </div>
                        <div className="text-xs text-red-600">Annulées</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commandes Fournisseurs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">
                      Commandes Fournisseurs
                    </CardTitle>
                  </div>
                  <Link href="/commandes/fournisseurs">
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <span>Voir tout</span>
                      <ArrowRight className="h-4 w-4" />
                    </ButtonV2>
                  </Link>
                </div>
                <CardDescription>Achats et approvisionnements</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          {purchaseStats.received_orders}
                        </div>
                        <div className="text-xs text-green-600">Reçues</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">
                          {purchaseStats.pending_orders}
                        </div>
                        <div className="text-xs text-gray-700">En cours</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-700">
                          {purchaseStats.cancelled_orders}
                        </div>
                        <div className="text-xs text-red-600">Annulées</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
              <CardDescription>
                Accès direct aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/commandes/clients">
                  <ButtonV2
                    variant="outline"
                    className="w-full flex items-center space-x-2 justify-start"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Nouvelle Vente</span>
                  </ButtonV2>
                </Link>
                <Link href="/commandes/fournisseurs">
                  <ButtonV2
                    variant="outline"
                    className="w-full flex items-center space-x-2 justify-start"
                  >
                    <Package className="h-4 w-4" />
                    <span>Nouvel Achat</span>
                  </ButtonV2>
                </Link>
                <Link href="/produits/catalogue/stocks">
                  <ButtonV2
                    variant="outline"
                    className="w-full flex items-center space-x-2 justify-start"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>État Stocks</span>
                  </ButtonV2>
                </Link>
                <Link href="/contacts-organisations">
                  <ButtonV2
                    variant="outline"
                    className="w-full flex items-center space-x-2 justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>Organisations</span>
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
