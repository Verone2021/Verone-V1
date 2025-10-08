'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { History, Clock, User, TrendingUp, TrendingDown, RotateCcw, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { formatPrice } from '@/lib/utils'

interface ProductStockHistoryModalProps {
  product: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
  } | null
  isOpen: boolean
  onClose: () => void
}

export function ProductStockHistoryModal({ product, isOpen, onClose }: ProductStockHistoryModalProps) {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { getProductHistory, getReasonDescription } = useStockMovements()

  const loadHistory = useCallback(async () => {
    if (!product?.id) return

    setLoading(true)
    try {
      const history = await getProductHistory(product.id)
      setMovements(history)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setLoading(false)
    }
  }, [product?.id, getProductHistory])

  useEffect(() => {
    if (isOpen && product?.id) {
      loadHistory()
    }
  }, [isOpen, product?.id, loadHistory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Format relatif pour les dates récentes
    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatUserName = (userProfile: any, performedBy?: string) => {
    if (!userProfile && !performedBy) return 'Utilisateur inconnu'

    // Si on a le profil avec les noms
    if (userProfile) {
      const firstName = userProfile.first_name || ''
      const lastName = userProfile.last_name || ''

      if (firstName && lastName) {
        return `${firstName} ${lastName}`
      } else if (firstName) {
        return firstName
      } else if (lastName) {
        return lastName
      }
    }

    // Fallback : afficher un nom générique pour l'utilisateur
    return 'Utilisateur système'
  }

  const getMovementTypeIcon = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUST':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'TRANSFER':
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementTypeBadge = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Entrée</Badge>
      case 'OUT':
        return <Badge variant="destructive">Sortie</Badge>
      case 'ADJUST':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ajustement</Badge>
      case 'TRANSFER':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Transfert</Badge>
      default:
        return <Badge variant="secondary">{movementType}</Badge>
    }
  }

  const getQuantityChangeDisplay = (movement: any) => {
    const { movement_type, quantity_change, quantity_before, quantity_after } = movement

    switch (movement_type) {
      case 'IN':
        return (
          <div className="text-green-600 font-medium">
            +{Math.abs(quantity_change)} unités
            <div className="text-xs text-gray-500">{quantity_before} → {quantity_after}</div>
          </div>
        )
      case 'OUT':
        return (
          <div className="text-red-600 font-medium">
            -{Math.abs(quantity_change)} unités
            <div className="text-xs text-gray-500">{quantity_before} → {quantity_after}</div>
          </div>
        )
      case 'ADJUST':
        return (
          <div className="text-blue-600 font-medium">
            = {quantity_after} unités
            <div className="text-xs text-gray-500">
              {quantity_change > 0 ? '+' : ''}{quantity_change} ({quantity_before} → {quantity_after})
            </div>
          </div>
        )
      default:
        return (
          <div className="font-medium">
            {quantity_change > 0 ? '+' : ''}{quantity_change} unités
            <div className="text-xs text-gray-500">{quantity_before} → {quantity_after}</div>
          </div>
        )
    }
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <History className="h-5 w-5" />
            <div className="flex items-center gap-3">
              {product.primary_image_url && (
                <img
                  src={product.primary_image_url}
                  alt={product.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div>
                <div>Historique des mouvements</div>
                <div className="text-sm font-normal text-gray-600">
                  {product.name} ({product.sku})
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Chargement de l'historique...</span>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">Aucun mouvement de stock</p>
              <p className="text-gray-400 text-sm">Ce produit n'a encore aucun historique de mouvement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {movements.length} mouvement{movements.length > 1 ? 's' : ''} trouvé{movements.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  Du plus récent au plus ancien
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Date / Heure</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {formatDate(movement.performed_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementTypeIcon(movement.movement_type)}
                            {getMovementTypeBadge(movement.movement_type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getQuantityChangeDisplay(movement)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {movement.reason_code ? (
                              <div>
                                <div className="font-medium text-sm">
                                  {getReasonDescription(movement.reason_code)}
                                </div>
                                <div className="text-xs text-gray-500 uppercase">
                                  {movement.reason_code}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Non spécifié</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {formatUserName(movement.user_profiles)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {movement.notes ? (
                            <div className="max-w-[200px] text-sm text-gray-600">
                              {movement.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}