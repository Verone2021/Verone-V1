'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Package,
  TrendingUp,
  ArrowLeftRight,
} from 'lucide-react'
import { ElegantKpiCard } from '@/components/ui/elegant-kpi-card'
import { ActivityTimeline, type TimelineItem } from '@/components/ui/activity-timeline'
import { useCompleteDashboardMetrics } from '@/hooks/use-complete-dashboard-metrics'

export default function DashboardV2Page() {
  const router = useRouter()
  const { metrics, loading, error } = useCompleteDashboardMetrics()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-medium">Erreur de chargement</p>
          <p className="text-slate-600 text-sm">{error || 'Données indisponibles'}</p>
        </div>
      </div>
    )
  }

  // Données mockées pour activité récente (à remplacer par vraies données)
  const recentActivity: TimelineItem[] = [
    {
      id: '1',
      title: 'Nouvelle commande client',
      description: 'CMD-2025-001 - 3 produits',
      timestamp: 'Il y a 5 min',
      icon: ShoppingCart,
      iconColor: 'success',
    },
    {
      id: '2',
      title: 'Alerte stock bas',
      description: 'Produit en stock faible',
      timestamp: 'Il y a 12 min',
      icon: AlertCircle,
      iconColor: 'warning',
    },
    {
      id: '3',
      title: 'Produit ajouté',
      description: 'Nouveau produit catalogue',
      timestamp: 'Il y a 1h',
      icon: Package,
      iconColor: 'primary',
    },
    {
      id: '4',
      title: 'Mouvement stock',
      description: 'Ajustement inventaire',
      timestamp: 'Il y a 2h',
      icon: ArrowLeftRight,
      iconColor: 'neutral',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Dashboard Principal</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* 4 Grandes KPIs */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">KPIs Essentiels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ElegantKpiCard
              label="CA du Mois"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(metrics.orders?.monthRevenue || 0)}
              icon={DollarSign}
              trend={{
                value: 12.5,
                isPositive: true,
              }}
              onClick={() => router.push('/commandes/clients')}
            />

            <ElegantKpiCard
              label="Commandes Ventes"
              value={metrics.orders?.salesOrders || 0}
              icon={ShoppingCart}
              onClick={() => router.push('/commandes/clients')}
            />

            <ElegantKpiCard
              label="Commandes Achats"
              value={metrics.orders?.purchaseOrders || 0}
              icon={TrendingUp}
              onClick={() => router.push('/commandes/fournisseurs')}
            />

            <ElegantKpiCard
              label="Valeur Stock"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(metrics.stocks?.totalValue || 0)}
              icon={Package}
              onClick={() => router.push('/stocks')}
            />
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Produits - VIDE (pas de données mockées) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Top 5 Produits</h3>
              <button
                onClick={() => router.push('/catalogue/produits?sort=best-sellers')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout →
              </button>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">Aucune donnée disponible</p>
                <p className="text-xs text-slate-400">Les produits populaires apparaîtront ici</p>
              </div>
            </div>
          </div>

          {/* Activité Récente */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Activité Récente</h3>
              <button
                onClick={() => router.push('/activite')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout →
              </button>
            </div>
            <ActivityTimeline items={recentActivity} maxItems={4} />
          </div>

          {/* Statut Commandes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Statut Commandes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700">Commandes Ventes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {metrics.orders?.salesOrders || 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {Math.round(
                      ((metrics.orders?.salesOrders || 0) / ((metrics.orders?.salesOrders || 0) + (metrics.orders?.purchaseOrders || 0) || 1)) * 100
                    )}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-slate-700">Commandes Achat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {metrics.orders?.purchaseOrders || 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {Math.round(
                      ((metrics.orders?.purchaseOrders || 0) / ((metrics.orders?.salesOrders || 0) + (metrics.orders?.purchaseOrders || 0) || 1)) * 100
                    )}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-700">CA du Mois</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    }).format(metrics.orders?.monthRevenue || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => router.push('/commandes/clients')}
                  className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Gérer les commandes →
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Notifications</h3>
            <div className="space-y-2">
              {(metrics.stocks?.lowStockItems || 0) > 0 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-900">
                      {metrics.stocks.lowStockItems} alertes stock critiques
                    </p>
                    <button
                      onClick={() => router.push('/stocks?tab=alerts')}
                      className="text-xs text-red-600 hover:text-red-700 underline mt-0.5"
                    >
                      Voir les alertes
                    </button>
                  </div>
                </div>
              )}

              {(metrics.orders?.salesOrders || 0) > 0 && (
                <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                  <ShoppingCart size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-900">
                      {metrics.orders.salesOrders} commandes ventes actives
                    </p>
                    <button
                      onClick={() => router.push('/commandes/clients')}
                      className="text-xs text-green-600 hover:text-green-700 underline mt-0.5"
                    >
                      Voir les commandes
                    </button>
                  </div>
                </div>
              )}

              {(metrics.sourcing?.samplesWaiting || 0) > 0 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <Package size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-900">
                      {metrics.sourcing.samplesWaiting} échantillons en attente
                    </p>
                    <button
                      onClick={() => router.push('/catalogue/sourcing')}
                      className="text-xs text-blue-600 hover:text-blue-700 underline mt-0.5"
                    >
                      Voir échantillons
                    </button>
                  </div>
                </div>
              )}

              {(metrics.stocks?.lowStockItems || 0) === 0 &&
               (metrics.orders?.salesOrders || 0) === 0 &&
               (metrics.sourcing?.samplesWaiting || 0) === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Aucune notification</p>
                    <p className="text-xs text-slate-400">Tout est à jour ! 🎉</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
