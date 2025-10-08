"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Eye,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStock } from '@/hooks/use-stock'
import { useMovementsHistory } from '@/hooks/use-movements-history'

export default function StocksDashboardPage() {
  const router = useRouter()
  const { stockSummary, lowStockProducts, loading: stockLoading } = useStock()
  const { stats: movementStats, loading: movementsLoading } = useMovementsHistory()

  // Calculs des statistiques principales
  const totalProducts = stockSummary?.total_products || 0
  const totalQuantity = stockSummary?.total_quantity || 0
  const lowStockCount = lowStockProducts?.length || 0
  const averageStock = totalProducts > 0 ? Math.round(totalQuantity / totalProducts) : 0

  // Mouvements récents (derniers 7 jours)
  const recentMovements = movementStats?.recent_movements || 0
  const recentEntries = movementStats?.recent_entries || 0
  const recentExits = movementStats?.recent_exits || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard Stocks</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble de l'inventaire et des mouvements Vérone</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/stocks/mouvements')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir Mouvements
              </Button>
              <Button
                onClick={() => router.push('/stocks/entrees')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Entrée
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Produits</CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{totalProducts}</div>
              <p className="text-xs text-gray-600">
                {totalQuantity} unités en stock
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stock Moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{averageStock}</div>
              <p className="text-xs text-gray-600">
                unités par produit
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertes Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{lowStockCount}</div>
              <p className="text-xs text-gray-600">
                produits en rupture/seuil
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mouvements Récents</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{recentMovements}</div>
              <p className="text-xs text-gray-600">
                cette semaine
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités de gestion des stocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/inventaire')}
              >
                <div className="flex flex-col items-center">
                  <Grid3x3 className="h-6 w-6 mb-2" />
                  <span>Inventaire</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/entrees')}
              >
                <div className="flex flex-col items-center">
                  <ArrowDownToLine className="h-6 w-6 mb-2" />
                  <span>Entrées</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/sorties')}
              >
                <div className="flex flex-col items-center">
                  <ArrowUpFromLine className="h-6 w-6 mb-2" />
                  <span>Sorties</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/alertes')}
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Alertes</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance et Activité */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Mouvements Cette Semaine</CardTitle>
              <CardDescription>Activité récente des stocks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDownToLine className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Entrées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">{recentEntries}</span>
                    <Badge variant="outline" className="border-green-300 text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{recentEntries}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Sorties</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">{recentExits}</span>
                    <Badge variant="outline" className="border-red-300 text-red-600">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -{recentExits}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Solde net</span>
                    <span className={`font-medium ${recentEntries - recentExits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {recentEntries - recentExits >= 0 ? '+' : ''}{recentEntries - recentExits}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Alertes & Notifications</CardTitle>
              <CardDescription>Produits nécessitant une attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock bas/rupture</span>
                  <span className="font-medium text-red-600">{lowStockCount} produits</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mouvements à valider</span>
                  <span className="font-medium text-black">0 en attente</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inventaires planifiés</span>
                  <span className="font-medium text-blue-600">3 ce mois</span>
                </div>

                {lowStockCount > 0 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/stocks/alertes')}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Voir les alertes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation vers autres modules */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Modules Connexes</CardTitle>
            <CardDescription>Accès rapide aux autres sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue')}
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  <span>Catalogue Produits</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/fournisseurs')}
              >
                <div className="flex items-center">
                  <ArrowDownToLine className="h-5 w-5 mr-2" />
                  <span>Commandes Fournisseurs</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/clients')}
              >
                <div className="flex items-center">
                  <ArrowUpFromLine className="h-5 w-5 mr-2" />
                  <span>Commandes Clients</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}