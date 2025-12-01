'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Progress } from '@verone/ui';
import {
  ShoppingBag,
  Globe,
  Store,
  Smartphone,
  Monitor,
  Package,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';

// Configuration des canaux de vente actifs
const ACTIVE_CHANNELS = [
  {
    id: 'google_merchant',
    name: 'Google Merchant Center',
    description: 'Synchronisation avec Google Shopping',
    icon: Globe,
    status: 'active',
    products_synced: 45,
    last_sync: '2025-01-23T14:30:00',
    sync_status: 'success',
    revenue_this_month: 12500,
    orders_this_month: 23,
    api: true,
    path: '/canaux-vente/google-merchant',
  },
  {
    id: 'boutique_en_ligne',
    name: 'Boutique en ligne',
    description: 'Site e-commerce Vérone',
    icon: Monitor,
    status: 'active',
    products_synced: 241,
    last_sync: '2025-01-23T15:45:00',
    sync_status: 'success',
    revenue_this_month: 45670,
    orders_this_month: 89,
    api: false,
    path: '/canaux-vente/site-internet',
  },
  {
    id: 'linkme',
    name: 'LinkMe',
    description: 'Plateforme d\'affiliation B2B2C - Apporteurs d\'affaires',
    icon: Users,
    status: 'active',
    products_synced: 0,
    last_sync: null,
    sync_status: 'pending',
    revenue_this_month: 0,
    orders_this_month: 0,
    api: false,
    path: '/canaux-vente/linkme',
  },
];

// Canaux Phase 2 (à venir)
const UPCOMING_CHANNELS = [
  {
    id: 'instagram_shopping',
    name: 'Instagram Shopping',
    description: 'Catalogue produits sur Instagram - Disponible en Phase 2',
    icon: Smartphone,
  },
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    description: 'Vente sur Facebook Marketplace - Disponible en Phase 2',
    icon: Store,
  },
];

export default function CanauxVentePage() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Actif
          </Badge>
        );
      case 'setup_required':
        return (
          <Badge variant="outline" className="border-gray-300 text-black">
            Configuration requise
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Inactif
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)} heures`;
    return date.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calcul des statistiques globales
  const stats = {
    totalChannels: ACTIVE_CHANNELS.length,
    activeChannels: ACTIVE_CHANNELS.filter(c => c.status === 'active').length,
    totalProducts: ACTIVE_CHANNELS.reduce(
      (sum, c) => sum + c.products_synced,
      0
    ),
    totalRevenue: ACTIVE_CHANNELS.reduce(
      (sum, c) => sum + c.revenue_this_month,
      0
    ),
    totalOrders: ACTIVE_CHANNELS.reduce(
      (sum, c) => sum + c.orders_this_month,
      0
    ),
  };

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
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Canaux Actifs</p>
                  <p className="text-2xl font-bold text-black">
                    {stats.activeChannels}/{stats.totalChannels}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits Synchronisés</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CA ce mois</p>
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
                  <p className="text-sm text-gray-600">Commandes ce mois</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalOrders}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux conversion</p>
                  <p className="text-2xl font-bold text-black">2.3%</p>
                </div>
                <ArrowUpDown className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des canaux de vente actifs */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">
              Canaux de Distribution Actifs
            </CardTitle>
            <CardDescription>
              Gérez et synchronisez vos produits sur différentes plateformes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ACTIVE_CHANNELS.map(channel => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(channel.path)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <Icon className="h-6 w-6 text-black" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-black text-lg">
                                {channel.name}
                              </h3>
                              {getStatusBadge(channel.status)}
                              {channel.api && (
                                <Badge
                                  variant="outline"
                                  className="border-blue-300 text-blue-600"
                                >
                                  API
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-600 mb-4">
                              {channel.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Produits synchronisés
                                </p>
                                <p className="font-semibold text-black">
                                  {channel.products_synced}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">
                                  Dernière synchro
                                </p>
                                <div className="flex items-center space-x-1">
                                  {getSyncStatusIcon(channel.sync_status)}
                                  <p className="font-medium text-gray-700">
                                    {formatDate(channel.last_sync)}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">
                                  CA ce mois
                                </p>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(channel.revenue_this_month)}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">
                                  Commandes
                                </p>
                                <p className="font-semibold text-blue-600">
                                  {channel.orders_this_month}
                                </p>
                              </div>
                            </div>

                            {channel.status === 'active' &&
                              channel.products_synced > 0 && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">
                                      Synchronisation
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      100%
                                    </span>
                                  </div>
                                  <Progress value={100} className="h-2" />
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Canaux à venir (Phase 2) */}
        <Card className="border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-700 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Canaux à Venir - Phase 2
            </CardTitle>
            <CardDescription>
              Ces canaux seront disponibles prochainement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {UPCOMING_CHANNELS.map(channel => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className="border border-gray-300 rounded-lg p-5 bg-white opacity-70"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Icon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-700">
                            {channel.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-gray-400 text-gray-600"
                          >
                            Bientôt disponible
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-sm">
                          {channel.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
