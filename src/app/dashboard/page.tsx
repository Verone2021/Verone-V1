'use client'

import React, { useEffect } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics'

interface StatCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, change, isPositive, icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-12 w-12 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
          <div className="flex items-center mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ml-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
          </div>
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const {
    metrics,
    isLoading,
    error,
    lastUpdated,
    performanceMetrics,
    refresh,
    subscribeToRealtime
  } = useDashboardMetrics()

  // Abonnement aux mises à jour temps réel
  useEffect(() => {
    const unsubscribe = subscribeToRealtime()
    return () => unsubscribe()
  }, [])

  // Formatage des métriques pour l'affichage
  const stats = metrics ? [
    {
      title: 'Commandes en cours',
      value: metrics.orders.pending.toString(),
      change: `${metrics.orders.trend > 0 ? '+' : ''}${metrics.orders.trend}%`,
      isPositive: metrics.orders.trend > 0,
      icon: <ShoppingCart className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Produits en stock',
      value: metrics.stock.inStock.toLocaleString(),
      change: `${(metrics.products.trend || 0) > 0 ? '+' : ''}${metrics.products.trend || 0}%`,
      isPositive: (metrics.products.trend || 0) > 0,
      icon: <Package className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Clients actifs',
      value: metrics.users.active.toString(),
      change: `${metrics.users.trend > 0 ? '+' : ''}${metrics.users.trend}%`,
      isPositive: metrics.users.trend > 0,
      icon: <Users className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Activité du jour',
      value: metrics.activity.today.toString(),
      change: `${metrics.activity.trend > 0 ? '+' : ''}${metrics.activity.trend}%`,
      isPositive: metrics.activity.trend > 0,
      icon: <Activity className="h-6 w-6 text-gray-600" />
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Page header avec indicateurs de performance */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Dashboard</h1>
              <p className="text-gray-600">Vue d&apos;ensemble de votre activité Vérone</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Indicateur de performance */}
            {performanceMetrics && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{performanceMetrics.loadTime}ms</span>
                {performanceMetrics.loadTime > 2000 && (
                  <AlertTriangle className="h-4 w-4 text-black" />
                )}
              </div>
            )}

            {/* Dernière mise à jour */}
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Mis à jour: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}

            {/* Bouton de refresh */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p className="mt-1 text-sm text-red-700">
                Impossible de charger les métriques. Veuillez réessayer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Skeleton loading pour les cartes
          Array.from({ length: 4 }).map((_, index) => (
            <StatCard
              key={index}
              title=""
              value=""
              change=""
              isPositive={false}
              icon={null}
              isLoading={true}
            />
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard key={index} {...stat} isLoading={false} />
          ))
        )}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes récentes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Commandes récentes</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : metrics?.orders?.recentOrders && metrics.orders.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {metrics.orders.recentOrders.slice(0, 4).map((order, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-black">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-black">{order.amount.toFixed(2)}€</p>
                    <p className="text-sm text-gray-500">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune commande récente</p>
          )}
        </div>

        {/* Alertes stock */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Alertes stock</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : metrics?.stock?.alerts && metrics.stock.alerts.length > 0 ? (
            <div className="space-y-3">
              {metrics.stock.alerts.slice(0, 4).map((alert, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-black">{alert.name}</p>
                    <p className="text-sm text-gray-500">{alert.stock} en stock</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.status === 'rupture'
                      ? 'bg-red-100 text-red-800'
                      : alert.status === 'critique'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-black'
                  }`}>
                    {alert.status === 'rupture' ? 'Rupture' :
                     alert.status === 'critique' ? 'Critique' : 'Faible'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune alerte de stock</p>
          )}
        </div>
      </div>
    </div>
  )
}