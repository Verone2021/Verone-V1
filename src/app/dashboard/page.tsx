'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Package,
  TrendingUp,
  Search,
  ArrowLeftRight,
  BarChart3,
  Plus,
  FileText,
} from 'lucide-react'
import { CompactKpiCard } from '@/components/ui-v2/compact-kpi-card'
import { ActionButton } from '@/components/ui-v2/action-button'
import { ActivityTimeline, type TimelineItem } from '@/components/ui-v2/activity-timeline'
import { StatPill } from '@/components/ui-v2/stat-pill'
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
      description: 'Canapé Velours Bleu - Stock: 2',
      timestamp: 'Il y a 12 min',
      icon: AlertCircle,
      iconColor: 'warning',
    },
    {
      id: '3',
      title: 'Produit ajouté',
      description: 'Lampe Designer Pro',
      timestamp: 'Il y a 1h',
      icon: Package,
      iconColor: 'primary',
    },
    {
      id: '4',
      title: 'Mouvement stock',
      description: 'Ajustement inventaire +15 unités',
      timestamp: 'Il y a 2h',
      icon: ArrowLeftRight,
      iconColor: 'neutral',
    },
    {
      id: '5',
      title: 'Sourcing rapide',
      description: '3 nouveaux fournisseurs évalués',
      timestamp: 'Il y a 3h',
      icon: Search,
      iconColor: 'accent',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Compact */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard Vérone</h1>
            <p className="text-sm text-slate-600">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Retour ancien dashboard
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Zone 2: KPIs Ultra-Compacts */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">KPIs Essentiels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <CompactKpiCard
              label="CA du Mois"
              value={new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(metrics.orders?.monthRevenue || 0)}
              icon={DollarSign}
              color="success"
              trend={{
                value: 12.5,
                isPositive: true,
              }}
              sparklineData={[45000, 47000, 51000, 48000, 52000, 55000, metrics.orders?.monthRevenue || 50000]}
              onClick={() => router.push('/commandes/clients')}
            />

            <CompactKpiCard
              label="Commandes Ventes"
              value={metrics.orders?.salesOrders || 0}
              icon={ShoppingCart}
              color="primary"
              onClick={() => router.push('/commandes/clients')}
            />

            <CompactKpiCard
              label="Alertes Stock"
              value={metrics.stocks?.lowStockItems || 0}
              icon={AlertCircle}
              color={(metrics.stocks?.lowStockItems || 0) > 0 ? 'danger' : 'success'}
              onClick={() => router.push('/stocks?tab=alerts')}
            />

            <CompactKpiCard
              label="Produits Actifs"
              value={metrics.catalogue?.activeProducts || 0}
              icon={Package}
              color="accent"
              onClick={() => router.push('/catalogue/produits?status=active')}
            />

            <CompactKpiCard
              label="Commandes Achat"
              value={metrics.orders?.purchaseOrders || 0}
              icon={TrendingUp}
              color="warning"
              onClick={() => router.push('/commandes/fournisseurs')}
            />
          </div>
        </div>

        {/* Zone 3: Actions Rapides */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Actions Rapides</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <ActionButton
              label="Nouvelle Commande"
              icon={Plus}
              gradient="blue"
              onClick={() => router.push('/commandes/clients?action=create')}
            />
            <ActionButton
              label="Ajuster Stock"
              icon={ArrowLeftRight}
              gradient="orange"
              onClick={() => router.push('/stocks/mouvements?action=quick')}
            />
            <ActionButton
              label="Sourcing Rapide"
              icon={Search}
              gradient="purple"
              onClick={() => router.push('/catalogue/sourcing/rapide')}
            />
            <ActionButton
              label="Rapport Ventes"
              icon={BarChart3}
              gradient="green"
              onClick={() => router.push('/commandes/clients')}
            />
            <ActionButton
              label="Nouveau Produit"
              icon={Package}
              gradient="blueGreen"
              onClick={() => router.push('/catalogue/produits?action=create')}
            />
            <ActionButton
              label="Alertes"
              icon={AlertCircle}
              gradient="orangeRed"
              onClick={() => router.push('/stocks?tab=alerts')}
            />
          </div>
        </div>

        {/* Zone 4: Widgets Actionnables (Grid 2x2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <ActivityTimeline items={recentActivity} maxItems={5} />
          </div>

          {/* Top 5 Produits */}
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
            <div className="space-y-3">
              {[
                { name: 'Canapé Velours Bleu', sales: 45, stock: 12, trend: 15 },
                { name: 'Lampe Designer Pro', sales: 38, stock: 8, trend: 8 },
                { name: 'Table Basse Marbre', sales: 32, stock: 5, trend: -3 },
                { name: 'Chaise Scandinave', sales: 28, stock: 24, trend: 12 },
                { name: 'Miroir Art Déco', sales: 22, stock: 15, trend: 5 },
              ].map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-slate-900 truncate">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatPill label="ventes" value={product.sales} variant="primary" size="sm" />
                    <StatPill
                      label="stock"
                      value={product.stock}
                      variant={product.stock < 10 ? 'danger' : 'success'}
                      size="sm"
                    />
                    <span
                      className={`text-xs font-medium ${
                        product.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.trend >= 0 ? '+' : ''}{product.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
