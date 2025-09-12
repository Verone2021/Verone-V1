'use client'

import { useMemo } from 'react'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { type Proprietaire } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ProprietairesStatsProps {
  proprietaires: Proprietaire[]
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showTrends?: boolean
  previousData?: Proprietaire[]
}

interface StatCard {
  title: string
  value: number
  percentage?: number
  icon: React.ReactNode
  color: string
  bgColor: string
  description?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ProprietairesStats({
  proprietaires,
  className = "",
  variant = 'default',
  showTrends = false,
  previousData = [],
}: ProprietairesStatsProps) {

  // ==============================================================================
  // CALCULATIONS
  // ==============================================================================

  const stats = useMemo(() => {
    const total = proprietaires.length
    const physiques = proprietaires.filter(p => p.type === 'physique').length
    const morales = proprietaires.filter(p => p.type === 'morale').length
    const actifs = proprietaires.filter(p => p.is_active).length
    const inactifs = total - actifs
    const brouillons = proprietaires.filter(p => p.is_brouillon).length
    const complets = proprietaires.filter(p => !p.is_brouillon).length
    const invalides = proprietaires.filter(p => {
      // Simple validation - can be enhanced based on business rules
      const baseValid = p.nom && p.email
      if (p.type === 'physique') {
        return !baseValid || !p.prenom
      } else {
        return !baseValid || !p.forme_juridique
      }
    }).length

    // Calculate trends if previous data is available
    const trends = showTrends && previousData.length > 0 ? {
      total: total - previousData.length,
      physiques: physiques - previousData.filter(p => p.type === 'physique').length,
      morales: morales - previousData.filter(p => p.type === 'morale').length,
      actifs: actifs - previousData.filter(p => p.is_active).length,
      brouillons: brouillons - previousData.filter(p => p.is_brouillon).length,
    } : null

    return {
      total,
      physiques,
      morales,
      actifs,
      inactifs,
      brouillons,
      complets,
      invalides,
      trends,
      percentages: {
        physiques: total > 0 ? (physiques / total) * 100 : 0,
        morales: total > 0 ? (morales / total) * 100 : 0,
        actifs: total > 0 ? (actifs / total) * 100 : 0,
        brouillons: total > 0 ? (brouillons / total) * 100 : 0,
        complets: total > 0 ? (complets / total) * 100 : 0,
      }
    }
  }, [proprietaires, showTrends, previousData])

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const formatTrend = (value: number) => {
    if (value === 0) return null
    const isPositive = value > 0
    return (
      <div className={`flex items-center space-x-1 ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span className="text-xs">
          {isPositive ? '+' : ''}{value}
        </span>
      </div>
    )
  }

  const renderStatCard = (stat: StatCard) => {
    const isCompact = variant === 'compact'
    
    return (
      <Card key={stat.title} className={`${stat.bgColor} border-0`}>
        <CardContent className={`${isCompact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {stat.icon}
                <p className={`${stat.color} font-medium ${isCompact ? 'text-sm' : 'text-base'}`}>
                  {stat.title}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <p className={`font-bold ${stat.color} ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                  {stat.value.toLocaleString()}
                </p>
                
                {stat.percentage !== undefined && (
                  <Badge variant="outline" className={`${stat.color} text-xs`}>
                    {stat.percentage.toFixed(1)}%
                  </Badge>
                )}
                
                {stat.trend && stat.trendValue !== undefined && formatTrend(stat.trendValue)}
              </div>
              
              {stat.description && !isCompact && (
                <p className={`text-xs mt-1 ${stat.color} opacity-75`}>
                  {stat.description}
                </p>
              )}
            </div>
          </div>
          
          {stat.percentage !== undefined && variant === 'detailed' && (
            <div className="mt-3">
              <Progress 
                value={stat.percentage} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const getStatCards = (): StatCard[] => {
    const cards: StatCard[] = [
      {
        title: 'Total',
        value: stats.total,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Propriétaires enregistrés',
        trend: stats.trends?.total ? (stats.trends.total > 0 ? 'up' : 'down') : 'stable',
        trendValue: stats.trends?.total || 0,
      },
      {
        title: 'Personnes physiques',
        value: stats.physiques,
        percentage: stats.percentages.physiques,
        icon: <Users className="h-5 w-5 text-green-600" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Particuliers',
        trend: stats.trends?.physiques ? (stats.trends.physiques > 0 ? 'up' : 'down') : 'stable',
        trendValue: stats.trends?.physiques || 0,
      },
      {
        title: 'Personnes morales',
        value: stats.morales,
        percentage: stats.percentages.morales,
        icon: <Building2 className="h-5 w-5 text-purple-600" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Entreprises et sociétés',
        trend: stats.trends?.morales ? (stats.trends.morales > 0 ? 'up' : 'down') : 'stable',
        trendValue: stats.trends?.morales || 0,
      },
      {
        title: 'Actifs',
        value: stats.actifs,
        percentage: stats.percentages.actifs,
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        description: 'Propriétaires actifs',
        trend: stats.trends?.actifs ? (stats.trends.actifs > 0 ? 'up' : 'down') : 'stable',
        trendValue: stats.trends?.actifs || 0,
      },
    ]

    // Add conditional cards based on variant
    if (variant === 'detailed') {
      cards.push(
        {
          title: 'Brouillons',
          value: stats.brouillons,
          percentage: stats.percentages.brouillons,
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          description: 'En cours de finalisation',
          trend: stats.trends?.brouillons ? (stats.trends.brouillons > 0 ? 'up' : 'down') : 'stable',
          trendValue: stats.trends?.brouillons || 0,
        },
        {
          title: 'Inactifs',
          value: stats.inactifs,
          percentage: 100 - stats.percentages.actifs,
          icon: <Archive className="h-5 w-5 text-gray-600" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'Propriétaires désactivés',
        }
      )
      
      if (stats.invalides > 0) {
        cards.push({
          title: 'Invalides',
          value: stats.invalides,
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Informations incomplètes',
        })
      }
    }

    return cards
  }

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  if (stats.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun propriétaire
          </h3>
          <p className="text-gray-500">
            Commencez par ajouter votre premier propriétaire.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statCards = getStatCards()
  const gridCols = variant === 'compact' ? 'grid-cols-2 lg:grid-cols-4' : 
                  variant === 'detailed' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main stats grid */}
      <div className={`grid gap-4 ${gridCols}`}>
        {statCards.map(renderStatCard)}
      </div>

      {/* Detailed breakdown */}
      {variant === 'detailed' && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Type distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Personnes physiques</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{stats.physiques}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.percentages.physiques.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stats.percentages.physiques} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Personnes morales</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{stats.morales}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.percentages.morales.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stats.percentages.morales} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Status distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">État de completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">Complets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{stats.complets}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.percentages.complets.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stats.percentages.complets} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Brouillons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{stats.brouillons}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.percentages.brouillons.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stats.percentages.brouillons} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// EXPORT VARIANTS
// ==============================================================================

export function ProprietairesStatsCompact(props: Omit<ProprietairesStatsProps, 'variant'>) {
  return <ProprietairesStats {...props} variant="compact" />
}

export function ProprietairesStatsDetailed(props: Omit<ProprietairesStatsProps, 'variant'>) {
  return <ProprietairesStats {...props} variant="detailed" />
}