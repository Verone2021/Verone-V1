'use client'

/**
 * 📦 Formulaire Réception Purchase Order
 * Workflow Odoo-inspired avec validation inline
 */

import { useState, useEffect, useMemo } from 'react'
import { Package, CheckCircle2, AlertTriangle, Calendar, User, TrendingUp } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { usePurchaseReceptions, type PurchaseOrderForReception } from '@/hooks/use-purchase-receptions'
import type { ReceptionItem } from '@/types/reception-shipment'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface PurchaseOrderReceptionFormProps {
  purchaseOrder: PurchaseOrderForReception
  onSuccess: () => void
  onCancel: () => void
}

export function PurchaseOrderReceptionForm({
  purchaseOrder,
  onSuccess,
  onCancel
}: PurchaseOrderReceptionFormProps) {
  const supabase = createClient()
  const { prepareReceptionItems, validateReception, validating, loadReceptionHistory } = usePurchaseReceptions()

  const [items, setItems] = useState<ReceptionItem[]>([])
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])

  // Initialiser items
  useEffect(() => {
    const receptionItems = prepareReceptionItems(purchaseOrder)
    setItems(receptionItems)
  }, [purchaseOrder, prepareReceptionItems])

  // Charger historique
  useEffect(() => {
    loadReceptionHistory(purchaseOrder.id).then(setHistory)
  }, [purchaseOrder.id, loadReceptionHistory])

  // Calculer totaux
  const totals = useMemo(() => {
    const totalQuantityToReceive = items.reduce((sum, item) => sum + (item.quantity_to_receive || 0), 0)
    const totalValue = items.reduce((sum, item) => sum + (item.quantity_to_receive * item.unit_price_ht), 0)
    const allFullyReceived = items.every(item =>
      (item.quantity_already_received + item.quantity_to_receive) >= item.quantity_ordered
    )

    return { totalQuantityToReceive, totalValue, allFullyReceived }
  }, [items])

  // Update quantité item
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setItems(prev => prev.map(item =>
      item.purchase_order_item_id === itemId
        ? {
            ...item,
            quantity_to_receive: Math.max(0, Math.min(numValue, item.quantity_remaining))
          }
        : item
    ))
  }

  // Recevoir tout (auto-fill quantités restantes)
  const handleReceiveAll = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      quantity_to_receive: item.quantity_remaining
    })))
  }

  // Validation
  const handleValidate = async () => {
    // Obtenir l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      alert('Erreur: utilisateur non authentifié')
      return
    }

    const itemsToReceive = items
      .filter(item => item.quantity_to_receive > 0)
      .map(item => ({
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        quantity_to_receive: item.quantity_to_receive
      }))

    if (itemsToReceive.length === 0) {
      alert('Veuillez saisir au moins une quantité à recevoir')
      return
    }

    const result = await validateReception({
      purchase_order_id: purchaseOrder.id,
      items: itemsToReceive,
      received_at: receivedAt + 'T' + new Date().toTimeString().split(' ')[0],
      notes: notes || undefined,
      received_by: user.id
    })

    if (result.success) {
      onSuccess()
    } else {
      alert(`Erreur: ${result.error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-verone-primary" />
            Réception Marchandise
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Commande {purchaseOrder.po_number} • {purchaseOrder.organisations?.trade_name || purchaseOrder.organisations?.legal_name}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonV2 variant="outline" onClick={handleReceiveAll}>
            Tout recevoir
          </ButtonV2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">À recevoir</div>
          <div className="text-2xl font-bold mt-1">{totals.totalQuantityToReceive}</div>
          <div className="text-xs text-muted-foreground mt-1">unités</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Valeur</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totals.totalValue)}</div>
          <div className="text-xs text-muted-foreground mt-1">HT</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Statut</div>
          <Badge className="mt-1" variant={totals.allFullyReceived ? "default" : "secondary"}>
            {totals.allFullyReceived ? "Complète" : "Partielle"}
          </Badge>
        </Card>
      </div>

      {/* Table Items */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-center">Commandée</TableHead>
              <TableHead className="text-center">Déjà reçue</TableHead>
              <TableHead className="text-center">Restante</TableHead>
              <TableHead className="text-center">À recevoir</TableHead>
              <TableHead className="text-right">Prix Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.purchase_order_item_id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">{item.product_sku}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{item.quantity_ordered}</TableCell>
                <TableCell className="text-center">
                  {item.quantity_already_received > 0 && (
                    <Badge variant="secondary">{item.quantity_already_received}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{item.quantity_remaining}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity_remaining}
                    value={item.quantity_to_receive}
                    onChange={(e) => handleQuantityChange(item.purchase_order_item_id, e.target.value)}
                    className="w-20 text-center"
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.quantity_to_receive * item.unit_price_ht)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date réception</Label>
          <Input
            type="date"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Notes réception (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Historique réceptions ({history.length})
          </h4>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={idx} className="text-sm border-l-2 border-verone-success pl-3 py-1">
                <div className="font-medium">{formatDate(h.received_at)} • {h.total_quantity} unités</div>
                <div className="text-muted-foreground text-xs">
                  {h.items.map((i: any) => `${i.product_sku}: ${i.quantity_received}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
          Annuler
        </ButtonV2>
        <ButtonV2
          onClick={handleValidate}
          disabled={validating || totals.totalQuantityToReceive === 0}
          className="bg-verone-success hover:bg-verone-success/90"
        >
          {validating ? 'Validation...' : (totals.allFullyReceived ? 'Valider Réception Complète' : 'Valider Réception Partielle')}
        </ButtonV2>
      </div>
    </div>
  )
}
