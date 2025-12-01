'use client';

import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Badge } from '@verone/ui';

/**
 * Page Analytics LinkMe
 * Vue d'ensemble des statistiques de la plateforme
 */
export default function LinkMeAnalyticsPage() {
  // TODO: Implémenter hooks analytics réels
  const stats = {
    totalAffiliates: 45,
    activeAffiliates: 38,
    totalSelections: 127,
    totalOrders: 892,
    totalRevenue: 156780,
    totalCommissions: 15678,
    conversionRate: 3.2,
    averageOrderValue: 175.65,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Analytics</h1>
              <p className="text-sm text-gray-500">
                Vue d'ensemble des performances LinkMe
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Données en temps réel
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
                  <p className="text-sm text-gray-500">Affiliés actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-sm text-gray-500">Commandes totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-sm text-gray-500">Taux de conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques placeholder */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Graphique à implémenter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Affiliés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Classement à implémenter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats secondaires */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500 mb-1">Sélections créées</p>
              <p className="text-3xl font-bold">{stats.totalSelections}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500 mb-1">Panier moyen</p>
              <p className="text-3xl font-bold">{stats.averageOrderValue.toFixed(2)} €</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500 mb-1">Commissions versées</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalCommissions.toLocaleString('fr-FR')} €
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
