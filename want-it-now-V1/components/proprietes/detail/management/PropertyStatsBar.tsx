'use client'

import { Card } from '@/components/ui/card'
import { 
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Euro,
  Calendar,
  Home,
  Percent,
  CheckCircle,
  Clock,
  BarChart3,
  PiggyBank
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface PropertyStatsBarProps {
  property: ProprieteListItem
  className?: string
}

interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  color?: 'copper' | 'green' | 'blue' | 'purple' | 'gray'
}

export function PropertyStatsBar({ 
  property, 
  className 
}: PropertyStatsBarProps) {
  
  // Calculate key metrics
  const occupancyRate = property.taux_occupation || 0
  const monthlyIncome = property.loyer_mensuel || 0
  const yearlyIncome = monthlyIncome * 12
  const acquisitionPrice = property.prix_acquisition || 0
  const currentValue = property.valeur_actuelle || acquisitionPrice
  const valueAppreciation = acquisitionPrice > 0 
    ? ((currentValue - acquisitionPrice) / acquisitionPrice) * 100 
    : 0
  
  // Calculate ROI if we have the data
  const annualROI = acquisitionPrice > 0 && yearlyIncome > 0
    ? (yearlyIncome / acquisitionPrice) * 100
    : 0

  // Calculate net yield
  const monthlyExpenses = property.charges_mensuelles || 0
  const netMonthlyIncome = monthlyIncome - monthlyExpenses
  const netAnnualYield = acquisitionPrice > 0 && netMonthlyIncome > 0
    ? ((netMonthlyIncome * 12) / acquisitionPrice) * 100
    : 0

  const stats: StatCard[] = [
    {
      label: 'Valeur actuelle',
      value: formatCurrency(currentValue),
      icon: <PiggyBank className="w-5 h-5" />,
      trend: valueAppreciation,
      trendLabel: valueAppreciation > 0 ? `+${valueAppreciation.toFixed(1)}%` : `${valueAppreciation.toFixed(1)}%`,
      color: 'copper'
    },
    {
      label: 'Revenus mensuels',
      value: formatCurrency(monthlyIncome),
      icon: <Euro className="w-5 h-5" />,
      color: 'green'
    },
    {
      label: 'Taux d\'occupation',
      value: `${occupancyRate}%`,
      icon: <BarChart3 className="w-5 h-5" />,
      trend: occupancyRate >= 75 ? 1 : occupancyRate >= 50 ? 0 : -1,
      trendLabel: occupancyRate >= 75 ? 'Excellent' : occupancyRate >= 50 ? 'Bon' : 'À améliorer',
      color: 'blue'
    },
    {
      label: property.a_unites ? 'Unités' : 'Capacité',
      value: property.a_unites 
        ? `${property.unites_louees || 0}/${property.unites_count || 0}` 
        : `${property.capacite_max || 0} pers.`,
      icon: property.a_unites ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />,
      color: 'purple'
    },
    {
      label: 'Rendement net',
      value: `${netAnnualYield.toFixed(1)}%`,
      icon: <Percent className="w-5 h-5" />,
      trend: netAnnualYield >= 5 ? 1 : netAnnualYield >= 3 ? 0 : -1,
      trendLabel: netAnnualYield >= 5 ? 'Excellent' : netAnnualYield >= 3 ? 'Correct' : 'Faible',
      color: 'green'
    },
    {
      label: 'ROI annuel',
      value: `${annualROI.toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: annualROI >= 8 ? 1 : annualROI >= 5 ? 0 : -1,
      color: 'copper'
    }
  ]

  const getColorClasses = (color?: string, isBackground = false) => {
    if (isBackground) {
      switch (color) {
        case 'copper': return 'bg-brand-copper/10 border-brand-copper/20'
        case 'green': return 'bg-brand-green/10 border-brand-green/20'
        case 'blue': return 'bg-blue-50 border-blue-200'
        case 'purple': return 'bg-purple-50 border-purple-200'
        default: return 'bg-gray-50 border-gray-200'
      }
    } else {
      switch (color) {
        case 'copper': return 'text-brand-copper'
        case 'green': return 'text-brand-green'
        case 'blue': return 'text-blue-600'
        case 'purple': return 'text-purple-600'
        default: return 'text-gray-600'
      }
    }
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className={cn(
            "p-4 border transition-all hover:shadow-md",
            getColorClasses(stat.color, true)
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={getColorClasses(stat.color)}>
                {stat.icon}
              </div>
              {stat.trend !== undefined && (
                <div className="flex items-center gap-1">
                  {stat.trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : stat.trend < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-yellow-500" />
                  )}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-xs text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className={cn(
                "text-lg font-bold",
                getColorClasses(stat.color)
              )}>
                {stat.value}
              </p>
              {stat.trendLabel && (
                <p className={cn(
                  "text-xs mt-1",
                  stat.trend && stat.trend > 0 ? 'text-green-600' : 
                  stat.trend && stat.trend < 0 ? 'text-red-600' : 
                  'text-yellow-600'
                )}>
                  {stat.trendLabel}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Compact version for smaller displays
export function PropertyStatsBarCompact({ 
  property, 
  className 
}: PropertyStatsBarProps) {
  const monthlyIncome = property.loyer_mensuel || 0
  const currentValue = property.valeur_actuelle || property.prix_acquisition || 0
  const occupancyRate = property.taux_occupation || 0

  const compactStats = [
    {
      label: 'Valeur',
      value: formatCurrency(currentValue),
      icon: <Euro className="w-4 h-4" />
    },
    {
      label: 'Revenus/mois',
      value: formatCurrency(monthlyIncome),
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: 'Occupation',
      value: `${occupancyRate}%`,
      icon: <BarChart3 className="w-4 h-4" />
    }
  ]

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {compactStats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="text-brand-copper">
            {stat.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-sm font-semibold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}