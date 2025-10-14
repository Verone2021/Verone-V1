'use client'

import React, { useState } from 'react'
import { X, AlertTriangle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MovementWithDetails } from '@/hooks/use-movements-history'
import { useToast } from '@/hooks/use-toast'

interface CancelMovementModalProps {
  movement: MovementWithDetails | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CancelMovementModal({ movement, isOpen, onClose, onSuccess }: CancelMovementModalProps) {
  const [cancelling, setCancelling] = useState(false)
  const { toast } = useToast()

  if (!movement) return null

  const getMovementTypeIcon = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      case 'ADJUST':
        return <RotateCcw className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  const getMovementTypeLabel = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return 'Entrée de stock'
      case 'OUT':
        return 'Sortie de stock'
      case 'ADJUST':
        return 'Ajustement'
      default:
        return movementType
    }
  }

  const handleCancel = async () => {
    setCancelling(true)

    try {
      const response = await fetch(`/api/stock-movements/${movement.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      toast({
        title: "Mouvement annulé",
        description: `Le mouvement a été annulé avec succès. Le stock et les alertes ont été mis à jour automatiquement.`,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || 'Impossible d\'annuler le mouvement',
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Annuler ce mouvement ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avertissement */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900 mb-1">
                  Attention : Cette action est irréversible
                </p>
                <p className="text-orange-700">
                  L'annulation de ce mouvement va automatiquement :
                </p>
                <ul className="mt-2 space-y-1 text-orange-700">
                  <li>• Recalculer le stock du produit</li>
                  <li>• Mettre à jour les alertes de stock</li>
                  <li>• Supprimer définitivement ce mouvement de l'historique</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Détails du mouvement */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-500">Détails du mouvement à annuler :</h3>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <div className="flex items-center gap-2">
                  {getMovementTypeIcon(movement.movement_type)}
                  <span className="font-medium">{getMovementTypeLabel(movement.movement_type)}</span>
                </div>
              </div>

              {/* Produit */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Produit</span>
                <span className="font-medium text-right max-w-[200px] truncate">
                  {movement.product_name}
                </span>
              </div>

              {/* Quantité */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantité</span>
                <div className="text-right">
                  <div className={`font-bold ${
                    movement.quantity_change > 0 ? 'text-green-600' :
                    movement.quantity_change < 0 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} unités
                  </div>
                  <div className="text-xs text-gray-500">
                    {movement.quantity_before} → {movement.quantity_after}
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date</span>
                <span className="text-sm font-medium">{formatDate(movement.performed_at)}</span>
              </div>

              {/* Utilisateur */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Effectué par</span>
                <span className="text-sm font-medium">{movement.user_name || 'Inconnu'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelling}
            className="border-black text-black hover:bg-gray-100"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700"
          >
            {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
