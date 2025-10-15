'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Activity, Users, Clock, BarChart3 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MovementsStats } from '@/hooks/use-movements-history'

interface MovementsStatsCardsProps {
  stats: MovementsStats | null
  loading: boolean
}

export function MovementsStatsCards({ stats, loading }: MovementsStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const getPercentageChange = (current: number, total: number) => {
    if (total === 0) return 0
    return Math.round((current / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalMovements)}</div>
            <p className="text-xs text-gray-500">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.movementsToday)}</div>
            <p className="text-xs text-gray-500">
              {getPercentageChange(stats.movementsToday, stats.movementsThisMonth)}% du mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.movementsThisWeek)}</div>
            <p className="text-xs text-gray-500">
              {getPercentageChange(stats.movementsThisWeek, stats.movementsThisMonth)}% du mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.movementsThisMonth)}</div>
            <p className="text-xs text-gray-500">
              Mouvements du mois en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Entrées
                </Badge>
              </div>
              <span className="font-medium">{formatNumber(stats.byType.IN)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  Sorties
                </Badge>
              </div>
              <span className="font-medium">{formatNumber(stats.byType.OUT)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Ajustements
                </Badge>
              </div>
              <span className="font-medium">{formatNumber(stats.byType.ADJUST)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  Transferts
                </Badge>
              </div>
              <span className="font-medium">{formatNumber(stats.byType.TRANSFER)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5" />
              Motifs Fréquents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topReasons.length > 0 ? (
              stats.topReasons.map((reason, index) => (
                <div key={reason.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{reason.description}</span>
                  </div>
                  <span className="font-medium">{formatNumber(reason.count)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Utilisateurs Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topUsers.length > 0 ? (
              stats.topUsers.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{user.user_name}</span>
                  </div>
                  <span className="font-medium">{formatNumber(user.count)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}