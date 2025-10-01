'use client'

import React from 'react'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useRealDashboardMetrics } from '@/hooks/use-real-dashboard-metrics'

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
    refetch
  } = useRealDashboardMetrics()

  // Formatage des métriques pour l'affichage
  const stats = metrics ? [
    {
      title: 'Total Produits',
      value: metrics.products.total.toLocaleString(),
      change: `${metrics.products.trend > 0 ? '+' : ''}${metrics.products.trend}%`,
      isPositive: metrics.products.trend > 0,
      icon: <Package className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Produits Actifs',
      value: metrics.products.active.toLocaleString(),
      change: `Disponibles à la vente`,
      isPositive: metrics.products.active > 0,
      icon: <TrendingUp className="h-6 w-6 text-green-600" />
    },
    {
      title: 'Produits Publiés',
      value: metrics.products.published.toLocaleString(),
      change: `${Math.round((metrics.products.published / metrics.products.total) * 100)}% du catalogue`,
      isPositive: metrics.products.published > 0,
      icon: <Activity className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Collections',
      value: metrics.collections.total.toLocaleString(),
      change: `${metrics.collections.active} actives`,
      isPositive: metrics.collections.active > 0,
      icon: <Package className="h-6 w-6 text-gray-600" />
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
            {/* Bouton de refresh */}
            <button
              onClick={refetch}
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

      {/* Métriques Catalogue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition Produits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Répartition des Produits</h3>
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
                  </div>
                </div>
              ))}
            </div>
          ) : metrics ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Produits Actifs</p>
                  <p className="text-sm text-gray-500">Disponibles à la vente</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{metrics.products.active}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Produits Publiés</p>
                  <p className="text-sm text-gray-500">Disponibles dans le catalogue</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">{metrics.products.published}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Produits Archivés</p>
                  <p className="text-sm text-gray-500">Retirés du catalogue</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-500">{metrics.products.archived}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-black">Groupes de Variantes</p>
                  <p className="text-sm text-gray-500">Produits variantes</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">{metrics.variantGroups.total}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          )}
        </div>

        {/* Métriques Collections */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Collections & Catégories</h3>
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
          ) : metrics ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Collections Totales</p>
                  <p className="text-sm text-gray-500">Tous les groupements</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">{metrics.collections.total}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Collections Actives</p>
                  <p className="text-sm text-gray-500">Visibles sur le site</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{metrics.collections.active}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-black">Groupes de Variantes</p>
                  <p className="text-sm text-gray-500">Produits variantes</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">{metrics.variantGroups.total}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-black">Croissance Catalogue</p>
                  <p className="text-sm text-gray-500">Derniers 7 jours</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${metrics.products.trend > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {metrics.products.trend > 0 ? '+' : ''}{metrics.products.trend}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </div>
    </div>
  )
}