'use client';

import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  ShoppingBag,
  Globe,
  Settings,
  Package,
  TrendingUp,
  BarChart3,
  Users,
  Link2,
} from 'lucide-react';
import { useGoogleMerchantStats } from '@verone/channels/hooks';

import { useLinkMeDashboard } from './linkme/hooks/use-linkme-dashboard';
import { ChannelCard } from './components/channel-card';

export default function CanauxVentePage() {
  // Fetch REAL data from hooks
  const { data: linkmeData, isLoading: linkmeLoading } = useLinkMeDashboard();
  const { data: googleData, isLoading: googleLoading } =
    useGoogleMerchantStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total stats from REAL data
  const stats = {
    totalRevenue:
      (linkmeData?.revenue.current || 0) + (googleData?.total_revenue_ht || 0),
    totalOrders:
      (linkmeData?.orders.current || 0) + (googleData?.total_conversions || 0),
    totalProducts: googleData?.total_products || 0, // Total products from Google Merchant
    activeChannels: 2, // LinkMe + Google Merchant
  };

  if (linkmeLoading || googleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Canaux de Vente</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos différents canaux de distribution et marketplaces
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonUnified
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </ButtonUnified>
              <ButtonUnified variant="default">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Nouveau Canal
              </ButtonUnified>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Global KPIs - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CA Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commandes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalOrders}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits Actifs</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Canaux Actifs</p>
                  <p className="text-2xl font-bold text-black">
                    {stats.activeChannels}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Channels Cards */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">
              Canaux de Distribution Actifs
            </CardTitle>
            <CardDescription>
              Statistiques en temps réel de vos canaux de vente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* LinkMe Channel - REAL DATA */}
              <ChannelCard
                name="LinkMe"
                description="Plateforme d'affiliation B2B2C - Apporteurs d'affaires professionnels"
                icon={Link2}
                status="active"
                gradient="bg-blue-500"
                manageHref="/canaux-vente/linkme"
                metrics={{
                  revenue: linkmeData?.revenue.current || 0,
                  revenueGrowth: linkmeData?.revenue.growth,
                  orders: linkmeData?.orders.current || 0,
                  ordersGrowth: linkmeData?.orders.growth,
                  commissions: linkmeData?.pendingCommissions.amount || 0,
                  products: linkmeData?.affiliates.active || 0, // Show active affiliates as "products"
                }}
              />

              {/* Google Merchant Channel - REAL DATA */}
              <ChannelCard
                name="Google Merchant Center"
                description="Synchronisation automatique avec Google Shopping et Search"
                icon={ShoppingBag}
                status="active"
                gradient="bg-green-500"
                manageHref="/canaux-vente/google-merchant"
                metrics={{
                  revenue: googleData?.total_revenue_ht || 0,
                  orders: googleData?.total_conversions || 0,
                  products: googleData?.total_products || 0,
                }}
              />

              {/* Site Internet Channel - UNAVAILABLE */}
              <ChannelCard
                name="Site Internet"
                description="Boutique en ligne Vérone - Module en développement"
                icon={Globe}
                status="unavailable"
                gradient="bg-gray-500"
                isUnavailable
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        {linkmeData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  LinkMe - Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Affiliés actifs
                      </span>
                    </div>
                    <span className="font-semibold text-black">
                      {linkmeData.affiliates.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Nouveaux ce mois
                      </span>
                    </div>
                    <span className="font-semibold text-green-600">
                      +{linkmeData.affiliates.newThisMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-orange-500" />
                      <span className="text-sm text-gray-600">
                        Commissions en attente
                      </span>
                    </div>
                    <span className="font-semibold text-orange-600">
                      {linkmeData.pendingCommissions.count} demandes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {googleData && (
              <Card className="border-black">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Google Merchant - Statut
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Produits approuvés
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {googleData.approved_products}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-yellow-500" />
                        <span className="text-sm text-gray-600">
                          En attente
                        </span>
                      </div>
                      <span className="font-semibold text-yellow-600">
                        {googleData.pending_products}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Taux de conversion
                        </span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        {googleData.conversion_rate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
