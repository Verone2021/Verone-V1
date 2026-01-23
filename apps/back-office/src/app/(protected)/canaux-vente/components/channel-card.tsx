'use client';

import { useRouter } from 'next/navigation';

import { Badge, Card, CardContent } from '@verone/ui';
import {
  ChevronRight,
  type LucideIcon,
  TrendingUp,
  Package,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

interface ChannelCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: 'active' | 'inactive' | 'unavailable';
  metrics?: {
    revenue: number;
    revenueGrowth?: number;
    orders: number;
    ordersGrowth?: number;
    products?: number;
    commissions?: number;
  };
  gradient: string;
  manageHref?: string;
  isUnavailable?: boolean;
}

export function ChannelCard({
  name,
  description,
  icon: Icon,
  status,
  metrics,
  gradient,
  manageHref,
  isUnavailable = false,
}: ChannelCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth}%`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Actif
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Inactif
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Non disponible
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isUnavailable) {
    return (
      <Card className="border-gray-300 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Icon className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-gray-700 text-lg">{name}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-gray-500 text-sm">{description}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>
                  Ce module sera disponible prochainement. Configurez vos autres
                  canaux de vente en attendant.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-black hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => manageHref && router.push(manageHref)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start space-x-4">
              {/* Icon with gradient */}
              <div
                className={`p-3 rounded-lg ${gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}
              >
                <Icon className="h-6 w-6 text-black" />
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-black text-lg">{name}</h3>
                  {getStatusBadge()}
                </div>

                <p className="text-gray-600 mb-4">{description}</p>

                {/* Metrics Grid */}
                {metrics && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">CA ce mois</p>
                      <p className="font-semibold text-green-600 text-lg">
                        {formatCurrency(metrics.revenue)}
                      </p>
                      {metrics.revenueGrowth !== undefined && (
                        <div className="flex items-center text-xs mt-1">
                          <TrendingUp
                            className={`h-3 w-3 mr-1 ${
                              metrics.revenueGrowth >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          />
                          <span
                            className={
                              metrics.revenueGrowth >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {formatGrowth(metrics.revenueGrowth)} vs moyenne
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Orders */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Commandes</p>
                      <p className="font-semibold text-blue-600 text-lg">
                        {metrics.orders}
                      </p>
                      {metrics.ordersGrowth !== undefined && (
                        <div className="flex items-center text-xs mt-1">
                          <TrendingUp
                            className={`h-3 w-3 mr-1 ${
                              metrics.ordersGrowth >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          />
                          <span
                            className={
                              metrics.ordersGrowth >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {formatGrowth(metrics.ordersGrowth)} vs moyenne
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Products (optional) */}
                    {metrics.products !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Produits</p>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1 text-purple-500" />
                          <p className="font-semibold text-purple-600 text-lg">
                            {metrics.products}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Commissions (LinkMe specific) */}
                    {metrics.commissions !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Commissions à payer
                        </p>
                        <p className="font-semibold text-orange-600 text-lg">
                          {formatCurrency(metrics.commissions)}
                        </p>
                      </div>
                    )}

                    {/* Conversions (Google Merchant specific) */}
                    {!metrics.commissions && metrics.products && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Produits</p>
                        <div className="flex items-center">
                          <ShoppingBag className="h-4 w-4 mr-1 text-gray-500" />
                          <p className="font-semibold text-gray-700 text-lg">
                            {metrics.products}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400 ml-4 group-hover:text-black transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
