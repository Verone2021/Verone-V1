"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ButtonV2 } from '@/components/ui/button'
import { Info, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  ProductStatus,
  ManualStatus,
  AutomaticStatus,
  MANUAL_ONLY_STATUSES,
  AUTOMATIC_STATUSES,
  formatStatusForDisplay,
  calculateAutomaticStatus,
  getStatusExplanation,
  isManualStatus,
  isAutomaticStatus
} from '@/lib/product-status-utils'

interface ProductStatusSelectorProps {
  currentStatus: ProductStatus
  stockReal: number
  stockForecastedIn: number
  onStatusChange: (newStatus: ProductStatus) => void
  disabled?: boolean
  showExplanation?: boolean
}

export function ProductStatusSelector({
  currentStatus,
  stockReal,
  stockForecastedIn,
  onStatusChange,
  disabled = false,
  showExplanation = true
}: ProductStatusSelectorProps) {
  const [isChanging, setIsChanging] = useState(false)

  // Calculer le statut automatique basé sur le stock
  const calculatedAutomaticStatus = calculateAutomaticStatus({
    stock_real: stockReal,
    stock_forecasted_in: stockForecastedIn
  })

  // Vérifier si le statut actuel est incohérent avec le stock
  const isInconsistent = isAutomaticStatus(currentStatus) &&
                          currentStatus !== calculatedAutomaticStatus

  // Configuration d'affichage du statut actuel
  const statusDisplay = formatStatusForDisplay(currentStatus)

  // Gérer le changement de statut
  const handleStatusChange = (newStatus: string) => {
    setIsChanging(true)
    try {
      onStatusChange(newStatus as ProductStatus)
    } finally {
      setIsChanging(false)
    }
  }

  // Forcer recalcul automatique
  const handleForceRecalculation = () => {
    handleStatusChange(calculatedAutomaticStatus)
  }

  return (
    <div className="space-y-3">
      {/* Statut actuel avec badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Statut produit:</span>
          <Badge variant={statusDisplay.variant} className={statusDisplay.color}>
            {statusDisplay.label}
          </Badge>
          {isManualStatus(currentStatus) && (
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              Manuel
            </Badge>
          )}
        </div>

        {isInconsistent && (
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleForceRecalculation}
            disabled={disabled || isChanging}
            className="text-black border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isChanging ? 'animate-spin' : ''}`} />
            Recalculer
          </ButtonV2>
        )}
      </div>

      {/* Sélecteur de statut (seulement statuts manuels) */}
      {!disabled && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Modifier le statut (statuts manuels uniquement):
          </label>
          <Select
            value={isManualStatus(currentStatus) ? currentStatus : ""}
            onValueChange={handleStatusChange}
            disabled={isChanging}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un statut manuel..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preorder">
                📋 Précommande
              </SelectItem>
              <SelectItem value="discontinued">
                🚫 Produit arrêté
              </SelectItem>
              <SelectItem value="sourcing">
                🔍 En cours de sourcing
              </SelectItem>
              <SelectItem value="pret_a_commander">
                ✅ Prêt à commander
              </SelectItem>
              <SelectItem value="echantillon_a_commander">
                🧪 Échantillon à commander
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Les statuts automatiques (En stock, Rupture, Bientôt disponible) sont calculés selon les niveaux de stock.
          </p>
        </div>
      )}

      {/* Explications et alertes */}
      {showExplanation && (
        <div className="space-y-2">
          {/* Statut incohérent */}
          {isInconsistent && (
            <Alert className="border-gray-200 bg-gray-50">
              <AlertTriangle className="h-4 w-4 text-black" />
              <AlertDescription className="text-gray-900">
                <strong>Statut incohérent:</strong> Avec stock_real={stockReal} et stock_forecasted_in={stockForecastedIn},
                le statut devrait être "{formatStatusForDisplay(calculatedAutomaticStatus).label}".
              </AlertDescription>
            </Alert>
          )}

          {/* Explication du statut automatique calculé */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Statut automatique calculé:</strong> {getStatusExplanation(calculatedAutomaticStatus, {
                stock_real: stockReal,
                stock_forecasted_in: stockForecastedIn
              })}
            </AlertDescription>
          </Alert>

          {/* Guide des statuts */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Guide des statuts Vérone:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Automatiques:</strong> En stock, Rupture de stock, Bientôt disponible</div>
              <div><strong>Manuels:</strong> Précommande, Produit arrêté, En cours de sourcing, Prêt à commander, Échantillon à commander</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}