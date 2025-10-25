'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, TrendingDown, Package, Clock } from 'lucide-react'

interface StockDisplayProps {
  stock_real: number
  stock_forecasted_in?: number
  stock_forecasted_out?: number
  stock_available?: number
  min_stock?: number
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StockDisplay({
  stock_real,
  stock_forecasted_in = 0,
  stock_forecasted_out = 0,
  stock_available,
  min_stock = 5,
  showDetails = false,
  size = 'md'
}: StockDisplayProps) {
  const available = stock_available ?? (stock_real - stock_forecasted_out)

  // Déterminer le statut du stock
  const getStockStatus = () => {
    if (stock_real <= 0) return 'critical'
    if (stock_real <= min_stock) return 'low'
    if (available <= min_stock) return 'forecasted_low'
    return 'normal'
  }

  const status = getStockStatus()

  // Styles selon la taille
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Couleurs selon le statut
  const statusConfig = {
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      label: 'Épuisé',
      badgeVariant: 'destructive' as const
    },
    low: {
      color: 'text-white',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: AlertTriangle,
      label: 'Stock faible',
      badgeVariant: 'secondary' as const
    },
    forecasted_low: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Clock,
      label: 'Prévision faible',
      badgeVariant: 'outline' as const
    },
    normal: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Package,
      label: 'Normal',
      badgeVariant: 'default' as const
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  if (!showDetails) {
    // Affichage compact
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
          <Icon className="h-3 w-3 mr-1" />
          {stock_real}
        </Badge>
        {(stock_forecasted_in > 0 || stock_forecasted_out > 0) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {stock_forecasted_in > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                +{stock_forecasted_in}
              </span>
            )}
            {stock_forecasted_out > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" />
                -{stock_forecasted_out}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Affichage détaillé
  const stockLevel = Math.min((stock_real / (min_stock * 2)) * 100, 100)

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className={`font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <Badge variant={config.badgeVariant}>
          {stock_real} unités
        </Badge>
      </div>

      {/* Barre de progression du stock */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Niveau de stock</span>
          <span>Seuil: {min_stock}</span>
        </div>
        <Progress
          value={stockLevel}
          className="h-2"
          // Couleur de la barre selon le statut
        />
      </div>

      {/* Détails stock réel/prévisionnel */}
      <div className="space-y-2">
        {/* Stock réel */}
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Stock physique
          </span>
          <span className="font-medium">{stock_real}</span>
        </div>

        {/* Prévisions entrées */}
        {stock_forecasted_in > 0 && (
          <div className="flex justify-between items-center text-sm text-green-600">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Entrées prévues
            </span>
            <span className="font-medium">+{stock_forecasted_in}</span>
          </div>
        )}

        {/* Prévisions sorties */}
        {stock_forecasted_out > 0 && (
          <div className="flex justify-between items-center text-sm text-red-600">
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Sorties prévues
            </span>
            <span className="font-medium">-{stock_forecasted_out}</span>
          </div>
        )}

        {/* Stock disponible calculé */}
        {(stock_forecasted_in > 0 || stock_forecasted_out > 0) && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Stock disponible
              </span>
              <span className={available <= min_stock ? 'text-white' : 'text-green-600'}>
                {available}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alertes */}
      {status !== 'normal' && (
        <div className="mt-3 p-2 rounded bg-white/50 border border-white/20">
          <div className={`text-xs ${config.color}`}>
            {status === 'critical' && 'Stock épuisé - Réapprovisionnement urgent'}
            {status === 'low' && `Stock sous le seuil minimum (${min_stock} unités)`}
            {status === 'forecasted_low' && 'Stock disponible faible avec les prévisions'}
          </div>
        </div>
      )}
    </div>
  )
}

interface StockSummaryCardProps {
  title: string
  value: number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ElementType
  color?: 'blue' | 'green' | 'red' | 'orange'
}

export function StockSummaryCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = 'blue'
}: StockSummaryCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)} vs hier
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 ${colorClasses[color].split(' ')[0]}`} />
      </div>
    </div>
  )
}