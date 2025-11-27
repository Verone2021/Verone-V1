'use client';

/**
 * 📦 Formulaire Réception Purchase Order
 * Workflow Odoo-inspired avec validation inline
 */

import { useState, useEffect, useMemo } from 'react';

import type { ReceptionItem } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { formatDate, formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  TrendingUp,
} from 'lucide-react';

import {
  usePurchaseReceptions,
  type PurchaseOrderForReception,
} from '@verone/orders/hooks';

interface PurchaseOrderReceptionFormProps {
  purchaseOrder: PurchaseOrderForReception;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseOrderReceptionForm({
  purchaseOrder,
  onSuccess,
  onCancel,
}: PurchaseOrderReceptionFormProps) {
  const supabase = createClient();
  const {
    prepareReceptionItems,
    validateReception,
    validating,
    loadReceptionHistory,
  } = usePurchaseReceptions();

  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // Initialiser items
  useEffect(() => {
    const receptionItems = prepareReceptionItems(purchaseOrder);
    setItems(receptionItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder]);

  // Charger historique
  useEffect(() => {
    loadReceptionHistory(purchaseOrder.id).then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.id]);

  // Calculer totaux
  const totals = useMemo(() => {
    const totalQuantityToReceive = items.reduce(
      (sum, item) => sum + (item.quantity_to_receive || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity_to_receive * item.unit_price_ht,
      0
    );
    const allFullyReceived = items.every(
      item =>
        item.quantity_already_received + item.quantity_to_receive >=
        item.quantity_ordered
    );

    return { totalQuantityToReceive, totalValue, allFullyReceived };
  }, [items]);

  // Update quantité item
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setItems(prev =>
      prev.map(item =>
        item.purchase_order_item_id === itemId
          ? {
              ...item,
              quantity_to_receive: Math.max(
                0,
                Math.min(numValue, item.quantity_remaining)
              ),
            }
          : item
      )
    );
  };

  // Recevoir tout (auto-fill quantités restantes)
  const handleReceiveAll = () => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        quantity_to_receive: item.quantity_remaining,
      }))
    );
  };

  // Validation
  const handleValidate = async () => {
    // Obtenir l'utilisateur courant
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      alert('Erreur: utilisateur non authentifié');
      return;
    }

    const itemsToReceive = items
      .filter(item => item.quantity_to_receive > 0)
      .map(item => ({
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        quantity_to_receive: item.quantity_to_receive,
      }));

    if (itemsToReceive.length === 0) {
      alert('Veuillez saisir au moins une quantité à recevoir');
      return;
    }

    const result = await validateReception({
      purchase_order_id: purchaseOrder.id,
      items: itemsToReceive,
      received_at: new Date(
        `${receivedAt}T${new Date().toTimeString().split(' ')[0]}`
      ).toISOString(),
      notes: notes || undefined,
      received_by: user.id,
    });

    if (result.success) {
      onSuccess();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

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
            Commande {purchaseOrder.po_number} •{' '}
            {purchaseOrder.organisations?.trade_name ||
              purchaseOrder.organisations?.legal_name}
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
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-sm font-medium text-gray-600">À recevoir</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {totals.totalQuantityToReceive}
          </div>
          <div className="text-xs text-gray-500 mt-1">unités</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-sm font-medium text-gray-600">Valeur</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {formatCurrency(totals.totalValue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">HT</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-sm font-medium text-gray-600">
            Statut réception
          </div>
          <Badge
            className={`mt-2 ${totals.allFullyReceived ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
          >
            {totals.allFullyReceived ? '✓ Complète' : '⏳ Partielle'}
          </Badge>
        </Card>
      </div>

      {/* Table Items */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Produit</TableHead>
              <TableHead className="text-center font-semibold text-blue-700">
                Commandée
              </TableHead>
              <TableHead className="text-center font-semibold text-green-700">
                Déjà reçue
              </TableHead>
              <TableHead className="text-center font-semibold text-amber-700">
                Restante
              </TableHead>
              <TableHead className="text-center font-semibold text-indigo-700">
                À recevoir
              </TableHead>
              <TableHead className="text-right font-semibold">
                Prix Unit.
              </TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const progressPercent =
                item.quantity_ordered > 0
                  ? Math.round(
                      (item.quantity_already_received / item.quantity_ordered) *
                        100
                    )
                  : 0;

              return (
                <TableRow
                  key={item.purchase_order_item_id}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-gray-500">
                        {item.product_sku}
                      </div>
                      {/* Mini barre de progression */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600 text-lg">
                      {item.quantity_ordered}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity_already_received > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border border-green-300">
                        ✓ {item.quantity_already_received}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity_remaining > 0 ? (
                      <span className="font-semibold text-amber-600 text-lg">
                        {item.quantity_remaining}
                      </span>
                    ) : (
                      <Badge className="bg-green-500 text-white">Complet</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity_remaining}
                      value={item.quantity_to_receive}
                      onChange={e =>
                        handleQuantityChange(
                          item.purchase_order_item_id,
                          e.target.value
                        )
                      }
                      className="w-20 text-center border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {formatCurrency(item.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(
                        item.quantity_to_receive * item.unit_price_ht
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
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
            onChange={e => setReceivedAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Notes réception (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
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
              <div
                key={idx}
                className="text-sm border-l-2 border-verone-success pl-3 py-1"
              >
                <div className="font-medium">
                  {formatDate(h.received_at)} • {h.total_quantity} unités
                </div>
                <div className="text-muted-foreground text-xs">
                  {h.items
                    .map((i: any) => `${i.product_sku}: ${i.quantity_received}`)
                    .join(', ')}
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
          {validating
            ? 'Validation...'
            : totals.allFullyReceived
              ? 'Valider Réception Complète'
              : 'Valider Réception Partielle'}
        </ButtonV2>
      </div>
    </div>
  );
}
