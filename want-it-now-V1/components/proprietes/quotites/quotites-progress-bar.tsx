'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ==============================================================================
// TYPES
// ==============================================================================

interface QuotitesProgressBarProps {
  totalPourcentage: number
  statutQuotites: 'vide' | 'partiel' | 'complet' | 'erreur'
  className?: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuotitesProgressBar({
  totalPourcentage,
  statutQuotites,
  className
}: QuotitesProgressBarProps) {
  
  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const getProgressColor = () => {
    switch (statutQuotites) {
      case 'complet':
        return 'bg-green-500'
      case 'erreur':
        return 'bg-red-500'
      case 'partiel':
        return 'bg-[#D4841A]'
      default:
        return 'bg-gray-300'
    }
  }

  const getProgressValue = () => {
    // Limiter à 100% pour l'affichage, même si > 100%
    return Math.min(totalPourcentage, 100)
  }

  const getStatusMessage = () => {
    switch (statutQuotites) {
      case 'complet':
        return 'Quotités complètes (100%)'
      case 'erreur':
        return `Attention : ${totalPourcentage}% > 100%`
      case 'partiel':
        return `${totalPourcentage}% attribués, ${100 - totalPourcentage}% restants`
      default:
        return 'Aucune quotité attribuée'
    }
  }

  const getStatusIcon = () => {
    switch (statutQuotites) {
      case 'complet':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'erreur':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'partiel':
        return <AlertTriangle className="w-4 h-4 text-[#D4841A]" />
      default:
        return null
    }
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Répartition des quotités
          </span>
          <span className={cn(
            "font-semibold",
            statutQuotites === 'complet' ? 'text-green-600' :
            statutQuotites === 'erreur' ? 'text-red-600' :
            statutQuotites === 'partiel' ? 'text-[#D4841A]' :
            'text-gray-500'
          )}>
            {totalPourcentage}%
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={getProgressValue()} 
            className={cn(
              "h-3 bg-gray-200",
              // Styling personnalisé pour chaque état
              statutQuotites === 'complet' && "border border-green-200",
              statutQuotites === 'erreur' && "border border-red-200",
              statutQuotites === 'partiel' && "border border-[#D4841A]/20"
            )}
            style={{
              // Custom progress color via CSS variable
              '--progress-foreground': 
                statutQuotites === 'complet' ? 'rgb(34 197 94)' :
                statutQuotites === 'erreur' ? 'rgb(239 68 68)' :
                statutQuotites === 'partiel' ? '#D4841A' :
                'rgb(156 163 175)'
            } as React.CSSProperties}
          />
          
          {/* 100% Mark */}
          {totalPourcentage !== 100 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
              style={{ left: '100%' }}
            />
          )}
          
          {/* Overflow indicator for > 100% */}
          {totalPourcentage > 100 && (
            <div 
              className="absolute top-0 right-0 bottom-0 bg-red-500/20 border-l-2 border-red-500"
              style={{ 
                width: `${Math.min((totalPourcentage - 100) / totalPourcentage * 100, 20)}%` 
              }}
            />
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className={cn(
        "flex items-center gap-2 text-sm p-3 rounded-lg",
        statutQuotites === 'complet' && "bg-green-50 text-green-800",
        statutQuotites === 'erreur' && "bg-red-50 text-red-800",
        statutQuotites === 'partiel' && "bg-[#D4841A]/5 text-[#D4841A]",
        statutQuotites === 'vide' && "bg-gray-50 text-gray-600"
      )}>
        {getStatusIcon()}
        <span className="font-medium">
          {getStatusMessage()}
        </span>
      </div>

      {/* Business Rule Reminder */}
      {statutQuotites !== 'complet' && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
          <strong>Règle métier :</strong> La somme des quotités de tous les propriétaires doit être exactement égale à 100%.
        </div>
      )}
    </div>
  )
}