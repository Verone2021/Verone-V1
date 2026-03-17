'use client';

/**
 * 📦 Formulaire Réception Purchase Order
 * Workflow Odoo-inspired avec validation inline
 */

import { useState, useEffect, useMemo } from 'react';

import { ProductThumbnail } from '@verone/products';
import type { ReceptionItem } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { SuccessDialog } from '@verone/ui';
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
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import {
  usePurchaseReceptions,
  type PurchaseOrderForReception,
} from '@verone/orders/hooks';

import { CancelRemainderModal } from '../modals';

interface ReceptionResultSummary {
  isComplete: boolean;
  poNumber: string;
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity_received: number;
  }>;
  totalValue: number;
}

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
    loadCancellationHistory,
  } = usePurchaseReceptions();

  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<
    Array<{
      received_at: string;
      total_quantity: number;
      items?: Array<{
        product_sku: string;
        product_name: string;
        quantity_received: number;
      }>;
    }>
  >([]);
  const [cancellations, setCancellations] = useState<
    Array<{
      id: string;
      performed_at: string;
      notes: string | null;
      quantity_cancelled: number;
      product_name: string;
      product_sku: string;
    }>
  >([]);
  const [showCancelRemainderModal, setShowCancelRemainderModal] =
    useState(false);
  const [receptionResult, setReceptionResult] =
    useState<ReceptionResultSummary | null>(null);

  // Initialiser items
  useEffect(() => {
    const receptionItems = prepareReceptionItems(purchaseOrder);
    setItems(receptionItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder]);

  // Charger historique réceptions
  useEffect(() => {
    void loadReceptionHistory(purchaseOrder.id).then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.id]);

  // Charger historique annulations reliquat
  useEffect(() => {
    void loadCancellationHistory(purchaseOrder.id).then(setCancellations);
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

  // Calculer les items avec reliquat (pour modal annulation)
  const remainderItems = useMemo(() => {
    return items
      .filter(item => item.quantity_remaining > 0)
      .map(item => ({
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity_remaining: item.quantity_remaining,
      }));
  }, [items]);

  // Total reliquat
  const totalRemainder = useMemo(() => {
    return remainderItems.reduce(
      (sum, item) => sum + item.quantity_remaining,
      0
    );
  }, [remainderItems]);

  // Condition pour afficher le bouton "Annuler commande/reliquat"
  // Visible si: status partiellement reçu OU validé (avec ou sans réception)
  const canCancelRemainder = useMemo(() => {
    const hasRemainder = totalRemainder > 0;
    const isPartiallyReceived = purchaseOrder.status === 'partially_received';
    const isValidated = purchaseOrder.status === 'validated';

    // Afficher si: reliquat > 0 ET (partiellement reçu OU validé)
    return hasRemainder && (isPartiallyReceived || isValidated);
  }, [totalRemainder, purchaseOrder.status]);

  // Déterminer si aucune réception n'a été faite (pour le label du bouton)
  const hasNoReceptionYet = useMemo(() => {
    return items.every(item => item.quantity_already_received === 0);
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
      const receivedItems = items
        .filter(item => item.quantity_to_receive > 0)
        .map(item => ({
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity_received: item.quantity_to_receive,
        }));

      setReceptionResult({
        isComplete: totals.allFullyReceived,
        poNumber: purchaseOrder.po_number,
        items: receivedItems,
        totalValue: totals.totalValue,
      });
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
            {purchaseOrder.organisations?.trade_name ??
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
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        src={item.primary_image_url}
                        alt={item.product_name}
                        size="sm"
                      />
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

      {/* Historique enrichi */}
      {(history.length > 0 || cancellations.length > 0) && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-verone-primary" />
            Historique des réceptions ({history.length + cancellations.length})
          </h4>
          <div className="space-y-3">
            {/* Réceptions */}
            {history.map((h, idx) => {
              return (
                <div
                  key={`reception-${idx}`}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  {/* Header réception */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-800">
                        Réception #{idx + 1}
                      </span>
                      <span className="text-gray-500">—</span>
                      <span className="text-gray-600">
                        {formatDate(h.received_at)}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      {h.total_quantity} unité{h.total_quantity > 1 ? 's' : ''}{' '}
                      reçue{h.total_quantity > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Détails par produit */}
                  <div className="space-y-1 ml-6">
                    {h.items?.map((item, itemIdx) => {
                      // Trouver l'item correspondant pour avoir quantity_ordered
                      const orderItem = items.find(
                        i => i.product_sku === item.product_sku
                      );
                      const qtyOrdered = orderItem?.quantity_ordered ?? '?';
                      const isPartial = orderItem
                        ? item.quantity_received < orderItem.quantity_ordered
                        : false;

                      return (
                        <div
                          key={itemIdx}
                          className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">├─</span>
                            <span className="font-medium text-gray-700">
                              {item.product_name ?? item.product_sku}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {item.quantity_received}/{qtyOrdered} reçu
                              {item.quantity_received > 1 ? 's' : ''}
                            </span>
                            {isPartial ? (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600 border-amber-300"
                              >
                                partiel
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-green-600 border-green-300"
                              >
                                complet
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Annulations reliquat */}
            {cancellations.map((c, idx) => {
              // Extraire le motif depuis les notes (format: "Annulation reliquat PO xxx: X unités. Motif")
              const motifMatch = c.notes?.match(/unités\.\s*(.+)$/);
              const motif = motifMatch?.[1]?.trim() ?? null;

              return (
                <div
                  key={`cancellation-${idx}`}
                  className="border rounded-lg p-3 bg-red-50 border-red-200"
                >
                  {/* Header annulation */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-800">
                        Reliquat annulé
                      </span>
                      <span className="text-red-400">—</span>
                      <span className="text-red-600">
                        {formatDate(c.performed_at)}
                      </span>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border border-red-300">
                      {c.quantity_cancelled} unité
                      {c.quantity_cancelled > 1 ? 's' : ''} annulée
                      {c.quantity_cancelled > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Détails annulation */}
                  <div className="space-y-1 ml-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">├─</span>
                      <span className="font-medium text-red-700">
                        {c.product_name}
                      </span>
                      <span className="text-red-500 text-xs">
                        ({c.product_sku})
                      </span>
                    </div>
                    {motif && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">└─</span>
                        <span className="text-red-600 italic">
                          Motif : {motif}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Résumé si commande clôturée avec réception partielle */}
          {purchaseOrder.status === 'received' && cancellations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  Commande clôturée avec réception partielle
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3">
        {/* Bouton Annuler Reliquat (à gauche) */}
        <div>
          {canCancelRemainder && (
            <ButtonV2
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => setShowCancelRemainderModal(true)}
              disabled={validating}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {hasNoReceptionYet
                ? `Annuler commande (${totalRemainder} unités)`
                : `Annuler reliquat (${totalRemainder} unités)`}
            </ButtonV2>
          )}
        </div>

        {/* Boutons Annuler/Valider (à droite) */}
        <div className="flex gap-3">
          <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              void handleValidate();
            }}
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

      {/* Modal Annulation Reliquat */}
      <CancelRemainderModal
        open={showCancelRemainderModal}
        onClose={() => setShowCancelRemainderModal(false)}
        purchaseOrderId={purchaseOrder.id}
        poNumber={purchaseOrder.po_number}
        remainderItems={remainderItems}
        onSuccess={onSuccess}
      />

      {/* Modal Confirmation Réception */}
      <SuccessDialog
        open={receptionResult !== null}
        onOpenChange={open => {
          if (!open) {
            setReceptionResult(null);
            onSuccess();
          }
        }}
        title={
          receptionResult?.isComplete
            ? 'Réception complète validée'
            : 'Réception partielle validée'
        }
        description={`La réception de la commande ${receptionResult?.poNumber ?? ''} a été enregistrée.`}
      >
        {receptionResult && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Produits reçus
              </div>
              <div className="space-y-1.5">
                {receptionResult.items.map(item => (
                  <div
                    key={item.product_sku}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.product_name}
                      </span>
                      <span className="text-gray-400 ml-1.5 text-xs">
                        {item.product_sku}
                      </span>
                    </div>
                    <span className="font-semibold text-green-700">
                      ×{item.quantity_received}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-emerald-50 p-3">
              <span className="text-sm font-medium text-emerald-700">
                Valeur totale HT
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(receptionResult.totalValue)}
              </span>
            </div>
          </div>
        )}
      </SuccessDialog>
    </div>
  );
}
