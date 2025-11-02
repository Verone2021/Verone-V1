/**
 * 🆕 Phase 3.5.1: Extraction ProductHistoryModal
 *
 * Composant modal affichant l'historique complet des mouvements d'un produit
 * Réutilisable par /stocks/inventaire, /produits/catalogue/[id], etc.
 *
 * @since Phase 3.5.1 - 2025-11-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  RefreshCw,
  History,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useStockMovements } from '@/hooks/use-stock-movements'

interface ProductHistoryModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
}

export function ProductHistoryModal({ product, isOpen, onClose }: ProductHistoryModalProps) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const { getProductHistory, getReasonDescription } = useStockMovements()

  useEffect(() => {
    if (isOpen && product) {
      loadHistory()
    }
  }, [isOpen, product])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const history = await getProductHistory(product.id)
      setMovements(history as any)
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false)
    }
  }

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      ADJUST: 'Ajustement',
      TRANSFER: 'Transfert'
    }
    return labels[type] || type
  }

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-black text-white',
      OUT: 'bg-gray-700 text-white',
      ADJUST: 'bg-gray-500 text-white',
      TRANSFER: 'bg-gray-400 text-white'
    }
    return colors[type] || 'bg-gray-300 text-black'
  }

  const getSourceInfo = (movement: any) => {
    // Si c'est lié à une commande
    if (movement.reference_type === 'order' && movement.reference_id) {
      return {
        type: 'order',
        label: 'Commande',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id
      }
    }

    // Si c'est lié à une vente
    if (movement.reference_type === 'sale' && movement.reference_id) {
      return {
        type: 'sale',
        label: 'Vente',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id
      }
    }

    // Mouvement manuel
    return {
      type: 'manual',
      label: 'Manuel',
      link: null,
      reference: null
    }
  }

  const getPerformerName = (movement: any) => {
    if (movement.user_profiles) {
      const { first_name, last_name } = movement.user_profiles
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim()
      }
    }
    return 'Admin'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-xl font-bold text-black flex items-center gap-3">
            <History className="h-5 w-5" />
            Historique complet - {product?.name}
            <Badge variant="outline" className="ml-2 text-xs font-mono">
              {product?.sku}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualisez tous les mouvements de stock pour ce produit
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
              <p className="text-sm text-gray-400 mt-1">
                Ce produit n'a pas encore d'historique de mouvements
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header table */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 sticky top-0">
                <div className="col-span-2">Date & Heure</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1 text-right">Quantité</div>
                <div className="col-span-2 text-center">Stock</div>
                <div className="col-span-2">Motif / Notes</div>
                <div className="col-span-2">Par</div>
                <div className="col-span-2">Source</div>
              </div>

              {/* Timeline entries */}
              <div className="relative">
                {/* Ligne verticale timeline */}
                <div className="absolute left-[16.666%] top-0 bottom-0 w-px bg-gray-200" />

                {movements.map((movement: any, index: number) => {
                  const sourceInfo = getSourceInfo(movement)
                  const performerName = getPerformerName(movement)
                  const reasonLabel = movement.reason_code
                    ? getReasonDescription(movement.reason_code)
                    : '-'

                  return (
                    <div
                      key={movement.id}
                      className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm relative"
                    >
                      {/* Date & Heure */}
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-black font-medium">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {new Date(movement.performed_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs ml-4">
                          <Clock className="h-3 w-3" />
                          {new Date(movement.performed_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-1 flex items-center relative z-10">
                        {/* Dot sur la timeline */}
                        <div className="absolute left-[-8.333%] w-2 h-2 rounded-full bg-black border-2 border-white" />
                        <Badge className={`text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </Badge>
                      </div>

                      {/* Quantité */}
                      <div className="col-span-1 flex items-center justify-end">
                        <span className={`font-bold text-base ${
                          movement.quantity_change > 0 ? 'text-black' : 'text-gray-700'
                        }`}>
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                        </span>
                      </div>

                      {/* Stock (avant → après) */}
                      <div className="col-span-2 flex items-center justify-center gap-2 font-mono text-sm">
                        <span className="text-gray-500">{movement.quantity_before}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-black font-bold">{movement.quantity_after}</span>
                      </div>

                      {/* Motif / Notes */}
                      <div className="col-span-2 flex flex-col gap-1">
                        {movement.reason_code && (
                          <span className="text-gray-900 text-xs font-medium">
                            {reasonLabel}
                          </span>
                        )}
                        {movement.notes && (
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {movement.notes}
                          </span>
                        )}
                        {!movement.reason_code && !movement.notes && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>

                      {/* Par (Performer) */}
                      <div className="col-span-2 flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-900 text-xs font-medium truncate">
                          {performerName}
                        </span>
                      </div>

                      {/* Source */}
                      <div className="col-span-2 flex items-center gap-2">
                        {sourceInfo.type === 'manual' ? (
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                            <FileText className="h-3 w-3 mr-1" />
                            {sourceInfo.label}
                          </Badge>
                        ) : (
                          <Link
                            href={sourceInfo.link || '#'}
                            className="flex items-center gap-1.5 text-black hover:text-gray-700 transition-colors group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge className="bg-black text-white text-xs group-hover:bg-gray-700 transition-colors">
                              {sourceInfo.label}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-black" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer stats */}
        {movements.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-black">
                  {movements.length} mouvement{movements.length > 1 ? 's' : ''}
                </span>
                <span>Stock actuel: <strong className="text-black">{product?.stock_quantity || 0}</strong></span>
              </div>
              <span className="text-gray-500">
                Dernier mouvement: {movements[0] ? new Date((movements[0] as any).performed_at).toLocaleDateString('fr-FR') : 'Aucun'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
