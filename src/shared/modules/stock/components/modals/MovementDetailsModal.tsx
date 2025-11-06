'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Package, Clock, User, TrendingUp, TrendingDown, RotateCcw, FileText, Euro, MessageSquare, Settings, ShoppingCart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MovementWithDetails } from '@/shared/modules/stock/hooks'
import { formatPrice } from '@/lib/utils'

interface MovementDetailsModalProps {
  movement: MovementWithDetails | null
  isOpen: boolean
  onClose: () => void
}

export function MovementDetailsModal({ movement, isOpen, onClose }: MovementDetailsModalProps) {
  if (!movement) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getMovementTypeIcon = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      case 'ADJUST':
        return <RotateCcw className="h-5 w-5 text-blue-600" />
      case 'TRANSFER':
        return <FileText className="h-5 w-5 text-purple-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getMovementTypeBadge = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return <Badge className="bg-green-100 text-green-800">Entrée de Stock</Badge>
      case 'OUT':
        return <Badge variant="destructive">Sortie de Stock</Badge>
      case 'ADJUST':
        return <Badge className="bg-blue-100 text-blue-800">Ajustement</Badge>
      case 'TRANSFER':
        return <Badge className="bg-purple-100 text-purple-800">Transfert</Badge>
      default:
        return <Badge variant="secondary">{movementType}</Badge>
    }
  }

  const getMovementOrigin = () => {
    const referenceType = movement.reference_type

    if (referenceType === 'manual_adjustment' || referenceType === 'manual_entry') {
      return {
        icon: <Settings className="h-4 w-4 text-blue-600" />,
        text: 'Mouvement Manuel',
        badge: <Badge className="bg-blue-50 text-blue-700">Manuel</Badge>
      }
    }

    if (referenceType?.includes('order') || referenceType?.includes('purchase') || referenceType?.includes('sale')) {
      const orderType = referenceType.includes('purchase') ? 'ACHAT' :
                       referenceType.includes('sale') ? 'VENTE' : 'COMMANDE'
      const orderRef = movement.reference_id?.substring(0, 8) || 'INCONNUE'

      return {
        icon: <ShoppingCart className="h-4 w-4 text-purple-600" />,
        text: `Commande ${orderType}-${orderRef}`,
        badge: <Badge className="bg-purple-50 text-purple-700">Commande</Badge>
      }
    }

    return {
      icon: <Clock className="h-4 w-4 text-gray-600" />,
      text: referenceType || 'Non spécifié',
      badge: <Badge variant="secondary">{referenceType || 'Autre'}</Badge>
    }
  }

  const origin = getMovementOrigin()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getMovementTypeIcon(movement.movement_type)}
            Détails du Mouvement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type et Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Type de Mouvement</label>
              <div className="flex items-center gap-2">
                {getMovementTypeIcon(movement.movement_type)}
                {getMovementTypeBadge(movement.movement_type)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Date et Heure</label>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatDate(movement.performed_at)}
              </div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Produit</label>
            <Link
              href={`/catalogue/${movement.product_id}`}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Image produit */}
              {movement.product_image_url ? (
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image
                    src={movement.product_image_url}
                    alt={movement.product_name || 'Produit'}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Nom + SKU */}
              <div>
                <div className="font-medium">{movement.product_name || 'Produit supprimé'}</div>
                <div className="text-sm text-gray-500">SKU: {movement.product_sku || 'Inconnu'}</div>
              </div>
            </Link>
          </div>

          {/* Quantités */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Changement de Quantité</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Avant</div>
                <div className="text-lg font-bold">{movement.quantity_before}</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Changement</div>
                <div className={`text-lg font-bold ${
                  movement.quantity_change > 0 ? 'text-green-600' :
                  movement.quantity_change < 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Après</div>
                <div className="text-lg font-bold">{movement.quantity_after}</div>
              </div>
            </div>
          </div>

          {/* Origine */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Origine du Mouvement</label>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              {origin.icon}
              <div className="flex-1">
                <div className="font-medium">{origin.text}</div>
                {movement.reference_id && (
                  <div className="text-xs text-gray-500 mt-1">
                    Référence: {movement.reference_id}
                  </div>
                )}
              </div>
              {origin.badge}
            </div>
          </div>

          {/* Utilisateur */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Effectué par</label>
            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{movement.user_name || 'Utilisateur inconnu'}</span>
            </div>
          </div>

          {/* Motif */}
          {movement.reason_code && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Motif</label>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="font-medium">{movement.reason_description}</div>
                <div className="text-sm text-gray-500 mt-1 uppercase">
                  Code: {movement.reason_code}
                </div>
              </div>
            </div>
          )}

          {/* Coût (si disponible) */}
          {movement.unit_cost && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Coût Unitaire</label>
              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                <Euro className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-bold">{formatPrice(movement.unit_cost)}</span>
                <span className="text-sm text-gray-500">HT</span>
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Coût total: </span>
                <span className="font-medium">{formatPrice(movement.unit_cost * Math.abs(movement.quantity_change))}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {movement.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Notes</label>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{movement.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informations complémentaires */}
          {movement.affects_forecast && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm">
                <span className="font-medium text-blue-900">Prévisionnel: </span>
                <span className="text-blue-700">
                  Ce mouvement affecte les prévisions de stock ({movement.forecast_type === 'in' ? 'entrée' : 'sortie'} prévue)
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
