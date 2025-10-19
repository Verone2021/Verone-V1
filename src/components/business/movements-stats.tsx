'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Activity, Clock, BarChart3 } from 'lucide-react'
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
    <div className="space-y-4">
      {/* Métriques principales - Compactes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-[60px] border-black rounded-[10px] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center justify-between">
              Total Mouvements
              <Activity className="h-3 w-3 text-gray-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-1 px-4">
            <div className="text-md font-bold text-black">{formatNumber(stats.totalMovements)}</div>
          </CardContent>
        </Card>

        <Card className="h-[60px] border-black rounded-[10px] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center justify-between">
              Aujourd'hui
              <Clock className="h-3 w-3 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-1 px-4">
            <div className="text-md font-bold text-black">{formatNumber(stats.movementsToday)}</div>
          </CardContent>
        </Card>

        <Card className="h-[60px] border-black rounded-[10px] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center justify-between">
              Cette Semaine
              <TrendingUp className="h-3 w-3 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-1 px-4">
            <div className="text-md font-bold text-black">{formatNumber(stats.movementsThisWeek)}</div>
          </CardContent>
        </Card>

        <Card className="h-[60px] border-black rounded-[10px] shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center justify-between">
              Ce Mois
              <BarChart3 className="h-3 w-3 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-1 px-4">
            <div className="text-md font-bold text-black">{formatNumber(stats.movementsThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type - Layout horizontal */}
      <Card className="border-black rounded-[10px] shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-black">
            <BarChart3 className="h-4 w-4" />
            Répartition par Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Entrées
              </Badge>
              <span className="font-medium text-black">{formatNumber(stats.byType.IN)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                Sorties
              </Badge>
              <span className="font-medium text-black">{formatNumber(stats.byType.OUT)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Ajustements
              </Badge>
              <span className="font-medium text-black">{formatNumber(stats.byType.ADJUST)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                Transferts
              </Badge>
              <span className="font-medium text-black">{formatNumber(stats.byType.TRANSFER)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}