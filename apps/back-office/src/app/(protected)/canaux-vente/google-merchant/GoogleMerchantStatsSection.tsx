'use client';

import type { useGoogleMerchantStats } from '@verone/channels';

import { Alert, AlertDescription } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  RefreshCw,
  Package,
  CheckCircle,
  BarChart,
  ShoppingBag,
  Euro,
  Info,
} from 'lucide-react';

type StatsData = NonNullable<ReturnType<typeof useGoogleMerchantStats>['data']>;

type GoogleMerchantStatsSectionProps = {
  stats: StatsData | null | undefined;
  isLoading: boolean;
};

export function GoogleMerchantStatsSection({
  stats,
  isLoading,
}: GoogleMerchantStatsSectionProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
        <p className="text-gray-600 mt-2">Chargement des statistiques...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert className="mb-6 border-gray-300">
        <Info className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-gray-700">
          Aucune donnée de synchronisation disponible. Synchronisez des produits
          pour voir les statistiques.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits</p>
              <p className="text-2xl font-bold text-black">
                {stats.total_products}
              </p>
            </div>
            <Package className="h-6 w-6 text-black" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approuvés</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved_products}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Impressions</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total_impressions.toLocaleString('fr-FR')}
              </p>
            </div>
            <BarChart className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clics</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.total_clicks}
              </p>
            </div>
            <ShoppingBag className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-black">
                {stats.total_conversions}
              </p>
            </div>
            <Euro className="h-6 w-6 text-black" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux Conv.</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.conversion_rate > 0 ? `${stats.conversion_rate}%` : '0%'}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
