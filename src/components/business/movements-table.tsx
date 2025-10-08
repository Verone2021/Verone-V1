'use client'

import React from 'react'
import { Clock, User, Package, TrendingUp, TrendingDown, RotateCcw, FileText, Settings, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MovementWithDetails } from '@/hooks/use-movements-history'
import { formatPrice } from '@/lib/utils'

interface MovementsTableProps {
  movements: MovementWithDetails[]
  loading: boolean
  onMovementClick?: (movement: MovementWithDetails) => void
}

export function MovementsTable({ movements, loading, onMovementClick }: MovementsTableProps) {
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
              <TableHead>Motif</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Coût</TableHead>
              <TableHead>Notes</TableHead>
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
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
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
            <TableHead>Motif</TableHead>
            <TableHead>Origine</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Coût</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow
              key={movement.id}
              className={onMovementClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onMovementClick?.(movement)}
            >
              <TableCell>
                <div className="font-medium text-sm">
                  {formatDate(movement.performed_at)}
                </div>
                {movement.affects_forecast && (
                  <div className="text-xs text-black mt-1">
                    Prévisionnel {movement.forecast_type === 'in' ? '↗' : '↘'}
                  </div>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">
                      {movement.product_name || 'Produit supprimé'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {movement.product_sku || 'SKU inconnu'}
                    </div>
                  </div>
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
                        {movement.reason_description}
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
                <div className="max-w-[220px]">
                  {(() => {
                    const origin = getMovementOrigin(movement)
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {origin.icon}
                          {origin.badge}
                        </div>
                        <div className="text-xs text-gray-600 truncate" title={origin.text}>
                          {origin.text}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">
                    {movement.user_name || 'Utilisateur inconnu'}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                {movement.unit_cost ? (
                  <div className="text-sm font-medium">
                    {formatPrice(movement.unit_cost)}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </TableCell>

              <TableCell>
                {movement.notes ? (
                  <div className="max-w-[200px] text-sm text-gray-600 truncate" title={movement.notes}>
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
  )
}