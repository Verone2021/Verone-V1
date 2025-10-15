'use client'

import React from 'react'
import Link from 'next/link'
import { Clock, Package, TrendingUp, TrendingDown, RotateCcw, FileText, Settings, ShoppingCart, ExternalLink, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MovementWithDetails } from '@/hooks/use-movements-history'

interface MovementsTableProps {
  movements: MovementWithDetails[]
  loading: boolean
  onMovementClick?: (movement: MovementWithDetails) => void
  onCancelClick?: (movement: MovementWithDetails) => void
  onOrderClick?: (orderId: string, orderType: 'sales' | 'purchase') => void
}

export function MovementsTable({ movements, loading, onMovementClick, onCancelClick, onOrderClick }: MovementsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

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

  const getQuantityChangeDisplay = (movement: MovementWithDetails) => {
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

  const getMovementOrigin = (movement: MovementWithDetails) => {
    const userName = movement.user_name || 'Utilisateur inconnu'
    const referenceType = movement.reference_type

    // Mouvement manuel
    if (referenceType === 'manual_adjustment' || referenceType === 'manual_entry') {
      return {
        icon: <Settings className="h-3 w-3 text-blue-600" />,
        text: `Manuel - ${userName}`,
        badge: <Badge variant="default" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Manuel</Badge>
      }
    }

    // Mouvements liés aux commandes
    if (referenceType?.includes('order') || referenceType?.includes('purchase') || referenceType?.includes('sale')) {
      const orderType = referenceType.includes('purchase') ? 'ACHAT' :
                       referenceType.includes('sale') ? 'VENTE' : 'CMD'
      const orderRef = movement.reference_id?.substring(0, 8) || 'INCONNUE'

      return {
        icon: <ShoppingCart className="h-3 w-3 text-purple-600" />,
        text: `Commande ${orderType}-${orderRef} - ${userName}`,
        badge: <Badge variant="default" className="bg-purple-50 text-purple-700 hover:bg-purple-50">Commande</Badge>
      }
    }

    // Autres types de mouvements
    return {
      icon: <Clock className="h-3 w-3 text-gray-600" />,
      text: `${referenceType || 'Non spécifié'} - ${userName}`,
      badge: <Badge variant="secondary">{referenceType || 'Autre'}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date / Heure</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Commande Liée</TableHead>
              <TableHead>Origine</TableHead>
              {onCancelClick && <TableHead className="w-[100px] text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                {onCancelClick && (
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">Aucun mouvement trouvé</p>
          <p className="text-gray-400 text-sm">
            Aucun mouvement de stock ne correspond aux critères de recherche.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date / Heure</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Commande Liée</TableHead>
            <TableHead>Origine</TableHead>
            {onCancelClick && <TableHead className="w-[100px] text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow
              key={movement.id}
              className={onMovementClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
              onClick={() => onMovementClick?.(movement)}
            >
              {/* Date / Heure */}
              <TableCell>
                <div className="font-medium text-sm">
                  {formatDate(movement.performed_at)}
                </div>
                {movement.affects_forecast && (
                  <div className="text-xs text-blue-600 mt-1">
                    Prévisionnel {movement.forecast_type === 'in' ? '↗' : '↘'}
                  </div>
                )}
              </TableCell>

              {/* Produit - Avec lien cliquable */}
              <TableCell>
                <Link
                  href={`/catalogue/${movement.product_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 hover:text-black transition-colors group"
                >
                  <Package className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                  <div>
                    <div className="font-medium text-sm group-hover:underline">
                      {movement.product_name || 'Produit supprimé'}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </TableCell>

              {/* Type */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {getMovementTypeIcon(movement.movement_type)}
                  {getMovementTypeBadge(movement.movement_type)}
                </div>
              </TableCell>

              {/* Quantité */}
              <TableCell>
                {getQuantityChangeDisplay(movement)}
              </TableCell>

              {/* Commande Liée */}
              <TableCell>
                {movement.reference_type === 'sales_order' && movement.reference_id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOrderClick?.(movement.reference_id!, 'sales')
                    }}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                  >
                    <span>Commande Client</span>
                    {movement.affects_forecast && (
                      <Badge variant="outline" className="ml-1 text-xs border-purple-300 text-purple-600">
                        Prév. {movement.forecast_type?.toUpperCase()}
                      </Badge>
                    )}
                  </button>
                ) : movement.reference_type === 'purchase_order' && movement.reference_id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOrderClick?.(movement.reference_id!, 'purchase')
                    }}
                    className="text-sm text-green-600 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                  >
                    <span>Commande Fournisseur</span>
                    {movement.affects_forecast && (
                      <Badge variant="outline" className="ml-1 text-xs border-purple-300 text-purple-600">
                        Prév. {movement.forecast_type?.toUpperCase()}
                      </Badge>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </TableCell>

              {/* Origine */}
              <TableCell>
                <div className="max-w-[250px]">
                  {(() => {
                    const origin = getMovementOrigin(movement)
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {origin.icon}
                          {origin.badge}
                        </div>
                        <div className="text-xs text-gray-600">
                          {movement.user_name || 'Utilisateur inconnu'}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </TableCell>

              {/* Actions */}
              {onCancelClick && (
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCancelClick(movement)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={
                      movement.affects_forecast ||
                      (movement.reference_type !== 'manual_adjustment' &&
                       movement.reference_type !== 'manual_entry' &&
                       !!movement.reference_type)
                    }
                    title={
                      movement.affects_forecast
                        ? "Impossible d'annuler un mouvement prévisionnel"
                        : (movement.reference_type !== 'manual_adjustment' &&
                           movement.reference_type !== 'manual_entry' &&
                           !!movement.reference_type)
                        ? "Impossible d'annuler un mouvement lié à une commande"
                        : "Annuler ce mouvement manuel"
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}